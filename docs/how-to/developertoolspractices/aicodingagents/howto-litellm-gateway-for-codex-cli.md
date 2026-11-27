---
title: Configure LiteLLM as a Gateway for a Custom Model Provider in Codex CLI
diataxis: How-to Guide
domain: developer-tools-practices
topic: ai-coding-agents
source: DEV.to Tech News
source_url: https://dev.to/juliashevchenko/configure-litellm-as-a-gateway-for-a-custom-model-provider-for-codex-2e3f
date: 2026-11-24
keywords:
- knowledge-base
- ai-coding-agents
- developer-tools-practices
- how-to
---
# Configure LiteLLM as a Gateway for a Custom Model Provider in Codex CLI

Goal: route the OpenAI **Codex** CLI through a **LiteLLM** gateway (cost tracking, observability, multi-provider management) instead of hitting an LLM provider directly. LiteLLM exposes an OpenAI-compatible interface, so any agent that accepts custom model providers can use it — but Codex does not offer this in its UI, so the configuration is done manually in `~/.codex/config.toml`.

## Step 1: Expose the LiteLLM API key as an environment variable

The app resolves `env_key` from **its own process environment**, which creates a classic pitfall on macOS.

```powershell
# Windows (PowerShell) — user-level, then restart the terminal and verify with $env:LITELLM_API_KEY
[Environment]::SetEnvironmentVariable("LITELLM_API_KEY", "sk-1234", "User")
```

```bash
# macOS & Linux
export LITELLM_API_KEY="sk-1234"
```

> **macOS gotcha:** apps launched from Finder or the Dock do **not** inherit variables exported in your shell profile — `LITELLM_API_KEY` can be missing even though Codex works fine when started from a terminal. Either launch the app from a terminal, or set it at login-session level and restart the app:
>
> ```bash
> launchctl setenv LITELLM_API_KEY sk-1234
> ```

## Step 2: Update `~/.codex/config.toml`

Back up the original config first. Set the model, provider, and reasoning effort at the top of the file:

```toml
model = "gpt-5.6-sol"
model_provider = "litellm"
model_reasoning_effort = "xhigh"
```

Then add the provider-specific section. `env_key` is the **name** of the environment variable from Step 1; `base_url` points at your deployed LiteLLM instance (use `http://localhost:<port>/v1` for a local one):

```toml
[model_providers.litellm]
name = "litellm"
base_url = "https://litellm.mydomain.com/v1"
env_key = "LITELLM_API_KEY"
wire_api = "responses"
stream_idle_timeout_ms = 7200000
stream_max_retries = 5
```

Key fields:

| Field | Purpose |
|-------|---------|
| `base_url` | LiteLLM endpoint; must include the `/v1` path segment |
| `env_key` | Name of the env var holding the API key (not the key itself) |
| `wire_api = "responses"` | Use the OpenAI Responses wire protocol against the gateway |
| `stream_idle_timeout_ms` | 7200000 ms = 2 h idle tolerance for long-running agent streams |
| `stream_max_retries` | Retry budget for interrupted streams |

### Optional: custom HTTP headers (e.g. Cloudflare Access)

If your LiteLLM instance sits behind Cloudflare Access, pass the access headers per provider:

```toml
http_headers = { "CF-Access-Client-Id" = "abc", "CF-Access-Client-Secret" = "xyz" }
```

## Step 3: Verify

1. Restart Codex and open a **new** chat session.
2. Confirm traffic is flowing through the gateway in the LiteLLM dashboard logs (request entries appear there).

## Optional: let Codex list the gateway's models (Codex CLI 0.159+)

By default Codex never asks a custom provider which models it serves — the `/model` picker only shows Codex's built-in OpenAI models and a gateway-only alias like `my-coding-model` never appears. Two settings are needed **together** (either one alone changes nothing): `model_catalog_url` on the provider block plus `api_key_model_discovery` under `[features]`:

```toml
suppress_unstable_features_warning = true   # top level, before the first table

[features]
api_key_model_discovery = true

[model_providers.litellm]
name = "LiteLLM"
base_url = "http://localhost:4000/v1"
model_catalog_url = "http://localhost:4000/v1/models"
env_key = "LITELLM_API_KEY"
wire_api = "responses"
request_max_retries = 4
```

