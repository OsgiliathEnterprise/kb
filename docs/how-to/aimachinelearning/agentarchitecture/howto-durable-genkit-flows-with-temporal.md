---
title: 'Making Genkit Flows Durable with Temporal: the genkitx-temporal Plugin'
diataxis: How-to Guide
domain: ai-machine-learning
topic: agent-architecture
source: DZone AI/ML
source_url: https://dzone.com/articles/genkit-temporal-workflows
date: 2026-11-06
keywords:
- knowledge-base
- agent-architecture
- ai-machine-learning
- how-to
---
# Making Genkit Flows Durable with Temporal: the genkitx-temporal Plugin

A Genkit flow is "just a function": it lives and dies with the process that
invokes it — no durable history, no retry policy, no cancellation, no ops UI.
When a pod restarts halfway through a 12-step agent plan, or a model provider
throws 5xx/429s, the flow is simply lost. `genkitx-temporal` (community plugin
by Xavier Portilla Edo) executes any Genkit flow inside a **Temporal
Workflow**, turning flows into durable, retryable, observable workloads
without rewriting flow code.

## The core architectural trick

Temporal **Workflows must be deterministic** (they are replayed from event
history after crashes/deploys). LLM calls are not deterministic. The plugin
ships a generic workflow `runGenkitFlow` that invokes a single Activity
`runGenkitFlowActivity`, which runs your flow in a full Node environment
where network/model/tool/RAG calls are safe:

```
┌────────────┐  start workflow   ┌──────────────────────┐
│  Client    │ ────────────────▶ │  Temporal Server     │
└────────────┘                   └─────────┬────────────┘
                                           │ task
                                           ▼
                                ┌──────────────────────┐
                                │  Worker process      │
                                │  ┌────────────────┐  │
                                │  │ runGenkitFlow  │  │  (workflow, sandboxed)
                                │  │       │        │  │
                                │  │       ▼        │  │
                                │  │ runGenkit-     │  │  (activity, full Node)
                                │  │ FlowActivity   │  │
                                │  │       │        │  │
                                │  │       ▼        │  │
                                │  │  your Genkit   │  │
                                │  │  flow (LLM…)   │  │
                                │  └────────────────┘  │
                                └──────────────────────┘
```

This buys you, declaratively: exponential-backoff retries with non-retryable
error types; durable per-event history (a killed Worker resumes exactly where
it left off — no partial state, no double-charging users); start-to-close /
schedule-to-close / heartbeat timeouts + cancellation (e.g. user closed the
tab); Temporal UI as an operational dashboard (complementing Genkit's
Developer UI as the local debugging tool); horizontal scale by adding Worker
processes on the same task queue; and long-running human-in-the-loop waits
(workflows can sleep for days and resume on signals).

## Step 1 — Install

```shell
npm install genkitx-temporal genkit
```

Temporal SDK packages are peer-installed automatically. You need a Temporal
Server; for local development:

```shell
brew install temporal
temporal server start-dev
# server on localhost:7233, UI on http://localhost:8233
```

## Step 2 — Define a flow with `defineTemporalFlow`

Drop-in replacement for `ai.defineFlow` — the returned object is still a
normal Genkit flow (callable directly, in tests, via the Developer UI), but
it is also registered so a Worker can find it by name:

```typescript
// flows.ts
import { genkit, z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { defineTemporalFlow, temporal } from 'genkitx-temporal';

export const ai = genkit({
  plugins: [
    googleAI(),
    temporal({ taskQueue: 'my-queue' }),
  ],
  model: googleAI.model('gemini-flash-latest'),
});

export const jokeFlow = defineTemporalFlow(
  ai,
  { name: 'jokeFlow', inputSchema: z.string(), outputSchema: z.string() },
  async (subject) => {
    const { text } = await ai.generate(`Tell me a joke about ${subject}`);
    return text;
  },
);
```

No Temporal imports inside the flow body — no `proxyActivities`, no
determinism gymnastics. The flow's `name` is its Temporal registration key;
keep it unique per Worker.

## Step 3 — Start a Worker

```typescript
// worker.ts
import './flows';   // side-effect import: registers the flows
import { startTemporalWorker } from 'genkitx-temporal';

startTemporalWorker({ taskQueue: 'my-queue' })
  .catch((e) => { console.error(e); process.exit(1); });
```

Run `node ./dist/worker.js`. Scale by running many Workers against the same
task queue — Temporal distributes work and reassigns flows from dead Workers.

## Step 4 — Execute from any client

```typescript
// client.ts
import { executeTemporalFlow } from 'genkitx-temporal';
import { jokeFlow } from './flows';

const result = await executeTemporalFlow(jokeFlow, 'cats', {
  taskQueue: 'my-queue',
});
```

## What keeps working unchanged

Retrievers/indexers/embedders/rerankers inherit retry policies (ingestion
jobs survive mid-batch restarts); evaluators can run as scheduled/fanned-out
workflows; `.prompt` files and structured outputs work as-is; any Genkit
model/provider plugin works (the Temporal layer is provider-agnostic);
Genkit's OpenTelemetry traces keep emitting from inside the activity
alongside Temporal's event history; and HTTP/Cloud Functions/Express entry
points can be mixed with Temporal entry points (quick chats over HTTP, long
agent runs through Temporal).

## When not to use it

Single-turn, fast chat endpoints: plain HTTP invocation is simpler. Reach for
it when you have multi-step agents, RAG ingestion, eval jobs, or anything
where a mid-flight process kill is unacceptable.

## Related notes

- `explanation-durable-ai-agent-workflow-checkpointing.md` (if present) /
  `explanation-human-in-the-loop-approval-gates.md` — Temporal signals map
  naturally onto approval gates.

## References

- **Durable Genkit Flows With Temporal (DZone / original on xavidop.me)**: [https://dzone.com/articles/genkit-temporal-workflows](https://dzone.com/articles/genkit-temporal-workflows)
- **Plugin source**: [https://github.com/xavidop/genkitx-temporal](https://github.com/xavidop/genkitx-temporal)
- **Plugin docs**: [https://xavidop.github.io/genkitx-temporal/](https://xavidop.github.io/genkitx-temporal/)
- **Runnable example**: [https://github.com/xavidop/genkitx-temporal/tree/main/examples/test-app](https://github.com/xavidop/genkitx-temporal/tree/main/examples/test-app)
