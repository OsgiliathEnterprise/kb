#!/usr/bin/env python3
"""
Visibility gate: scan docs/ for private content before publishing.
Exits 0 if clean, exits 1 if private content found (and prints filenames to stderr).
"""
import sys
import re
import yaml
from pathlib import Path

DOCS_DIR = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("docs")

if not DOCS_DIR.exists():
    print(f"docs/ not found at {DOCS_DIR}", file=sys.stderr)
    sys.exit(1)

private_files = []

for md_file in DOCS_DIR.rglob("*.md"):
    try:
        content = md_file.read_text(encoding="utf-8")
    except Exception:
        continue

    fm_match = re.match(r"^---\s*\n(.*?)\n---", content, re.DOTALL)
    if not fm_match:
        continue

    try:
        fm = yaml.safe_load(fm_match.group(1))
    except Exception:
        continue

    if not isinstance(fm, dict):
        continue

    visibility = str(fm.get("visibility", "public")).lower()
    if visibility == "private":
        private_files.append(str(md_file.relative_to(DOCS_DIR)))

if private_files:
    for pf in private_files:
        print(f"BLOCKED: {pf}", file=sys.stderr)
    print(f"VISIBILITY GATE FAILED: {len(private_files)} private file(s) in docs/", file=sys.stderr)
    sys.exit(1)

print("CLEAN")
sys.exit(0)
