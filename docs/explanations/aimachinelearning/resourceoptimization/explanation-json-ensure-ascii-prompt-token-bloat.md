---
title: Why json.dumps ensure_ascii Inflates LLM Prompt Tokens (and When It Doesn't)
diataxis: Explanation
domain: ai-machine-learning
topic: resource-optimization
source: DEV.to Tech News
source_url: https://dev.to/ji_ai/python-jsondumps-ensureascii-made-my-claude-prompts-23x-bigger-4k45
date: '2026-11-28'
keywords:
- knowledge-base
- resource-optimization
- ai-machine-learning
- explanations
---
# Why json.dumps ensure_ascii Inflates LLM Prompt Tokens (and When It Doesn't)

Python's `json.dumps` defaults to `ensure_ascii=True`, which rewrites every non-ASCII character as a six-character `\uXXXX` escape. When that serialized string is pasted into LLM prompt text, the tokenizer sees long runs of backslashes, hex letters and digits with no common words — and bills several tokens per original character.

## The mechanism

One Hangul syllable becomes 6 ASCII characters; an emoji becomes 12 (`\ud83d\ude00`):

| Input | ensure_ascii=True | Characters |
| --- | --- | --- |
| `é` | `\u00e9` | 1 → 6 |
| Hangul syllable (U+C800) | `\uc800` | 1 → 6 |
| `😀` | `\ud83d\ude00` | 1 → 12 |

Spanish accents, Japanese, Chinese, emoji in chat logs — everything outside ASCII inflates the same way.

**The bug only bites when JSON-as-a-string meets your prompt template.** A typical offender:

```python
import json

def build_scoring_prompt(turns: list[dict], rubric: str) -> str:
    return (
        f"{rubric}\n\n"
        f"<transcript>\n{json.dumps(turns, indent=2)}\n</transcript>\n\n"
        "Score the candidate and quote their exact words as evidence."
    )
```

The `json.dumps(...)` output inside the f-string carries the escapes into the text the model reads.

## When it does NOT matter

Sending JSON over HTTP is free of this cost. The SDK serializes the `messages` payload, the API server decodes it, and the model sees real characters. Verified by comparing `client.messages.count_tokens(...)` on a raw Hangul string: identical token counts whether or not the HTTP body contained escapes. The damage exists exactly at the layer where a serialized string becomes prompt text.

## Measured impact (500 replayed scoring calls, Korean interview transcripts)

- Transcript section shrank **3.4x** after the fix.
- Total input tokens per call dropped from **11,400 to 4,900 on average (2.3x)**.
- Report quality improved too: reports containing a garbled quote went from **41/500 to 6/500** — the model reads raw Hangul more reliably than hex escapes.

## The fix and the guard

```python
json.dumps(obj, ensure_ascii=False)
```

Plus a regression test that fails if `\u` appears in any rendered prompt — the class of bug that never raises an exception on its own.

## Diagnostic lesson

The author initially blamed the Korean tokenizer (non-Latin scripts do cost more tokens per word, so *a* gap was expected). The 3x gap was only found by **printing the final rendered prompt string** instead of inspecting the Python objects: `print(turns)` shows Korean perfectly because the damage exists only in the serialized form. Rule: log the final string you send, not the objects you built it from.

## References

- [Python json.dumps ensure_ascii Made My Claude Prompts 2.3x Bigger (DEV.to)](https://dev.to/ji_ai/python-jsondumps-ensureascii-made-my-claude-prompts-23x-bigger-4k45)
- [json.dumps documentation (Python docs)](https://docs.python.org/3/library/json.html#json.dumps)
