---
title: Configure LiteLLM as a Gateway for a Custom Model Provider in Codex CLI
diataxis: How-to Guide
domain: developer-tools-practices
topic: ai-coding-agents
source: DEV.to Tech News
source_url: https://dev.to/juliashevchenko/configure-litellm-as-a-gateway-for-a-custom-model-provider-for-codex-2e3f
date: 2026-08-28
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

## Known limitation: no mid-session model switching

With a custom provider, Codex has **no UI for changing the model of an existing session** ([openai/codex#15364](https://github.com/openai/codex/issues/15364)). A session uses whatever `model` was in `config.toml` when the session was created. To use a different LiteLLM model: update `model` in `config.toml`, then start a new session.

## References

- [Configure LiteLLM as a gateway for a custom model provider for Codex](https://dev.to/juliashevchenko/configure-litellm-as-a-gateway-for-a-custom-model-provider-for-codex-2e3f)
- [LiteLLM docs: OpenAI Codex tutorial](https://docs.litellm.ai/docs/tutorials/openai_codex)
- [Codex config file documentation (advanced)](https://www.codex-docs.com/en/docs/config-file/config-advanced)
- [BerriAI/litellm — Python SDK & proxy server (AI gateway) for 100+ LLM APIs](https://github.com/BerriAI/litellm)
