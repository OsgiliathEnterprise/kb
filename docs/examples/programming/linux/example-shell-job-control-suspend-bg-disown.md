---
title: 'Shell Job Control: Suspend, Background, and Disown a Running Process'
diataxis: Example
domain: programming
topic: linux
source: DEV.to Tech News
source_url: https://dev.to/jantolentino/suspend-background-disown-3hj1
date: 2026-09-27
keywords:
- knowledge-base
- linux
- programming
- examples
---
# Shell Job Control: Suspend, Background, and Disown a Running Process

A handy alternative to `nohup`/`tmux`: you can detach a process **after** it is already running — useful on a server where the job has started but you didn't anticipate how long it would take (e.g. a crawler downloading large files), or where `tmux` isn't installed and you lack permission to add it.

## The three-step sequence

### 1. Suspend the running process

While your command is active, press `Ctrl + Z`. The shell reports:

```
[1]+  Stopped  (your command)
```

The `[1]` is the job number of the suspended process.

### 2. Resume it in the background

Type `bg` and hit enter. This resumes the stopped job but runs it in the background:

```
[1]+ (your command) &
```

The trailing ampersand (`&`) confirms it is now a background job.

### 3. Disown it from the session

This is the critical step. The process is still attached to your shell, so it would die when you log out. Detach it:

```bash
disown -h %1
```

`%1` refers to job number 1 (the `%` prefix means "job"). Now the process is fully independent of your session and survives logout — which is exactly what `nohup` does, but achieved *after* launch rather than before.

## How it compares to nohup

Nothing is wrong with `nohup`. The difference: `nohup` must be used **before** you start the process (`nohup ./long_job.sh &`). The suspend/`bg`/`disown` trick lets you do it **after** a process is already running. For long-lived, resumable sessions, detached `tmux` sessions are still the better tool; this sequence is for quick one-off detaches on minimal servers.

## Verification

```bash
jobs -l          # list background jobs with PIDs (before disown)
ps -o pid,ppid,cmd -p <PID>   # confirm PPID is 1 after disown + logout
```

After `disown`, the job no longer appears in `jobs` for that shell, and its parent becomes `init`/`systemd` (PPID 1) once the original shell exits.

## References

- [Suspend, Background, Disown (DEV.to)](https://dev.to/jantolentino/suspend-background-disown-3hj1)
- [Bash manual: Job Control](https://www.gnu.org/software/bash/manual/bash.html#Job-Control-Builtins)
