---
title: 'Count LLM Tokens Before the Call: tiktoken Encodings, Budgets and Chunking'
diataxis: How-to Guide
domain: AI-LLM
topic: LLM-Infrastructure
source: DEV.to Tech News
source_url: https://dev.to/m_t_ramkrushna/count-tokens-before-you-call-the-llm-tiktoken-encodings-token-budgets-and-chunking-with-real-d7e
date: 2026-11-19
keywords:
- knowledge-base
- LLM-Infrastructure
- AI-LLM
- how-to
---
# Count LLM Tokens Before the Call: tiktoken Encodings, Budgets and Chunking

`tiktoken` is OpenAI's fast BPE tokenizer (Rust core, Python wrapper). It produces the same token IDs the models see, so you can validate context-window fit, chunk documents **by tokens instead of characters**, and estimate cost before sending a request.

**Do not use the "about 4 chars/token" rule.** Measured on real samples: English came out at **6.0 chars/token**, while a Python snippet, a JSON payload and a Hindi sentence came out at **2.5–2.8** — most "context length exceeded" errors and surprise bills come from that guess.

## 1. Install and pin the cache

```bash
python -m venv venv && source venv/bin/activate
pip install tiktoken           # 0.14.0 current (Aug 2026, MIT, Python 3.9+)
```

```python
import os
CACHE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "tiktoken-cache")
os.environ["TIKTOKEN_CACHE_DIR"] = CACHE   # default is <tmp>/data-gym-cache
import tiktoken
```

The first `get_encoding()` downloads the BPE file; later loads read the local cache. No GPU needed — tokenizing is CPU work.

## 2. Pick the right encoding

| Encoding | Models |
|---|---|
| `o200k_base` | `gpt-4o`, `gpt-4o-mini`, `gpt-4.1`, `gpt-5`, `o1`/`o3`/`o4-mini` families |
| `cl100k_base` | `gpt-4`, `gpt-3.5-turbo`, `text-embedding-3-*`, `ada-002` |
| `p50k_base` / `r50k_base` | older Codex / GPT-3 models |

```python
enc = tiktoken.encoding_for_model("gpt-4o")   # -> o200k_base
enc.n_vocab                                    # vocabulary size
```

`encoding_for_model()` raises `KeyError` for non-OpenAI models (`claude-sonnet-4`, `llama-3.1-8b`) — token counts from another vendor's tokenizer are not comparable.

## 3. Count, and check special tokens

```python
ids = enc.encode(text)                 # raises ValueError if text contains
                                        # special tokens like <|endoftext|>
len(enc.encode_ordinary("text with <|endoftext|> inside"))  # treats it as plain text
enc.decode(ids) == text                 # BPE round-trip is lossless
enc.decode_single_token_bytes(ids[0])   # inspect raw byte pieces
```

Use `encode_ordinary()` on untrusted/user text — it both avoids the exception and treats injected special-token strings as literal text.

## 4. Truncate and chunk by tokens, not characters

```python
def truncate_to_tokens(text, n, enc):
    ids = enc.encode(text)
    return text if len(ids) <= n else enc.decode(ids[:n])

def chunk_by_tokens(text, size, overlap=0, enc):
    ids = enc.encode(text)
    step = size - overlap
    return [enc.decode(ids[i:i + size]) for i in range(0, max(len(ids) - overlap, 1), step)]
```

A fixed **character**-slicing of a mixed-language document produces wildly uneven token sizes per chunk; token-based chunking with `overlap=8` keeps every RAG chunk within budget.

## 5. Budget a chat prompt and estimate cost

Cookbook heuristic for gpt-4o-style chat: ~3 tokens per message wrapper + 3 for reply priming (an estimate, not exact):

```python
def chat_tokens(messages, enc, per_message=3, reply_priming=3):
    return sum(per_message + sum(len(enc.encode(v)) for v in m.values())
               for m in messages) + reply_priming

CONTEXT, MAX_OUTPUT = 8_000, 1_000
fits = chat_tokens(messages, enc) + MAX_OUTPUT <= CONTEXT      # pre-flight check
cost = est_tokens / 1e6 * price_per_mtok                        # cost estimate
```

## Pitfalls checklist

- [ ] Encoding chosen matches the target model family (`o200k_base` vs `cl100k_base` counts differ on the same text).
- [ ] `TIKTOKEN_CACHE_DIR` set to a stable path (offline restarts, container images).
- [ ] User text goes through `encode_ordinary()` (special-token safety).
- [ ] Chunking/truncation done on token IDs, never character slices.
- [ ] Chat overhead (~3/msg + 3) added when checking against the context window.
- [ ] Non-OpenAI models: use the vendor's tokenizer, not tiktoken.

## References

- [Count tokens before you call the LLM: tiktoken encodings, token budgets and chunking (DEV.to)](https://dev.to/m_t_ramkrushna/count-tokens-before-you-call-the-llm-tiktoken-encodings-token-budgets-and-chunking-with-real-d7e)
- [tiktoken on GitHub](https://github.com/openai/tiktoken)
- [OpenAI Cookbook: How to count tokens with tiktoken](https://cookbook.openai.com/examples/how_to_count_tokens_with_tiktoken)
