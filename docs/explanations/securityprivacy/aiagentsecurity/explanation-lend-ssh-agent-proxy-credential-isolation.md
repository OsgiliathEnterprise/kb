---
title: 'lend: SSH-Agent Proxy with Local Policy and Biometric Approval for Remote
  Coding Agents'
diataxis: Explanation
domain: security-privacy
topic: ai-agent-security
source: HackerNews (blog.antonio.cx)
source_url: https://blog.antonio.cx/running-agents-with-lend
date: '2026-11-18'
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- explanations
---
# lend: SSH-Agent Proxy with Local Policy and Biometric Approval for Remote Coding Agents

## Problem: the two bad options for agent credentials
Coding agents run on disposable VMs, but real work needs the laptop's identity: `gh` tokens, 1Password, cloud CLIs, SSH keys. The two usual answers both fail the threat model:
1. **Copy credentials to the VM** — a token in `~/.config/gh/hosts.yml` is readable by every process on that machine (including the agent and anything it runs) for the token's whole lifetime.
2. **SSH agent forwarding (`ssh -A`)** — keys stay on the laptop, but the VM can use *every* key silently: no per-use approval, no record of what was signed, and it only covers SSH keys.

## The lend model: commands travel to the credential, not the reverse
[lend](https://github.com/antoniomika/lend) proxies the SSH agent socket; you forward **its** socket instead of the real one. SSH/Git keep working normally, and lend adds a command-execution channel via an SSH agent **extension**:

```
Remote: lend exec -- command args
                  |
          forwarded SSH agent socket
                  |
Laptop: lend agent → policy + local approval → local command
                                          → original SSH agent (signing)
```

The agent asks; the command runs **on the laptop** under your login; only stdout/stderr/exit code stream back. The token never leaves the laptop.

## Policy: default-deny, per-executable, per-fingerprint
Policy lives on the laptop (everything not listed is denied); `args_prefix` narrows to specific subcommands; `biometric:inline` puts Touch ID in the request dialog itself:

```json
{
  "default": "deny",
  "commands": [
    {"executable": "/opt/homebrew/bin/gh", "approval": "biometric:inline"}
  ],
  "ssh": {
    "default": "deny",
    "keys": [
      {"fingerprint": "SHA256:...", "approval": "biometric:inline"}
    ]
  }
}
```

Connect per session: `lend ssh --config ./policy.json -- agent-vm` (proxy starts with SSH, stops when it exits).

## Agent integration
- **MCP**: `lend mcp` exposes a single tool, `run_local_command`, requiring a `reason` string alongside the command — the approval dialog shows full executable path, every argument, the laptop-side cwd, the reason, and the remote process's self-report. Reason/caller come from the (untrusted) VM: marked unverified, can inform approval but **cannot change policy**.
- **Plain CLI** (no MCP): `lend exec --reason "Read the repo description" -- gh repo view antoniomika/lend`.
- **Approval delegation**: `lend approve --hook claude-code` wired as a Claude Code `PermissionRequest` hook routes the agent's own "may I?" prompts (VM-local shell commands, file edits, URL fetches) to the same laptop dialog with Touch ID; adapters exist for Codex, Antigravity, pi; scriptable as a gate (`lend approve --topic deploy --title "terraform apply" && terraform apply`). If the laptop is unreachable, the hook degrades gracefully to the agent's native UI.

## Ops detail: stable socket across reconnects
herdr panes survive SSH disconnects, but the forwarded socket path changes on reconnect while long-running agents hold the old `SSH_AUTH_SOCK`. Fix: a symlink at a fixed path, refreshed from `~/.ssh/rc` on the VM, guarded by `lend doctor --remote` so the link only points at a verified lend socket; `.bashrc` exports it only when the health check passes.

## Honest threat-model limits (what it does NOT protect)
- Approved commands run **as your user, unsandboxed** — approving a shell/interpreter/stdin-reading program ≈ approving anything, since stdin streams *after* approval and isn't shown.
- Caller details in the prompt are VM-supplied and spoofable; **root on the VM can use the forwarded socket** while the session is open (policy + human approval still gate each request).
- Early-stage: no PTY (no interactive programs), biometric approval is macOS-only (Linux: Zenity/terminal prompt).
- Prior art: ssh-rev-exec (SSH-agent-proxy remote exec), op-forward (1Password CLI forwarding); lend combines the agent-extension trick with per-request policy, local approval, and key filtering.

## Relevance to Our Domain
This is a concrete instantiation of the "agent gets capabilities, not secrets" pattern: human-in-the-loop approval as a *policy engine on the credential holder*, with untrusted-context clearly labeled. Compare with the vault/scoped-token approaches in this topic; the failure-mode list is the most reusable part — treat any approval gate as useless against interpreters and post-approval stdin.

## References
- Original post: [Running coding agents without handing them my credentials](https://blog.antonio.cx/running-agents-with-lend)
- Tool: [antoniomika/lend on GitHub](https://github.com/antoniomika/lend) · [Docs](https://lend.antonio.cx/)
- Prior art: [ssh-rev-exec](https://github.com/KOBA789/ssh-rev-exec) · [op-forward](https://github.com/ekovshilovsky/op-forward)
