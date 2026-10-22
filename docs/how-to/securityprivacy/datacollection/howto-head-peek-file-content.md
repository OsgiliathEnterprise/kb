---
title: How to peek at file starts with `head`
diataxis: How-to Guide
domain: security-privacy
topic: data-collection
source: ''
---
---
created: 2026-10-18
type: howto
title: "How to peek at file starts with head (lines or bytes)"
domain: Security & Privacy
topic: Data Collection
source: "Ebook: Cybersecurity Ops with bash by Paul Troncone"
source_book_id: calibrebook_633
source_chapter: "Chapter 5: Data Collection"
tags: [data-collection, bash, head, linux, inspection]
visibility: private
ai_tool_candidate: true

concise: true---

# How to peek at file starts with `head`

`head` prints the beginning of files — the fastest way to inspect a log or data file before committing to a full parse.

## Inputs
- File (or stdin)
- Optional count of lines (`-n`) or bytes (`-c`)

## Procedure
```bash
head file.txt            # first 10 lines (default)
head -n 25 file.txt     # first 25 lines
head -c 100 file.txt    # first 100 bytes (no trailing newline added)
head -n 5 a.log b.log   # multiple files, with ==> name <== headers
```

## Error handling
- `head -c` on a short file prints the whole file (no error).
- Negative counts (`head -n -5`) print all but the last 5 lines (GNU head) — useful for "everything except tail" but easy to misread; verify with `wc -l`.
- Binary files: `head` on binary garbage can emit NUL bytes that mess up the terminal; pipe through `head -c 64 | xxd` for a hex view instead.

## Verification
```bash
head -n 3 file.txt | wc -l      # must equal 3
head -c 100 file.txt | wc -c    # must equal 100 (or file size if smaller)
```

## Source
"Cybersecurity Ops with bash" by Paul Troncone, Chapter 5: Data Collection ("Commands in Use" — `head`).
