---
title: Verify a Claude Code Relay Really Serves Claude (ANTHROPIC_BASE_URL Checks)
diataxis: How-to Guide
domain: developer-tools-practices
topic: ai-coding-agents
source: DEV.to Tech News
source_url: https://dev.to/corecode/how-claude-codes-anthropicbaseurl-works-and-how-to-check-that-a-relay-really-serves-claude-49j2
date: 2026-11-04
keywords:
- knowledge-base
- ai-coding-agents
- developer-tools-practices
- how-to
---
# Verify a Claude Code Relay Really Serves Claude (ANTHROPIC_BASE_URL Checks)

Claude Code routes through any API proxy ("relay" / LLM gateway) via environment variables — which means a cheap relay can advertise Claude and quietly answer you with a different model. "Works in Claude Code" and "Claude answers" are different claims. This note is the verification playbook. The methodology is vendor-neutral, though the source article is written by a relay operator (CoreCode) — treat its product mentions as disclosure, not endorsement. See diagram: `howto-verify-claude-code-relay-serves-claude.excalidraw`.

## 1. Know the environment variables Claude Code reads

Confirmed against the official Claude Code docs:

| Variable | Behaviour |
| --- | --- |
| `ANTHROPIC_BASE_URL` | Points the API endpoint at a proxy/gateway |
| `ANTHROPIC_AUTH_TOKEN` | Sent as `Authorization: Bearer <value>` |
| `ANTHROPIC_API_KEY` | Sent as `x-api-key`; when set, takes precedence over a signed-in Pro/Max/Team subscription (interactive mode asks you to approve once) |
| `ANTHROPIC_DEFAULT_OPUS_MODEL` / `_SONNET_` / `_HAIKU_` | Change what the `opus`/`sonnet`/`haiku` aliases resolve to — the lever a relay uses to map "Claude" tiers onto other models |

Pick the credential variable by the header your relay reads; docs suggest trying `ANTHROPIC_AUTH_TOKEN` first and switching on a 401. Persist in the `env` block of `~/.claude/settings.json` so it applies however your shell starts (settings-file values beat shell exports; never put credentials in a project's committed `.claude/settings.json`). For the VS Code extension use `claudeCode.environmentVariables` in VS Code's own settings — `~/.claude/settings.json` values reach the spawned process but not the extension's login check.

## 2. Check routing with `/status`

Start `claude`, run `/status`: the `Anthropic base URL` line must show the relay, and an `Auth token` or `API key` line must appear. If `Login method` shows a claude.ai account instead, your relay credential is **not** being used.

## 3. Verify the endpoint with a one-token curl

```bash
curl -sS -w '\n%{http_code}\n' -X POST "$ANTHROPIC_BASE_URL/v1/messages" \
  -H "Authorization: Bearer $ANTHROPIC_AUTH_TOKEN" \
  -H "anthropic-version: 2023-06-01" -H "content-type: application/json" \
  -d '{"model": "claude-sonnet-4-6", "max_tokens": 1, "messages": [{"role": "user", "content": "."}]}'
```

A JSON body starting `{"id":"msg_` with a `content` array proves URL + credential work. An *unknown model* error still proves them (auth happens before model resolution). A 401 means the credential went in a header the relay doesn't read — swap the variable.

## 4. The model-swap problem

A relay can connect Claude Code through the same `ANTHROPIC_BASE_URL`/`ANTHROPIC_AUTH_TOKEN` mechanism while the `opus`/`sonnet`/`haiku` aliases resolve to a completely different model family (documented and above-board example: Z.ai's GLM Coding Plan). Anthropic states it does not support routing Claude Code to non-Claude models through any gateway; the problem is relays that do it silently. **Asking the model "who are you" proves nothing** — one system-prompt line makes any model claim to be Claude. Look at behaviour instead:

### Check A — protocol-level checks (check-relay.py)

[claude-relay-check](https://github.com/CoreCodeAI/claude-relay-check) is a single stdlib-only Python file; a run costs cents:

```bash
curl -fsSLO https://raw.githubusercontent.com/CoreCodeAI/claude-relay-check/main/check-relay.py
python3 check-relay.py --base-url https://relay.example --key sk-your-key --model claude-sonnet-5-5
```

Three checks:
- **shape** — response is Anthropic Messages format (`type`, `id` starting `msg_`, `usage`).
- **cache** — sends a ~18,000-token prompt with `cache_control` twice; the cache write and the subsequent read must match.
- **signature** — flips one character of a thinking block's signature and resends, expecting a **400**: Anthropic always rejects a modified preserved-thinking signature, so a relay that accepts it is not Anthropic upstream.

Limits: proves the *upstream* is Anthropic, not which tier answered; it's a single sample — rerun over time. A relay that 403s non-Claude-Code clients returns `ERROR`, which is not a verdict.

### Check B — model fingerprinting for the tier

[ModelTrace](https://github.com/xqy2006/ModelTrace) has the model generate long integer sequences three times and compares digit distributions against fingerprints of known models. Output is a probability over its fingerprint library; unlisted models snap to the nearest candidate. Treat as a hint, not proof.

### Check C — probe prompt caching yourself

Claude Code resends the same prefix (system prompt + tool definitions) every turn, so cache hits drive the bill. Anthropic prices cache **read at 0.1×** base input (0.05× on some models) and a **5-minute cache write at 1.25×**. Send the same request twice and compare `usage`:

```bash
python3 - > /tmp/body.json <<'PY'
import json
t = "Reference note: " + "the quick brown fox jumps over the lazy dog. " * 1500
print(json.dumps({"model": "claude-sonnet-5-5", "max_tokens": 16,
  "system": [{"type": "text", "text": t, "cache_control": {"type": "ephemeral"}}],
  "messages": [{"role": "user", "content": "ok?"}]}))
PY
for i in 1 2; do
  curl -sS "$ANTHROPIC_BASE_URL/v1/messages" \
    -H "Authorization: Bearer $ANTHROPIC_AUTH_TOKEN" \
    -H "anthropic-version: 2023-06-01" -H "content-type: application/json" \
    -d @/tmp/body.json |
  python3 -c 'import json,sys; d=json.load(sys.stdin); print(d.get("model"), d.get("usage"))'
done
```

Interpretation: first call shows `cache_creation_input_tokens`, second shows a comparable `cache_read_input_tokens`. **Zero on both** = caching is broken or the relay fabricates `usage` itself. **Writes without reads** = each request lands on a different upstream account (which also destroys cache economics).

## 5. Red flags on a relay price list

- Input, output, cache write and cache read must be billed separately, in Anthropic's ratios.
- Per-request usage and cost visible in a log.
- One session pinned to one upstream account (the precondition for cache hits).
- Ask what a "discount" is measured against.

## References

- Original article (vendor-authored, methodology still general): [How Claude Code's ANTHROPIC_BASE_URL works (DEV.to)](https://dev.to/corecode/how-claude-codes-anthropicbaseurl-works-and-how-to-check-that-a-relay-really-serves-claude-49j2)
- Claude Code docs: [Environment variables](https://code.claude.com/docs/en/env-vars)
- Claude Code docs: [Connect to an LLM gateway](https://code.claude.com/docs/en/llm-gateway-connect)
- Claude Code docs: [Gateway compatibility guide](https://code.claude.com/docs/en/llm-gateway-protocol)
- Anthropic platform docs: [Prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching), [Preserved thinking](https://platform.claude.com/docs/en/build-with-claude/preserved-thinking)
