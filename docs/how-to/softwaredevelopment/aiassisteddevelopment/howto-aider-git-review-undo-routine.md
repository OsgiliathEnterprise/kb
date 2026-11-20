---
title: 'Review AI Edits Like a PR: Aider Git Routine with an Undo Ladder'
diataxis: How-to Guide
domain: software-development
topic: ai-assisted-development
source: DEV.to Tech News
source_url: https://dev.to/workflownexus/review-ai-edits-like-a-pr-my-aider-git-routine-undo-ladder-included-12lc
date: 2026-11-20
keywords:
- knowledge-base
- ai-assisted-development
- software-development
- how-to
---
# Review AI Edits Like a PR: Aider Git Routine

The safety property that makes AI-edited code acceptable is not model quality — it is that **every AI edit lands as a git commit you can read and reverse**. This is a concrete routine for Aider (terminal pair programmer); the pattern applies to any auto-committing coding agent.

## Before the session

1. **Clean tree**: commit or stash your own work first — Aider's auto-commits are only cleanly separable from your changes if the tree starts clean.
2. **`dirty-commits: false`** in `.aider.conf.yml` — Aider never silently commits your uncommitted files for you before it starts editing.
3. **One branch per task**, named for the task. AI commits on a task branch are cheap to squash, rebase, or abandon wholesale; the agent never works directly on the deployment branch.

## During the session: review routine

Every AI change, no exceptions:

1. **`/diff` after every message** — see what actually changed since the last message; never trust the agent's prose summary.
2. **Read hunks, not vibes** — priority review targets: deletions, changes to tests, anything touching config, auth, or data handling.
3. **Run the tests yourself** at least once per session — even with auto-test on.
4. **Skim the log afterwards**: `git log --oneline`, and `git show` anything you didn't watch happen.

## When it goes wrong: the undo ladder

Least to most drastic:

| Level | Command | When |
| --- | --- | --- |
| 1 | `/undo` (in Aider chat) | First resort for "that edit was wrong" — undoes the last commit if Aider made it |
| 2 | `git revert <hash>` | A later bad commit while earlier ones are fine; history-preserving, safe on shared branches |
| 3 | `git reset --hard <good-hash>` | Local-only history; destructive to everything after the hash — only when certain |
| 4 | `/commit` | You edited files in your editor mid-session — commits outside edits with a generated message, keeping the timeline coherent |

The system in one line: **clean tree in → diff review during → undo ladder in your pocket**. The agent can be fast *because* the recovery is boring.

## Why this matters (KB context)

This routine is the operational counterpart to the trust-side research in this KB: agents produce [unfaithful work reports](../../../explanations/softwaredevelopment/aiassisteddevelopment/explanation-unfaithful-work-reports-coding-agents.md) and there is a [comprehension gap](../../../explanations/softwaredevelopment/aiassisteddevelopment/explanation-comprehension-gap-llm-assisted-development.md) in LLM-assisted development — per-commit diff review against a clean baseline is the cheap mitigation that keeps both bounded.

## References

- DEV.to: [Review AI Edits Like a PR: My Aider Git Routine (Undo Ladder Included)](https://dev.to/workflownexus/review-ai-edits-like-a-pr-my-aider-git-routine-undo-ladder-included-12lc) (note: the post ends with promotional links to a paid pack; the routine itself above is the complete technical content)
- Related in KB: [[how-to-static-analysis-guidance-secure-codegen]], [[explanation-claude-code-dont-ask-again-secret-leaks]] (why blind trust in agent commits leaks secrets)
