---
title: How to Make LangGraph Node Failures Debuggable — What the Task Stream and Checkpoints
  Actually Record
diataxis: How-to Guide
domain: ai-machine-learning
topic: agent-architecture
source: DEV.to Tech News
source_url: https://dev.to/priyansh_singhal_5975e7d3/what-your-langgraph-logs-miss-when-a-node-fails-3l97
date: 2026-10-07
keywords:
- knowledge-base
- agent-architecture
- ai-machine-learning
- how-to
---
# How to Make LangGraph Node Failures Debuggable — What the Task Stream and Checkpoints Actually Record

When a LangGraph run dies, the default log usually tells you the same thing twice: *a node started, a node stopped, an exception was raised*. It almost never tells you **what the node was given**. This note is based on a controlled experiment (LangGraph 1.2.12 + checkpoint 4.2.0, Python 3.14.7, no LLM involved) that broke a three-node graph two different ways and checked what each run actually recorded.

## The test setup

A three-node graph: `fetch` → `parse` → `write`, with an in-memory checkpointer so saved steps can be read after the run. Two failure scenarios: (1) a transient `TimeoutError` that a retry policy should absorb, and (2) a fetch that returns an HTML error page where JSON is expected.

```python
import json
from typing import TypedDict
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.types import RetryPolicy

class State(TypedDict, total=False):
    raw: str
    parsed: dict
    result: str

def fetch(state):
    return {"raw": '{"id": 7, "items": [1, 2, 3]}'}

def parse(state):
    return {"parsed": json.loads(state["raw"])}

def write(state):
    return {"result": f"wrote {len(state['parsed']['items'])} items"}

graph = StateGraph(State)
graph.add_node("fetch", fetch, retry_policy=RetryPolicy(max_attempts=3, retry_on=TimeoutError))
graph.add_node("parse", parse)
graph.add_node("write", write)
graph.add_edge(START, "fetch")
graph.add_edge("fetch", "parse")
graph.add_edge("parse", "write")
graph.add_edge("write", END)
app = graph.compile(checkpointer=InMemorySaver())

config = {"configurable": {"thread_id": "run-1"}}
for event in app.stream({}, config, stream_mode="tasks", version="v2"):
    print(event["type"], event["data"].get("name"))
```

## What each run actually recorded

| Scenario | Checkpoints saved | Task stream showed | The gap |
| --- | --- | --- | --- |
| Clean run | 5 (input, one per node, end) | start + finish for all three nodes | baseline — nothing surprising |
| Transient timeout (retry succeeded) | same 5 as clean run | **one** start and **one** finish for `fetch` | the retry left no trace in the stream; only a counter inside the node proved fetch ran twice |
| Bad input (`<html>` where JSON expected) | 3, then raised `JSONDecodeError` in `parse` | `parse`'s *start* event carried the bad payload — but **no error or finish event** for parse | the exception came out of the stream call itself; a logger that only records finishes/error events misses it entirely |

Two structural findings:

1. **The task stream does not report retries.** A retry that succeeds is invisible in `tasks` mode. LangGraph's own retry code writes one line through its logger at INFO level (`langgraph.pregel._retry`, "Retrying task fetch ... (attempt 1)") — so the record exists *outside* the stream, but only if you enable that logger.
2. **The failure reached user code as an exception from `app.stream()`, not as a stream event.** The bad payload was visible in exactly two places: the start event for `parse`, and the checkpoint saved just before the failure (step 1, next node `parse`, state holding the raw `<html>error page</html>` string). A print statement that records only task names throws both away.

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "c1",
      "type": "rectangle",
      "x": 40,
      "y": 60,
      "width": 180,
      "height": 70,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#c4e0f2",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "checkpoint step 0\n(input state)", "fontSize": 13, "fontFamily": 1 }
    },
    {
      "id": "c2",
      "type": "rectangle",
      "x": 260,
      "y": 60,
      "width": 180,
      "height": 70,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#d9ccff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "checkpoint step 1\n(raw = '<html>error page</html>')\nnext node: parse", "fontSize": 13, "fontFamily": 1 }
    },
    {
      "id": "c3",
      "type": "rectangle",
      "x": 480,
      "y": 60,
      "width": 180,
      "height": 70,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#f9d3d3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "parse raises JSONDecodeError\nNO finish event in stream\nexception escapes app.stream()", "fontSize": 13, "fontFamily": 1 }
    },
    [
      {
        "id": "ca1",
        "type": "arrow",
        "x": 220,
        "y": 95,
        "width": 40,
        "height": 0,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [[0, 0], [40, 0]]
      }
    ],
    [
      {
        "id": "ca2",
        "type": "arrow",
        "x": 440,
        "y": 95,
        "width": 40,
        "height": 0,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [[0, 0], [40, 0]]
      }
    ]
  ]
}
```

## Procedure: what to log before it fails

Each item below maps to something the default print-based approach threw away or could not see.

1. **Capture retry attempts.** Either count them inside the node (a simple counter) or enable LangGraph's retry logger at INFO so each retry is recorded with its exception (`langgraph.pregel._retry`).
2. **Record the input each node received** — or at least its size and a hash. The checkpoint held the HTML payload here, but a checkpoint only exists if you persisted one; without persistence, node-level logs are your only evidence.
3. **Put the thread ID and checkpoint step on every log line**, so any log entry can be joined to the saved state in the checkpointer.
4. **Log the exception together with the payload that caused it**, at the exact boundary where parsing happens — not just "node failed".

### Cost caveat (do this deliberately)

Items 2 and 4 have a privacy cost: checkpoints store full state, and logs containing raw payloads can leak whatever the payload contains. The safe default is **log size + hash by default; keep full payloads only for nodes that actually failed, with redaction before anything leaves the process**.

## When this is enough — and when it isn't

- Enough for: explaining *why* a specific run failed (input → exception chain reconstructable from checkpoint + boundary logs), and detecting retry storms via attempt counters.
- Not enough for: estimating how often failures happen in production (one run per scenario shows the mechanism, not the frequency) — you still need aggregate metrics on node failure rates, retry counts, and give-up rates across threads.

## Key takeaways

- The task stream is a *lifecycle* view, not an *evidence* view: it hides successful retries and delivers hard failures as exceptions rather than events.
- Checkpoints are the durable evidence store — but only if you actually persist them (in-memory savers vanish with the process).
- Design your logging around "what would I need to explain this failure without re-running it": input identity, attempt count, thread/step correlation, and exception-with-payload at the parse boundary.

## Related notes

- `ai-machine-learning/agent-architecture/howto-build-effectively-once-agent-workflows.md`
- `system-design/Observability/*` — general observability patterns for distributed systems

## References

- [What Your LangGraph Logs Miss When a Node Fails (DEV.to)](https://dev.to/priyansh_singhal_5975e7d3/what-your-langgraph-logs-miss-when-a-node-fails-3l97)
- [LangGraph documentation — streaming and checkpointing](https://langchain-ai.github.io/langgraph/)
