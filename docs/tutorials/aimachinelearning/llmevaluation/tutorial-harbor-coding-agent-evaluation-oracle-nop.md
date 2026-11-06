---
title: 'Evaluating Coding Agents Rigorously with Harbor: Isolated Environments, Hidden
  Tests, Oracle/NOP Proofs'
diataxis: Tutorial
domain: ai-machine-learning
topic: llm-evaluation
source: DZone AI/ML
source_url: https://dzone.com/articles/ai-agent-evaluation-harbor
date: 2026-11-06
keywords:
- knowledge-base
- llm-evaluation
- ai-machine-learning
- tutorials
---
# Evaluating Coding Agents Rigorously with Harbor: Isolated Environments, Hidden Tests, Oracle/NOP Proofs

Coding agents pass some benchmarks impressively and stumble on tasks that
look easier. Worse, **an agent under evaluation has an incentive problem a
human doesn't: if the grading is visible or guessable, it can satisfy the
grading without doing the work** (pass the test without fixing the bug, or
produce output that looks right). Harbor — the open-source framework from the
Terminal-Bench team — exists to make "is this agent actually good at X, or
just good at *appearing* good" answerable.

## The three requirements (before any tooling)

1. **An isolated environment that isn't your machine** — a container, so every
   attempt starts from the exact same clean state or comparisons are
   meaningless.
2. **A plain-language task that says *what*, never *how*** — "open the file,
   find the loop on line 12, change `&lt;=` to `&lt;`" tests instruction-following,
   not debugging. Describe the *symptom*, like a real bug report.
3. **A check hidden from the thing being tested** — if the agent can read the
   test file, it can satisfy the assertions directly or edit the test. This
   single constraint is the core idea; everything else follows from it.

## Harbor's task layout maps 1:1 to those requirements

```
my-task/
├── instruction.md      # the plain-language ask
├── task.toml           # metadata/config
├── environment/
│   └── Dockerfile      # the isolated place the agent works
├── solution/
│   └── solve.sh        # a reference answer (kept hidden)
└── tests/
    ├── test.sh         # the hidden check, runs after the agent
    └── test_outputs.py # what the check actually verifies
```

`tests/` is a **sibling** of `environment/`, not nested inside it — it never
gets copied into the agent's container. `solution/` exists for *you*, the
task author: before trusting a test you must prove a correct answer passes it
and a wrong answer fails it.

## The trial lifecycle and the two proof agents

One agent attempt at one task = a **trial**; its result is a **reward**
(`1`/`0`) written by the test script to `/logs/verifier/reward.txt`.

- **Oracle agent** — no reasoning; just runs `solution/solve.sh`. If Oracle
  can't pass your test, the task is broken before any real agent touches it.
- **NOP agent** — submits the environment completely untouched. If NOP passes,
  **your test isn't checking anything**.

Discipline: **Oracle must pass, NOP must fail.** Neither check alone tells
you the task is good.

## Worked example 1: build-from-scratch (FastAPI `/add`)

`instruction.md` states the contract only: `POST /add`, body `{"a": 2, "b": 3}`
→ `{"result": 5}`, app importable as `main:app`, accept ints and floats, 422
on bad input is fine.

`environment/Dockerfile` (deliberately *not* including the solution):

```dockerfile
FROM python:3.11-slim
WORKDIR /app
RUN pip install --no-cache-dir fastapi uvicorn pytest httpx
```

Hidden check with FastAPI's own `TestClient`:

```python
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_add_integers():
    resp = client.post("/add", json={"a": 2, "b": 3})
    assert resp.status_code == 200
    assert resp.json() == {"result": 5}

def test_missing_field_returns_422():
    resp = client.post("/add", json={"a": 2})
    assert resp.status_code == 422
```

The verifier entrypoint copies the test into `/app`, runs pytest, and writes
the reward file:

```bash
#!/bin/bash
cp "$(dirname "$0")/test_outputs.py" /app/test_outputs.py
cd /app
pytest test_outputs.py -v
if [ $? -eq 0 ]; then echo 1 > /logs/verifier/reward.txt; fi
```

## Worked example 2: debugging task — and how NOP exposed a hollow test

Real-project bug: an HTTP adapter failed to raise on error responses. The
instruction mentions only the *symptom* ("returns malformed data without
raising any exception — investigate how HTTP error responses are detected") —
no mention of `400` or the comparison operator.

First run exposed the trap:

```shell
harbor trials start -p . --agent oracle   # reward: 1.0, expected
harbor trials start -p . --agent nop      # reward: 1.0, NOT expected
```

NOP scoring 1.0 on a task where the bug was never fixed = the test suite was
decoration. The fix was pinning the exact boundary (`>=` vs `>`) with a test
that status **exactly 400** raises, plus a companion proving **399 succeeds**
— both sides of the boundary. After that, NOP correctly dropped to 0.0.

> **A held-out test only counts if it fails on the buggy version and passes
> on the fixed one.** If it would pass either way, it isn't a test.

## Running real agents

```shell
uv run harbor run -d <task-set> --agent claude-code --model anthropic/<model> \
  --ak reasoning_effort=max --n-concurrent 100 --env modal
```

## What transfers beyond Harbor

Isolate the environment, describe the symptom without describing the fix,
hide the check from the thing being checked, and **prove your check can fail
before you trust that it can pass** — the discipline transfers to any
evaluation framework (SWE-bench-style harnesses included).

## References

- **How to Evaluate Coding Agents With Harbor (DZone)**: [https://dzone.com/articles/ai-agent-evaluation-harbor](https://dzone.com/articles/ai-agent-evaluation-harbor)
- **Harbor framework (GitHub)**: [https://github.com/harbor-framework/harbor](https://github.com/harbor-framework/harbor)
- **Terminal-Bench (GitHub)**: [https://github.com/harbor-framework/terminal-bench](https://github.com/harbor-framework/terminal-bench)
