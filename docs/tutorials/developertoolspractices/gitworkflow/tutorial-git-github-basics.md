---
title: 'Git & GitHub From Zero: A Hands-On Workflow Tutorial (Beginner)'
diataxis: Tutorial
domain: developer-tools-practices
topic: git-workflow
source: DEV.to Tech News
source_url: https://dev.to/prabhat_5d3435e0689f9f964/git-github-masterclass-version-control-ka-complete-practical-guide-1kpn
date: 2026-10-27
keywords:
- knowledge-base
- git-workflow
- developer-tools-practices
- tutorials
---
# Git & GitHub From Zero: A Hands-On Workflow Tutorial (Beginner)

A 16-chapter Hinglish guide (Prabhat Upadhyay) built around understanding the **logic** behind each command rather than rote memorization — with demo output and a practice exercise per chapter.

## Part 1 — Foundations (ch 1–8)
- **VCS basics**: why `final.js` → `final_v2.js` → `final_REAL_v3.js` breaks; what a version control system gives you (timeline of states, history, revert to a working state).
- **Git vs GitHub**: Git is the VCS tool on your machine; GitHub is just the online home for Git projects — not a VCS itself.
- **Install + config**: git-scm.com; the Windows installer includes **Git Bash**, where `ls`/`cat`/`mkdir` work directly (Mac/Linux use the normal terminal).
- **Core loop**: `git init` → edit → `git add` (staging area) → `git commit -m`. The staging area is the buffer between "changed" and "recorded".
- **Undo**: `git reset` variants (unstage vs untrack vs after-commit) and `git revert` for already-pushed history.

## Part 2 — Collaboration (ch 9–10)
- Central-server model; `git remote add origin <url>`, `git push`, `git pull`.
- **SSH authentication** for push (generate key pair, register the public key) vs HTTPS tokens.

## Part 3 — Advanced workflow (ch 11–13)
- **Branching**: feature branches, `git branch` / `git checkout -b <branch-name>`.
- **Pull Requests** as the review gate on GitHub.
- **merge vs rebase**: merge preserves history and adds a merge commit; rebase rewrites commits for a linear history (never rebase shared branches).
- **Conflicts**: `git status` → edit the conflict markers → `git add` → `git commit`.
- **`git stash`**: shelve uncommitted work while switching tasks.

## Part 4 — Practice (ch 14–16)
- Cheat sheet, exercises with answers, and a catalog of common mistakes.

## How to practice (from the guide)
1. Run every command alongside a **sandbox folder** (e.g. `git-masterclass`) — Git can't be learned by reading alone.
2. Install the **Git Graph** VS Code extension — seeing the graph is the fastest way to build the mental model.
3. Don't fear breaking things: inside a sandbox, every mistake is recoverable.

## References
- [Git & GitHub Masterclass: Complete Practical Guide (DEV.to, Hinglish)](https://dev.to/prabhat_5d3435e0689f9f964/git-github-masterclass-version-control-ka-complete-practical-guide-1kpn)
- [Git official site](https://git-scm.com/)