How it works and what to expect (verified against LiteLLM's Codex CLI setup docs, 2026-11-24):

- On startup Codex calls `GET /v1/models?client_version=<version>` with your virtual key; the gateway answers in Codex's own catalog format (top-level `models` key, not `data`).
- The picker lists gateway chat models in `model_list` order, named by `model_info.display_name` when set, else `model_name`. Wildcard entries (`openai/*`) and non-chat models (embeddings) are excluded.
- A model the gateway recognizes (by `model_name` or upstream `litellm_params.model`) keeps Codex's own metadata — reasoning levels, tool support, context window — under your alias; unknown models get fallback metadata (works, but no reasoning-effort choices).
- Codex caches the catalog for **5 minutes** in `models_cache.json` under its home directory; gateway changes appear only after that cache expires.
- Debugging: `curl <base_url>/v1/models?client_version=0.159.3` with your key shows which side is at fault — a catalog-capable gateway responds with `models`, a plain one with `data`.
- Per-run override without touching config: `codex --model gemini-3.1-pro-preview`.
- Requests carry no end user by default (Codex sends none in the body); attribute per developer/project with LiteLLM tracking headers via `http_headers` / `env_http_headers` in the provider block.

## Known limitation: no mid-session model switching

With a custom provider, Codex has **no UI for changing the model of an existing session** ([openai/codex#15364](https://github.com/openai/codex/issues/15364)). A session uses whatever `model` was in `config.toml` when the session was created. To use a different LiteLLM model: update `model` in `config.toml`, then start a new session.

## Troubleshooting (verified 2026-09-24)

Symptoms and fixes reported by the LiteLLM docs and community threads:

| Symptom | Cause / fix |
|---|---|
| Requests never appear in the LiteLLM Admin UI | You're still on the default provider — confirm `model_provider = "litellm"` is set at the **top level** of `config.toml` (not only inside a project block). |
| 401 from the gateway | `LITELLM_API_KEY` isn't exported in the shell that launches Codex, or the key expired — re-export and restart. |
| "Invalid model name passed in" / 404 NotFoundError | The `model` value doesn't match a `model_name` in your LiteLLM gateway config — use *your* alias, not the upstream provider's name. A classic variant: a LiteLLM entry with `model: openai/model` forwards the literal string `"model"` upstream (vLLM then 404s); set it to the actual served model id instead. |
| Connection refused | Gateway unreachable at `base_url` — check host/port and that the `/v1` suffix is present. |
| 404 on `/v1/responses` when bridging to a chat-only backend (e.g., vLLM) | Codex only speaks `wire_api = "responses"`; LiteLLM's Responses→chat bridge can be fragile against plain `/v1/chat/completions` backends. If your backend is chat-only, test the gateway directly with `curl .../v1/responses` first and check whether the model group resolves. |

Two extra facts worth knowing:

- **The Codex desktop app reads the same `~/.codex/config.toml`** as the CLI — configuring it once covers both surfaces (per LiteLLM's Codex CLI setup guide).
- **Command-backed auth is an alternative to `env_key`**: a `[model_providers.litellm.auth]` block with `command = "..."` + `refresh_interval_ms` lets Codex fetch short-lived bearer tokens from an external credential helper (this is how corporate gateways like LiteLLM Relay keep no static key on the device). `auth`, `env_key`, and `experimental_bearer_token` are mutually exclusive — use exactly one.
- **LiteLLM can also expose itself as an MCP gateway** (`<base_url>/<server_name>/mcp`) that Codex registers in the same config file via `[mcp_servers.litellm]` with `bearer_token_env_var = "LITELLM_API_KEY"` — verify with `/mcp` inside Codex.

## References

- [Configure LiteLLM as a gateway for a custom model provider for Codex](https://dev.to/juliashevchenko/configure-litellm-as-a-gateway-for-a-custom-model-provider-for-codex-2e3f)
- [LiteLLM docs: OpenAI Codex tutorial](https://docs.litellm.ai/docs/tutorials/openai_codex)
- [LiteLLM docs: Codex CLI client setup (proxy + MCP gateway)](https://docs.litellm.ai/docs/proxy/client_setup/codex_cli)
- [Codex config file documentation (advanced)](https://www.codex-docs.com/en/docs/config-file/config-advanced)
- [BerriAI/litellm — Python SDK & proxy server (AI gateway) for 100+ LLM APIs](https://github.com/BerriAI/litellm)

## Related
- [[howto-mcp-security-hardening]]
- [[howto-agentic-rag-pipeline-with-real-time-web-search]]
- [[howto-map-http-api-parameters-to-mcp-tool-schemas]]
