---
title: 'contradiction-judge: A Memory Auditor for AI Agents — Detecting and Arbitrating
  Conflicting Memories'
diataxis: Explanation
domain: ai-machine-learning
topic: agent-architecture
source: DEV.to Tech News
source_url: https://dev.to/haoli/contradiction-judge-the-memory-auditor-your-ai-agents-are-missing-4288
date: 2026-10-21
keywords:
- knowledge-base
- agent-architecture
- ai-machine-learning
- explanations
---
# contradiction-judge: A Memory Auditor for AI Agents — Detecting and Arbitrating Conflicting Memories

AI agents remember things. Over weeks of conversations they accumulate facts: *you are 20, you love pizza, you live in Pasadena*. But memory systems almost never check whether those facts **agree with each other**. When a new memory says "you are 21" and an old one says "you are 20," one of them is wrong — a stale entry, a misheard sentence, an upstream bug — and nobody notices.

**contradiction-judge** (`pip install contradiction-judge`) fixes that: feed it a JSON file of memory entries, it returns every contradicting pair **plus an arbitration suggestion** telling you which entry should win.

```bash
contradiction-judge check memory.json
```

```json
{
  "entries": 2,
  "pairs_checked": 1,
  "contradictions": [
    {
      "entry_a": "m1",
      "entry_b": "m2",
      "kind": "numeric",
      "engine": "rules",
      "explanation": "'I am 20 years old.' vs 'I am 21 years old.': person.age cannot be both 20.0 and 21.0.",
      "arbitration": {
        "strategy": "recency",
        "recommendation": "keep m2, drop or correct m1",
        "reason": "Both entries are timestamped; the newer record (m2) is more likely to be current."
      }
    }
  ]
}
```

## Two layers

**Rules (stdlib only, zero dependencies).** Catches:

- **Numeric conflicts** ("20 years old" vs "21 years old") — unit-aware: "240 months old" == "20 years old"
- **Date conflicts** ("birthday May 5, 2006" vs "2006-06-01")
- **Factual conflicts** (name, location)
- **Polarity conflicts** ("I love pizza" vs "I hate pizza", "I am a student" vs "I am not a student")

**A pluggable LLM judge hook** for the subtle stuff rules can't see:

```python
from contradiction_judge import check_memories, set_judge

def gpt_judge(text_a, text_b):
    # call your model; return {"contradiction": bool, "explanation": str}
    ...

set_judge(gpt_judge)
report = check_memories(entries)  # semantic pairs also get judged
```

The hook only runs on pairs the rules did **not** flag, so you pay for LLM calls only where they add value (`--hook module:func` on the CLI).

## How it differs from memgovern

- **memgovern** is a *governance* framework — provenance tracking, source trust levels, write policies, retention rules. It answers **"should this memory be trusted and kept?"**
- **contradiction-judge** is the *auditor*. It answers **"do these memories contradict each other, and which one should win?"** — semantic fact-contradiction detection with arbitration suggestions.

Same roadmap family, different job: govern with memgovern, audit with contradiction-judge.

## Design notes

- **Recency wins, by default.** When both entries are timestamped, the newer record is recommended — facts change, and location/preference conflicts may reflect a genuine move rather than an error. Without timestamps, the pair is flagged for manual review.
- **CI-friendly:** `--fail` exits 1 when any contradiction is found — memory consistency checks slot into a pipeline.
- 15 smoke tests, all green, before release.

## Roadmap

Embedding-based topic alignment ("the Bay Area" vs "San Francisco"), confidence scores, and an auto-fix mode that rewrites the stale entry instead of just flagging it.

## References

- [contradiction-judge: the memory auditor your AI agents are missing (DEV.to)](https://dev.to/haoli/contradiction-judge-the-memory-auditor-your-ai-agents-are-missing-4288)
- [contradiction-judge on GitHub](https://github.com/hahahahahahahahah6/contradiction-judge)
- [memgovern on GitHub](https://github.com/hahahahahahahahah6/memgovern)
