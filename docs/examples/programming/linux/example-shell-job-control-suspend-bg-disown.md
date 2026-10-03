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

## How `disown` actually works

A common misconception: `disown` does **not** detach the process from your session or terminal — it only removes the job from *bash's own job table*. The kernel still knows the process belongs to that session, and when the controlling pty is torn down (SSH disconnect, closing a terminal window), SIGHUP is sent to every process in the session regardless. What `disown` changes is bash's behavior: an interactive bash resends a received SIGHUP to all jobs it still tracks before exiting; a disowned job is no longer tracked, so bash won't send it one.

Consequences worth knowing:

- **A plain `disown %1` does not make the process immune to HUP from other sources.** An explicit `kill -s HUP <pid>` or the terminal teardown itself can still deliver SIGHUP, and a disowned process that doesn't ignore it will die. `nohup`, by contrast, sets SIGHUP to *ignore* in the child before exec — so nohup'd processes survive HUP from any sender.
- **`disown -h %1`** keeps the job in the table but marks it hangup-immune: bash won't send it SIGHUP on exit, and you can still see/manage it with `jobs`. This is the variant that reliably survives logout for a running job.
- **stdout/stderr stay bound to the terminal.** After the pty dies, writes fail (or read stdin → EOF), which can crash programs even when they survived SIGHUP. Redirect output before detaching: `command > /tmp/job.log 2>&1 & disown -h %1`.
- **`nohup cmd & disown` is redundant** — nohup already protects the process; one mechanism suffices. Also note portability: `nohup` is POSIX, while `disown` is a bash/zsh/ksh builtin absent from dash/sh/tcsh.
- **Login shells:** with `shopt -s huponexit`, bash sends SIGHUP to all jobs when the login shell exits (even without receiving HUP itself) — another reason `-h` or nohup is safer than a plain `disown`.

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
- [How does bash's disown work? — Unix.SE](https://unix.stackexchange.com/questions/542617/how-does-bashs-disown-work) (disown only affects bash's job table, not the kernel session; SIGHUP resend semantics)
- [Do `disown -h` and `nohup` work effectively the same? — Unix.SE](https://unix.stackexchange.com/questions/484276/do-disown-h-and-nohup-work-effectively-the-same) (HUP-ignore vs HUP-not-sent distinction; huponexit caveat)
- [POSIX nohup specification](https://pubs.opengroup.org/onlinepubs/9699919799.2016edition/utilities/nohup.html) (SIGHUP set to ignore at exec; stdin redirection behavior)
