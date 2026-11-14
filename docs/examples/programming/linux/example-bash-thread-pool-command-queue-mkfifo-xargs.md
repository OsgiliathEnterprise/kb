---
title: 'Bash Thread Pool: Concurrent Shell Command Queue with mkfifo + xargs -P'
diataxis: Example
domain: programming
topic: linux
source: HackerNews
source_url: https://emmer.dev/blog/concurrent-shell-command-queues/
date: 2026-11-13
keywords:
- knowledge-base
- linux
- programming
- examples
---
# Bash Thread Pool: Concurrent Shell Command Queue with mkfifo + xargs -P

A complete, drop-in **thread pool in Bash/Zsh**: submit shell commands to a queue over time (you do not need to know them up front) and run them in parallel with a hard concurrency limit. The mechanism is a **FIFO queue file** read by a single `xargs -0 -P N` executor, plus careful fd, trap, and job-control handling to make it resilient.

> Honest framing from the author: "why do this in Bash at all?... because I have a fondness for Bash, and I wanted the challenge. But you're still probably better off using another language, such as Python." Treat this as an *example* of shell concurrency mechanics — for production pipelines, prefer GNU Parallel, `xargs -P` over a static list, or Python.

## The three-function API

```bash
queue_start 3     # start this shell's queue, max 3 jobs at once
queue_submit "curl -sS https://api/1 | jq ."   # enqueue (blocks if queue full)
queue_wait        # close queue, let running jobs finish, then return
```

## Full implementation

```bash
# Start this shell's command queue.
# @param {number} $1 Maximum number of jobs to run at once
queue_start() {
  # Validate that the parallelism is a valid limit for xargs
  if [[ ! ${1:-} =~ ^[1-9][0-9]*$ ]]; then
    echo "queue_start: size must be a positive integer, got '${1:-}'" >&2
    return 1
  fi

  # Close this shell's copy (not the parent's) of an inherited or earlier
  # command queue's file descriptor
  if [[ -n ${_queue_fd:-} ]]; then
    eval "exec ${_queue_fd}>&-"
    unset _queue_fd _queue_pid
  fi

  # Find the first unused fd from 3 to 9 (zsh's redirect max)
  local fd=3
  while { : <&"${fd}"; } 2>/dev/null; do fd=$(( fd + 1 )); done
  if [[ ${fd} -gt 9 ]]; then
    echo "queue_start: no free fd from 3 to 9" >&2
    return 1
  fi

  # Make a FIFO queue file in a private temporary directory
  local dir
  dir=$(mktemp -d "${TMPDIR:-/tmp}/queue.XXXXXX")
  mkfifo "${dir}/queue"

  # Find the shell to execute commands (the current shell)
  local shell
  shell=$(ps -o comm= -p "$$")
  shell=${shell#-}

  # Start xargs in the background, reading NUL-separated commands from the
  # queue file. Job messages are hidden by turning off job control and
  # discarding the block's stderr. xargs gets the real stderr through a copy on
  # the queue files's fd, until the file is opened.
  eval "exec ${fd}>&2"
  local opts=$-
  set +m
  {
    # shellcheck disable=SC2016
    xargs -0 -n 1 -P "$1" "${shell}" -c '
      # Output is captured rather than streamed so that command output stays separate
      out=$(eval -- "$1" </dev/null 2>&1); rc=$?
      [ -z "${out}" ] || printf "%s\n" "${out}"
      # Coerce non-zero exit codes to 1, because a 255 code would stop xargs
      [ "${rc}" -eq 0 ] || { printf "exit %d: %s\n" "${rc}" "$1" >&2; exit 1;
    }' _ <"${dir}/queue" 2>&"${fd}" &
    _queue_pid=$!
    disown || :
  } 2>/dev/null
  if [[ ${opts} == *m* ]]; then set -m; fi

  # Open the queue file for writing, which waits until xargs has opened it for reading
  # With both ends open, the file can be safely deleted
  eval "exec ${fd}>\"\${dir}/queue\""
  _queue_fd=${fd}
  rm -rf "${dir}"

  # Register an exit handler to terminate this PID's children, ensuring zsh behaves like bash
  setopt localoptions posixtraps 2>/dev/null || :
  trap _queue_stop EXIT
  if [[ $- != *i* ]]; then
    trap 'exit 129' HUP
    trap 'exit 130' INT
    trap 'exit 143' TERM
  fi
}

# Queue a command on this shell's command queue.
# @param {string} $1 Command to run
queue_submit() {
  if [[ -z ${_queue_fd:-} ]]; then
    echo "queue_submit: no command queue started in this shell" >&2
    return 1
  fi
  # Write the command to the queue file, blocking if it is full
  # Use a printf process so that if xargs has exited, printf will get killed and not this shell
  if [[ $- == *i* ]]; then
    # Write the command in the foreground, because an interactive shell won't
    # have any TERM/HUP/INT traps that could be delayed by a full queue
    env printf '%s\0' "$1" >&"${_queue_fd}"
  else
    # Write the command in the background, so that a full queue doesn't delay any TERM/HUP/INT traps
    env printf '%s\0' "$1" >&"${_queue_fd}" &
    wait "$!"
  fi || {
    echo "queue_submit: couldn't queue the command; the command queue may have stopped" >&2
    return 1
  }
}

# Close the queue file so xargs finishes the jobs it has, then wait for it to exit
queue_wait() {
  if [[ -z ${_queue_fd:-} ]]; then
    echo "queue_wait: no command queue started in this shell" >&2
    return 1
  fi
  eval "exec ${_queue_fd}>&-"
  while kill -0 "${_queue_pid}" 2>/dev/null; do sleep 0.1; done
  unset _queue_fd _queue_pid
}

# Stop every process below the given PID.
# @param {number=} $1 PID whose descendants to stop, defaulting to this shell's PID
_queue_stop() {
  # Default to this shell's PID, found from a child's parent PID because $$ is
  # the parent's PID in a subshell
  local parent=${1:-$(exec sh -c 'echo "${PPID}"')}
  local pid
  for pid in $(exec pgrep -P "${parent}"); do
    # Pause the process so it can't start any new children
    kill -STOP "${pid}" 2>/dev/null || continue
    # Terminate the process' descendants, then terminate the process
    _queue_stop "${pid}"
    kill -TERM "${pid}" 2>/dev/null || :
    # Resume the process so it can respond to the termination
    kill -CONT "${pid}" 2>/dev/null || :
  done
}

# Stop all background processes on exit, because they ignore Ctrl-C and don't receive TERM
if [[ $- != *i* ]]; then
  trap _queue_stop EXIT
  trap 'exit 129' HUP
  trap 'exit 130' INT
  trap 'exit 143' TERM
fi
```

