---
title: 'Static Bash Write-Target Extraction: Auditing What Commands Will Write Before
  an AI Agent Runs Them'
diataxis: Explanation
domain: developer-tools-practices
topic: ai-coding-agents
source: DEV.to Tech News
source_url: https://dev.to/haoli/i-built-the-tool-my-agent-guard-readme-said-didnt-exist-yet-5acp
date: 2026-10-21
keywords:
- knowledge-base
- ai-coding-agents
- developer-tools-practices
- explanations
---
# Static Bash Write-Target Extraction: Auditing What Commands Will Write Before an AI Agent Runs Them

The problem: AI coding agents run shell commands. An agent-guard style hook can audit a command *before* it runs — but only if you can predict **which files it may write to**. The **bash-write-targets** tool does exactly that: give it a bash command string, get back the list of files it may write to — before anything runs.

```bash
pip install bash-write-targets

$ targets 'grep -r foo . | sort -o sorted.txt; mv sorted.txt final.txt'
sorted.txt
final.txt

$ targets --json 'sed -i "s/a/b/g" config.ini && curl -s -o app.tgz https://example.com/app'
["config.ini", "app.tgz"]
```

Origin: the author's **agent-guard** project ships a Bash PreToolUse hook that audits commands before an AI agent runs them. Its README's *Honest limitations* section documented the gap ("Bash write-target extraction is static and approximate… the documented frontier for a future version") — this is that future version, extracted as a standalone **stdlib-only** tool usable with or without a hook.

## What it catches (per repo README, verified 2026-10-22)

- Redirections: `>`, `>>`, `>|`, `&>`, `&>>`, `2>`, `2>>`, `&lt;>`
- **Heredocs** — bodies are stripped so `&lt;<EOF` content isn't mistaken for targets
- `$(...)` and backticks — scanned **recursively**
- `tee` — all operands, `-a` aware
- `cp` (incl. `cp -t`) / `mv` / `install` destinations
- `sed -i` — script vs. file disambiguation
- `dd of=`, `truncate`, `touch`, `shred`, `zip` archives
- `-o` / `--output` / `--output=` flags for `curl`, `wget`, `gcc`/`cc`/`g++`/`clang`, `sort`, `pandoc`, `psql`, `tar -f`

## What it deliberately skips (instead of guessing)

- `/dev/null`
- fd duplications (`2>&1`)
- unresolvable `$VAR`s
- bare globs
- input-side `&lt;` redirections (reads are not write targets)

## The safety property

**Pure static parsing over the command string.** Nothing is executed, no subshell is spawned, no file is touched — auditing a destructive command cannot itself be destructive. And it's **conservative by design**: a missed target is a miss, never a crash; malformed input yields fewer results, not an exception.

## Honest limitations

- `eval`, paths assembled at runtime, and `python3 -c "open(p).write(x)"` are known gaps
- **Network sinks** (`curl --data` POSTing somewhere) are out of scope — this lists *file* write targets
- 19/19 smoke tests green

## Why it matters for agent design

For a PreToolUse hook, the audit decision ("allow / deny / ask") is only as good as the target prediction. A static extractor with explicit skip semantics gives the hook a defensible basis: it never blocks on a false positive from guessing, and it never executes to find out. The conservative-miss philosophy trades recall for safety — appropriate for a gate, wrong for a linter that must find everything.

## Ecosystem context (verified 2026-10-22)

- **Package facts**: MIT license, Python 3.9+, stdlib-only; CLI is `targets '<cmd>'` (one target per line) or `targets --json '<cmd>'` (JSON array for hooks). 8 commits at time of check — a young project.
- **How it differs from agent-guard**: the agent-guard hook extracts write targets *inline* with a shallow `shlex` pass — good enough for a hot-path block decision. The standalone package goes deeper: heredoc-aware stripping, recursive command-substitution scanning, and command-aware operand parsing (`tee`, `sed -i` script-vs-file, `cp -t`, `--output=` forms). It can sit in the same PreToolUse pipeline or run as a CI audit step.
- **Where it sits in the guardrail stack**: it answers one question only — *which files* a command may write. Network sinks (`curl --data` POSTs), DNS exfiltration, and read-side access are out of scope; combine it with network-policy controls if you gate an agent on that. The conservative-miss philosophy makes it a gate, not a completeness linter.

## References

- [I built the tool my agent-guard README said didn't exist yet (DEV.to)](https://dev.to/haoli/i-built-the-tool-my-agent-guard-readme-said-didnt-exist-yet-5acp)
- [bash-write-targets on GitHub](https://github.com/hahahahahahahahah6/bash-write-targets)
- [agent-guard on GitHub](https://github.com/hahahahahahahahah6/agent-guard)
- [bash-write-targets on PyPI](https://pypi.org/project/bash-write-targets/)
