---
title: How to query and export the Windows registry (`reg`, `regedit`)
diataxis: How-to Guide
domain: security-privacy
topic: data-collection
source: ''
---
---
created: 2026-10-18
type: howto
title: "How to query and export the Windows registry (reg, regedit)"
domain: Security & Privacy
topic: Data Collection
source: "Ebook: Cybersecurity Ops with bash by Paul Troncone"
source_book_id: calibrebook_633
source_chapter: "Chapter 5: Data Collection"
tags: [data-collection, windows, registry, reg, regedit, forensics]
visibility: private
ai_tool_candidate: true

concise: true---

# How to query and export the Windows registry (`reg`, `regedit`)

The Windows registry holds install history, run keys, policies, and other forensic gold. Collect it read-only with `reg` for targeted hives/keys, or export whole hives with `regedit //E`.

## Inputs
- Hive (e.g. `HKEY_LOCAL_MACHINE`, `HKEY_CURRENT_USER`)
- Subkey path (optional — omit for whole hive)
- Output file for exports

## Procedure

### Query with `reg`
```bash
# List subkeys of HKLM\Software
reg query HKEY_LOCAL_MACHINE\Software

# Read a specific key's values
reg query HKEY_LOCAL_MACHINE\Software\Microsoft\Windows\CurrentVersion
```

### Export with `reg` (partial or full hive)
```bash
# Export a single key to a .reg text file
reg export HKEY_LOCAL_MACHINE\Software C:\forensics\HKLM_software.reg

# Export entire hive
reg export HKEY_LOCAL_MACHINE ${HOSTNAME}_reg.bak
```

### Export with `regedit` (classic .reg format)
```bash
# //E = export (double slash required to avoid option parsing issues)
regedit //E ${HOSTNAME}_reg.bak
regedit //E C:\forensics\HKLM.bak HKEY_LOCAL_MACHINE
```

### Git Bash caveat
Under Git Bash, the leading slash in `/E` is interpreted as a path prefix; use **`//E`** (double slash) so `regedit` receives the `E` flag.

## Error handling
- **Access denied:** run from an elevated (Administrator) shell; some keys require SYSTEM.
- **Git Bash `/E` mangling:** always `//E` when invoking from Git Bash.
- Exports are text (.reg) — re-importable; use them as-is for offline analysis.

## Verification
```bash
# File exists, non-empty, and begins with a registry header
ls -l ${HOSTNAME}_reg.bak
head -2 ${HOSTNAME}_reg.bak   # expect: Windows Registry Editor Version 5.00
```

## Source
"Cybersecurity Ops with bash" by Paul Troncone, Chapter 5: Data Collection ("Gathering the Windows Registry").