## Example usage

Fire-and-collect HTTP requests (bounded fan-out):

```bash
$ queue_start 3
$ for n in 1 2 3 4 5; do
    queue_submit "set -o pipefail; \
      curl -sS --fail-with-body --max-time 10 -X POST -H 'Content-Type: application/json' \
        -d '{\"request\": ${n}}' \
        https://postman-echo.com/post | \
      jq -c .json"
  done
$ queue_wait
{"request":1}
{"request":2}
{"request":3}
{"request":4}
{"request":5}
```

## Why each defensive detail is there

| Mechanism | Failure mode it prevents |
|---|---|
| `mkfifo` + persistent fd (`exec N>queue`) | Unbounded command list in memory; backpressure: `queue_submit` blocks when the queue is full |
| `xargs -0 -n 1 -P N` | Word-splitting/injection on command strings (NUL-delimited); concurrency cap; `-n 1` = one command per invocation |
| `eval -- "$1" </dev/null 2>&1`, output captured | Interleaved stdout from parallel jobs; jobs stealing the terminal's stdin |
| Exit code coerced 255→1 | `xargs` stops entirely on child exit 255 |
| fd probed 3–9 | zsh only allows redirects up to fd 9 |
| `set +m` block + `2>&"${fd}"` | `[1] 12345` job messages polluting output, while xargs errors still reach real stderr |
| Open-for-write waits for reader, then `rm -rf` | Dangling FIFO file; classic unlinked-FIFO trick for clean lifecycle |
| `_queue_stop` recursive STOP→TERM→CONT | Orphaned descendants on exit; STOP first so a dying process can't spawn more children; zsh-vs-bash trap parity via `posixtraps` |
| `env printf ... &` in scripts | A full queue blocking a script so long that TERM/HUP/INT traps are delayed |

Related in KB: `howto-cleanup-background-jobs-trap-kill-job.md`, `example-shell-job-control-suspend-bg-disown.md`, `howto-exec-no-command-redirect-stdio-bash.md`.

## References

- [Concurrent Shell Command Queues — Christian Emmer (original, 2026-11-06)](https://emmer.dev/blog/concurrent-shell-command-queues/)
- [mkfifo(1) man page](https://man7.org/linux/man-pages/man1/mkfifo.1.html)
