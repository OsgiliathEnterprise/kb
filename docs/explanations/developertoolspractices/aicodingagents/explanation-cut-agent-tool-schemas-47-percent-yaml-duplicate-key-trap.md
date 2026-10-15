---
title: Cutting AI Agent Tool Schemas by 47% — Prefill Costs, Usage-Data Trimming,
  and the Duplicate YAML Key Trap
diataxis: Explanation
domain: developer-tools-practices
topic: ai-coding-agents
source: DEV.to Tech News
source_url: https://dev.to/iam-tech/ai-agent-tool-schemas-cut-47-the-duplicate-yaml-key-that-disabled-nothing-4fkp
date: 2026-10-15
keywords:
- knowledge-base
- ai-coding-agents
- developer-tools-practices
- explanations
---
# Cutting AI Agent Tool Schemas by 47% — Prefill Costs, Usage-Data Trimming, and the Duplicate YAML Key Trap

A self-hosted agent running slowly on a 6 GB GPU box was presumed to be a model problem. It was not: on every turn, **the agent was re-describing its own tool schemas to the model — for tools it never used** — and that JSON was the majority of the prefill. This note explains the diagnosis, the evidence-based trim, and the two config traps that made the fix look applied while changing nothing.

## Why the model was a red herring

The setup: a local model on a 6 GB GPU behind six agent profiles (coder, reviewer, scout, security, writer, plus a default "chief of staff"). Turns took 90+ seconds, and the obvious suspect was the model. Measuring killed that hypothesis fast:

- A captured turn carried **~18,400 prompt tokens, of which 13,541 (74%) were the JSON schemas of 27 enabled tools**.
- Tool schemas were 58–67% of each profile's *fixed* prompt.
- At ~600 prompt tokens/sec on that box, that is a big slice of every turn spent **before the model has thought about anything** (prefill dominates on small GPUs).
- The bigger candidate model did not even fit the card at any useful context size; the closest alternative tied on the part that mattered.

The lever was not the model. It was the tool list.

## Measuring the fixed prompt

Hermes' offline command breaks the fixed prompt down per profile — system prompt, skills index, memory, tool count, total schema bytes, and a per-toolset breakdown:

```bash
hermes --profile coder prompt-size --json
```

Two measurement details worth stealing:

- The per-toolset array is named `toolsets_breakdown`, not `toolsets` — a small trap when scripting over the JSON.
- For real token counts rather than guesses, send the text to Ollama's `/api/generate` and read `prompt_eval_count`. For these schemas it came out at **~3.97 bytes per token**, which converts `prompt-size` byte counts to tokens cleanly.
- A wire-capture rig (a fake OpenAI-compatible endpoint pointed at by the agent) records exactly what goes over the wire. Keep the **largest** request of a run, not the first — the first call is often a small one without tools.

## Deciding by usage, not by guessing

The agents' message history lives in a local SQLite database. Counting tool calls across ~1,900 messages gave an evidence-based cut list:

- The 10 `browser_*` tools, `text_to_speech`, `clarify`, and `process`: **zero calls ever**.
- `session_search` (5 calls) and `delegate_task` (21 calls): used, but only by the default profile.

| Profile | Disabled toolsets |
| --- | --- |
| default | `tts` |
| coder, reviewer, scout, sec, writer | `browser, tts, clarify, session_search, delegation` |

One pre-flight check mattered: the `browser` toolset is a 13-tool bundle that *includes* `web_search`, which the agents do use. On the capture rig, disabling `browser` removed only the 10 `browser_*` tools and left `web_search` alone (core tools are protected). The bundle listing alone would have suggested otherwise — **test before you trim bundles**.

## Trap 1 — a duplicate YAML key that disabled nothing

The setting is `agent.disabled_toolsets` in each profile's config. Added straight after the `agent:` line:

