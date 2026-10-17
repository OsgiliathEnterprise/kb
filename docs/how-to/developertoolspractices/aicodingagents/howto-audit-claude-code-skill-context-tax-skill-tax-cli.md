---
title: How to Audit the Context Tax of Claude Code Skills (skill-tax-cli)
diataxis: How-to Guide
domain: developer-tools-practices
topic: ai-coding-agents
source: DEV.to Tech News
source_url: https://dev.to/haoli/your-claude-code-skills-are-being-silently-demoted-i-built-a-cli-to-catch-it-454e
date: 2026-10-12
keywords:
- knowledge-base
- ai-coding-agents
- developer-tools-practices
- how-to
---
# How to Audit the Context Tax of Claude Code Skills (skill-tax-cli)

## The problem: silent skill demotion

Every installed Claude Code skill injects its **name + description into the model's context on every turn**, used or not. Claude Code budgets that listing at **1% of the context window** (`skillListingBudgetFraction`, default `0.01`). When the total listing overflows the budget, **descriptions are dropped starting with the least-used skills** — with no warning in the UI, only a line in the `--debug` log.

A skill whose description was dropped has nothing left for the model to match your request against, so it **quietly stops being chosen**. One measured setup found a full plugin install pushing the listing to ~10.8× the default budget — most of the catalog effectively invisible, nobody told.

## How to audit: skill-tax-cli

`skill-tax-cli` audits the context tax of your skills. Zero dependencies, Python standard library only.

```bash
pip install skill-tax-cli
```

**List every skill Claude Code can see** (user skills, project skills, marketplace plugin skills), with listing cost and full-load cost in tokens:

```
$ skill-tax-cli list
huge          plugin:acme        236 listing /   1482 load tokens
proj          project              6 listing /     16 load tokens
tiny          user                 6 listing /     16 load tokens
3 skill(s)
```

**Audit the tax** — ranked by full-load cost, with share of the context window, plus the other always-on sources (rules, memory, MCP configs) in one table:

```
$ skill-tax-cli audit --window 200000
skill                          source        listing    load  load%window
huge                           plugin:acme        236    1482       0.74%
tiny                           user                 6      16       0.01%
```

**Detect the silent drops** — `gate` replays the documented overflow rule (least-used skills lose their descriptions first) deterministically and **fails with a non-zero exit code** when a skill would be silently stripped:

```
$ skill-tax-cli gate --window 200000
SILENT-DROP RISK: 2 of 34 skill(s) exceed the 2000-token listing budget:
  - huge [plugin:acme] desc ~230 tokens, usage=1 -> description would be silently stripped
  - helper [user] desc ~88 tokens, usage=0 -> description would be silently stripped
$ echo $?
1
```

## How to wire it into CI

- Exit codes: `0` clean / `1` silent drops detected / `2` config error.
- Every command supports `--json`, so it drops straight into pre-commit hooks and CI pipelines.
- Pass `--usage usage.json` (a `{"skill-name": invocation_count}` map) to replay your **real usage** instead of the deterministic fallback ordering.

## Notes

- Token math is `round(chars / 4)` — an order-of-magnitude gauge, not a billing meter. It answers "which skill is eating my window?", not "what exactly did this cost".
- It measures skills, `CLAUDE.md` rules, `MEMORY.md`, and MCP configs together — the full per-turn tax in one pass, unlike the official interactive `/skill-doctor`.

## Official tooling overlap (verified 2026-10-17)

Claude Code now ships its own context-cost audit, which overlaps with part of what `skill-tax-cli` gates:

- **`/skill-doctor`** — official audit that reports which loaded skills a session never invoked and what each costs in context.
- **`/doctor`** (bundled skill) — setup checkup whose "Extensions" pass compares unused skills, MCP servers, and plugins against their context cost. `claude doctor` in the terminal runs the read-only install diagnostics without starting a session.
- **`/doctor prompt-audit`** (Claude Code v2.1.283+) — scans `CLAUDE.md` files, skills, and other configuration for outdated or conflicting instructions.
- **Bundled skills** (`/doctor`, `/code-review`, `/batch`, `/debug`, `/loop`, `/claude-api`, `/run`, `/verify`, …) are prompt-based skills listed alongside built-in commands; disable them with `disableBundledSkills` or `skillOverrides` (e.g. `"doctor": "off"`).
- **Custom commands merged into skills**: `.claude/commands/deploy.md` and `.claude/skills/deploy/SKILL.md` both create `/deploy`. Skills follow the **Agent Skills open standard** (agentskills.io), which works across multiple tools, with Claude Code extensions for invocation control, subagent execution, and dynamic context injection.
- Skill bodies load **only when used** (progressive disclosure), so the per-turn listing budget (`skillListingBudgetFraction`) is the main always-on cost — exactly what `gate` replays.

`skill-tax-cli` still adds value where the built-ins are thin: a deterministic, exit-code-driven **CI gate** on the full listing budget (`--usage` replay of real invocation counts), covering skills + `CLAUDE.md` + `MEMORY.md` + MCP configs in one pass, with `--json` for pipelines.

## References

- [Your Claude Code skills are being silently demoted. I built a CLI to catch it (DEV.to)](https://dev.to/haoli/your-claude-code-skills-are-being-silently-demoted-i-built-a-cli-to-catch-it-454e)
- [skill-tax-cli on GitHub](https://github.com/hahahahahahahahah6/skill-tax-cli)
- [skill-tax-cli on PyPI](https://pypi.org/project/skill-tax-cli/)
- [Extend Claude with skills — Claude Code docs (official)](https://code.claude.com/docs/en/skills)
- [Anthropic ships /skill-doctor to audit Claude Code skills (Implicator)](https://www.implicator.ai/anthropic-claude-code-skill-doctor-context-audit/)
