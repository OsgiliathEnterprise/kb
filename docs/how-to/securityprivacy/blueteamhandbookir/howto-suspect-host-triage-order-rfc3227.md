---
title: 'How to Triage a Suspect Host: Capture RAM Before Disk (RFC 3227 Order)'
diataxis: How-to Guide
domain: security-privacy
topic: blue-team-handbook-ir
source: DEV.to Tech News
source_url: https://dev.to/rockyyy/capture-ram-first-the-order-of-operations-on-a-suspect-host-4jn7
date: 2026-11-27
keywords:
- knowledge-base
- blue-team-handbook-ir
- security-privacy
- how-to
---
# How to Triage a Suspect Host: Capture RAM Before Disk

**Input:** live suspect host flagged by EDR (e.g. a signed binary spawning PowerShell).
**Output:** preserved volatile evidence (network state + memory image) with hashes and a command log, then a disk image.

## Why order matters: RFC 3227

RFC 3227 ("Guidelines for Evidence Acquisition and Preservation of Digital Evidence") ranks evidence by decay rate. Collect in this order:

1. Registers and CPU cache
2. Routing table, ARP table, network connections, process list
3. **RAM** (temporary memory)
4. Temporary files
5. Disk (persistent storage)

The classic failure: hashes of on-disk binaries all match the vendor's copies, so the analyst powers the host off "to be safe" — but the evidence (injected code, decrypted data, live connections) lived only in memory and is gone. A reboot is no better.

## What lives only in memory

- The process list **as it actually is right now**
- Open network connections and the processes owning them
- Code injected into legitimate processes
- Decrypted copies of data that is encrypted on disk

## Step 1 — Record the network state (seconds, do it first)

```bash
# Windows
netstat -ano
# Linux
ss -tupan
```

Save output to external media you brought. Connections may not exist an hour later.

## Step 2 — Capture RAM to your own drive

- Windows: **WinPmem**
- Linux: **LiME** (or AVML — see `howto-acquire-linux-memory-avml-volatility3.md`)

Write the image to a drive you brought, **never to the suspect disk** — that overwrites evidence you have not collected yet.

## Step 3 — Hash and label

```powershell
Get-FileHash mem.raw        # Windows
```

```bash
sha256sum mem.raw           # Linux
```

Record hash + timestamp + hostname in the chain-of-custody log (see `howto-maintain-chain-of-custody-evidence.md`).

## Step 4 — Image the disk

Only now may the machine be powered down or isolated.

## Keep a command log

Every step alters the system slightly. Keep a plain-text log of each command and its timestamp — when someone asks why a process started at 14:02, you can show it was your capture tool, not the intruder.

## First-pass analysis with Volatility 3

Two plugins cover most of a first pass:

```bash
vol -f mem.raw windows.pslist
vol -f mem.raw windows.malfind
```

- `pslist` — process tree to compare against the expected baseline
- `malfind` — memory regions that are executable but **not backed by any file on disk**: the signature of injected code

## Practice

Build muscle memory before an incident: memory-dump CTFs (strings + pattern hunting) as a warm-up, then full lab cases where disk analysis finds only signed, hash-matching executables and the answer is only in memory.

## References

- [Capture RAM first: the order of operations on a suspect host (DEV.to)](https://dev.to/rockyyy/capture-ram-first-the-order-of-operations-on-a-suspect-host-4jn7)
- [RFC 3227: Guidelines for Evidence Acquisition and Preservation of Digital Evidence](https://datatracker.ietf.org/doc/html/rfc3227)
- [Volatility 3 documentation](https://volatility3.readthedocs.io/)
