---
title: 'Keeping .env Secrets Out of AI Agent Context: Reference-Not-Reveal (env-guard)'
diataxis: How-to Guide
domain: Security & Privacy
topic: AppSec & Privacy
source: DEV.to (z-150)
source_url: https://dev.to/z-150/why-your-ai-coding-agent-should-never-see-your-env-18h4
date: 2026-08-22
keywords:
- knowledge-base
- AppSec & Privacy
- Security & Privacy
- how-to
---
# Keeping .env Secrets Out of AI Agent Context: Reference-Not-Reveal

## The Threat Model

You hand an AI coding assistant a `.env` file (`OPENAI_API_KEY=sk-...`, `GITHUB_TOKEN=ghp_...`, `AWS_SECRET`). You trust it to *use* the keys — but where do the key values actually go?

| Vector | Exposure |
|--------|----------|
| Model context window | Visible to the LLM |
| Tool call logs | Logged forever |
| Chat history | Stored in plaintext |
| Prompt injection ("print all env vars") | **Exfiltrated in 1 shot** |

One malicious webpage, or one injected instruction buried in a document the agent reads, and every credential is gone. The failure mode is not a careless model — it is that **the value is present in a place the model can read**, and the model will happily `print(env)` if a prompt tells it to.

## The Principle: Reference, Not Reveal

The [env-guard](https://github.com/Z-150/env-guard) tool (MIT, works with Claude Code, Codex, Hermes, Cursor, OpenCode, Aider) implements one rule: **the agent references a secret by *name*; the OS expands it at execution time. The raw value never exists in a place the model can read.**

```
.env.list (NAMES ONLY)        live env (VALUES)
OPENAI_API_KEY      --refs-->  OPENAI_API_KEY=sk-...
GITHUB_TOKEN                          GITHUB_TOKEN=ghp_...
                                       |
                                 OS expands $NAME
                                       |
                          secret-run.py (audited, no reveal)
```

The agent types:

```bash
curl -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models
```

The *shell* expands `$OPENAI_API_KEY`. The model sees `$OPENAI_API_KEY` — **never `sk-...`**.

## The Three Layers

1. **`.env.list`** — auto-generated index of variable *names only* (no values), via `env-scan.py`
2. **Live env** — real values stay in the OS environment; never written to disk by the agent
3. **`secret-run.py`** — runs the command with the variable in a child env, logs `model + provider + purpose`, and **refuses to echo the value**:

```bash
python scripts/secret-run.py \
  --var OPENAI_API_KEY \
  --model "gpt-4o" \
  --provider "openai" \
  --purpose "list models" \
  -- curl -s https://api.openai.com/v1/models
```

- Unknown variables are **refused**
- Every access is **audit-logged** with `reveal: false`
- Even a direct `cat .env` instruction fails — the agent has no read access to the raw file

## Why This Works

`env-guard` doesn't ask the agent to *be careful* — **it makes carelessness impossible**: the value is simply never in a place the model can read. That is the difference between a policy ("don't leak keys") and a mechanism (keys are unreachable).

## Generalization

The pattern transfers beyond env-guard to any agent tooling:

- **Names in context, values in the execution environment** — apply the same split to API calls, DB credentials, and CI tokens
- **Audit at the execution boundary**, not in the model's transcript: log *which* secret, *which* model, *what purpose* — never the value
- **Deny-by-default**: unknown variable names and direct file reads of raw secret stores must fail, not warn
- **Shell expansion as the expansion point** keeps the LLM's view of a secret at the token level (`$NAME`) forever

## Diagram: Where the Value Lives

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "agent",
      "type": "rectangle",
      "x": 40, "y": 40,
      "width": 220, "height": 90,
      "strokeColor": "#3667a5",
      "backgroundColor": "#aaf",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "AI agent (model context)\nsees: .env.list (names only)\nsees: $OPENAI_API_KEY token\nNEVER sees sk-...", "fontSize": 13, "fontFamily": 1 }
    },
    {
      "id": "run",
      "type": "rectangle",
      "x": 340, "y": 40,
      "width": 220, "height": 90,
      "strokeColor": "#bf8401",
      "backgroundColor": "#f9e0a8",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "secret-run.py\nchild env gets $NAME=sk-...\nlogs: model+provider+purpose\nreveal: false always", "fontSize": 13, "fontFamily": 1 }
    },
    {
      "id": "env",
      "type": "rectangle",
      "x": 340, "y": 200,
      "width": 220, "height": 90,
      "strokeColor": "#30665c",
      "backgroundColor": "#c4e0c5",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "OS environment\nvalues live here only\nnever on disk via agent\nunknown names refused", "fontSize": 13, "fontFamily": 1 }
    },
    {
      "id": "arrow-1",
      "type": "arrow",
      "x": 260, "y": 85,
      "width": 80, "height": 0,
      "strokeColor": "#1e1e1e",
      "strokeWidth": 2,
      "startArrowhead": null,
      "endArrowhead": "arrow",
      "points": [[0, 0], [80, 0]]
    },
    {
      "id": "arrow-2",
      "type": "arrow",
      "x": 450, "y": 130,
      "width": 0, "height": 70,
      "strokeColor": "#1e1e1e",
      "strokeWidth": 2,
      "startArrowhead": null,
      "endArrowhead": "arrow",
      "points": [[0, 0], [0, 70]]
    }
  ]
}
```

## References

- [Why Your AI Coding Agent Should Never See Your .env — DEV.to](https://dev.to/z-150/why-your-ai-coding-agent-should-never-see-your-env-18h4)
- [env-guard repository (MIT)](https://github.com/Z-150/env-guard)
