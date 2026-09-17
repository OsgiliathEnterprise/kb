#!/usr/bin/env python3
"""Scan docs/ for internal markdown links whose targets don't exist."""
import re
from pathlib import Path

docs = Path("/home/tcharlopenclaw/code/kb/docs")
broken = []
for md in docs.rglob("*.md"):
    content = md.read_text(encoding="utf-8")
    lines, out, in_code = content.split("\n"), [], False
    for line in lines:
        if line.strip().startswith("```"):
            in_code = not in_code
        if not in_code:
            out.append(line)
    text = "\n".join(out)
    for m in re.finditer(r"\[([^\]]*)\]\(([^)]+)\)", text):
        url = m.group(2).split()[0]
        if re.match(r"^[a-zA-Z][a-zA-Z0-9+.\-]*:", url) or url.startswith("#") or url.startswith("/"):
            continue
        base, _, anchor = url.partition("#")
        if not base:
            continue
        target = (md.parent / base).resolve()
        if not target.exists():
            broken.append((str(md.relative_to(docs)), m.group(1)[:60], url))

for b in sorted(set(broken)):
    print(f"{b[0]}  ->  [{b[1]}]({b[2]})")
print(f"TOTAL BROKEN: {len(set(broken))}")