```yaml
agent:
  disabled_toolsets: [browser, tts, clarify, session_search, delegation]
  # ... lots of other settings ...
  disabled_toolsets: []
```

It looked right — `grep -A6` showed the new list exactly where expected. And it did **nothing**. Farther down the same block, the file already contained `disabled_toolsets: []`. YAML does not error on a duplicate key in a mapping; PyYAML silently keeps the **last** one. The list parsed to `[]`, every tool stayed enabled, and nothing complained.

The boring-but-important fixes:

1. **Count the key before adding it**: `grep -c disabled_toolsets config.yaml`. If it already exists, edit the existing line.
2. **Verify with a real parse, never with grep**:

```bash
python3 -c "import yaml; print(yaml.safe_load(open('config.yaml'))['agent']['disabled_toolsets'])"
```

`grep` shows you text; only a parser shows you what the program will actually see. The author's follow-up helper script loads YAML with a duplicate-key-rejecting loader, backs up first, and re-reads the file afterwards or fails.

## Trap 2 — `hermes config set` cannot write lists

The "obvious" alternative to hand-editing:

```bash
hermes config set agent.disabled_toolsets '["browser","tts"]'
```

writes the value as a **quoted string**:

```yaml
disabled_toolsets: '["browser","tts"]'
```

The filter expects a list, silently ignores the string, and `tts` was still present afterwards. List values must be written as real YAML sequences by editing the file.

Both traps share the same shape: **the config looks set, the tool reports no error, and the behavior doesn't change.** Only measuring the result catches it.

## The result

| Profile | Tools | Tool schema bytes | Fixed prompt total |
| --- | --- | --- | --- |
| specialists (×5) | 27 → 13 | 46,403 → 24,795 (**−47%**) | 80,057 → 58,262 (−27%) |
| default | 24 → 23 | 50,058 → 48,188 (−3.7%) | 74,699 → 72,829 |

That is **~5,400 tokens saved per specialist turn — roughly 9 seconds at the measured prefill rate**. Post-change verification: the gateway came back up, the coder ran a real terminal command, MCP servers were still reachable (the small `tool_search`/`tool_call`/`tool_describe` trio that fronts them survived), and the default profile kept web search and delegation. Every file was backed up first, so reverting is a restore plus a gateway restart.

## What's left

- Five memory-integration tools on the default profile (7,663 bytes, never called) are **injected directly by the memory plugin**, so `disabled_toolsets` cannot reach them — removing them means switching that integration off, a product decision, not a trim.
- The remaining big toolsets (file, skills, terminal, memory) are all genuinely used.
- The other half of the fixed prompt is now the system prompt (~21–24 KB) and the skills index (~9 KB) — the next place to look.

## Key takeaways

- **Measure the prompt before blaming the model.** On small GPUs, prefill dominates, and tool schemas can be most of the prefill (here: 74% of prompt tokens).
- **Trim by recorded usage.** Message history is the evidence; zero calls across ~1,900 messages is a clear signal.
- **Never trust a config edit verified with grep.** Parse it. Duplicate YAML keys don't error; the last one wins.
- **Check how your CLI writes lists.** A list quoted into a string looks fine and does nothing.
- **Measure again after every change.** The only proof the trim happened was the byte count going down.

## Related notes

- `developer-tools-practices/ai-coding-agents/howto-audit-claude-code-skill-context-tax-skill-tax-cli.md` — the same "fixed cost per turn" problem on the skills side
- `developer-tools-practices/ai-coding-agents/howto-identify-hidden-context-costs-in-agent-sessions.md`
- `developer-tools-practices/ai-coding-agents/howto-monitor-agent-context-usage-with-status-and-estimate-operation-costs.md`

## References

- [AI agent tool schemas cut 47%: the duplicate YAML key that disabled nothing (DEV.to)](https://dev.to/iam-tech/ai-agent-tool-schemas-cut-47-the-duplicate-yaml-key-that-disabled-nothing-4fkp)
