#!/usr/bin/env python3
"""
Visibility gate: scan docs/ for private content before publishing.
Exits 0 if clean, exits 1 if private content found (and prints filenames to stderr).

Two layers of defense:
1. docs/ frontmatter check — a published file whose own frontmatter says
   `visibility: private` is blocked.
2. KB source cross-check — a published file whose vault source is marked
   private (parsed metadata, or a raw `visibility:` line when the source
   frontmatter is unparseable) is blocked. This catches files that leaked
   before the sync's visibility filter could see them (e.g. sources whose
   YAML frontmatter fails to parse, which previously defaulted to public).
"""
import sys
import re
import yaml
from pathlib import Path

DOCS_DIR = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("docs")
KB_DIR = Path("/home/tcharlopenclaw/Documents/LearningNotes/KB")

if not DOCS_DIR.exists():
    print(f"docs/ not found at {DOCS_DIR}", file=sys.stderr)
    sys.exit(1)

FM_RE = re.compile(r"^---\s*\n(.*?)\n---", re.DOTALL)
VIS_RE = re.compile(r"^\s*visibility\s*:\s*[\"']?([A-Za-z]+)", re.MULTILINE)


def source_visibility(kb_file: Path) -> str:
    """Best-effort visibility of a KB source file.

    Parsed frontmatter wins; if the frontmatter block is unparseable,
    fall back to a raw `visibility:` line inside that block. Defaults to
    'public' (backwards compatibility) when no key is found.
    """
    try:
        content = kb_file.read_text(encoding="utf-8")
    except Exception:
        return "public"
    fm_match = FM_RE.match(content)
    if not fm_match:
        return "public"
    try:
        fm = yaml.safe_load(fm_match.group(1))
        if isinstance(fm, dict):
            return str(fm.get("visibility", "public")).lower()
    except Exception:
        pass
    m = VIS_RE.search(fm_match.group(1))
    if m:
        return m.group(1).lower()
    return "public"


private_files = []

# Basename -> KB source file. Content basenames are unique across the
# vault (only INDEX.md duplicates, and INDEX files are never published).
kb_by_basename = {}
if KB_DIR.exists():
    for kb_file in KB_DIR.rglob("*.md"):
        if kb_file.name == "INDEX.md":
            continue
        kb_by_basename.setdefault(kb_file.name, kb_file)

for md_file in sorted(DOCS_DIR.rglob("*.md")) + sorted(DOCS_DIR.rglob("*.mdx")):
    try:
        content = md_file.read_text(encoding="utf-8")
    except Exception:
        continue

    # Layer 1: the published file's own frontmatter.
    fm_match = FM_RE.match(content)
    if fm_match:
        try:
            fm = yaml.safe_load(fm_match.group(1))
            if isinstance(fm, dict):
                visibility = str(fm.get("visibility", "public")).lower()
                if visibility == "private":
                    private_files.append(str(md_file.relative_to(DOCS_DIR)))
                    continue
        except Exception:
            pass

    # Layer 2: the vault source file.
    kb_file = kb_by_basename.get(md_file.name)
    if kb_file is not None and source_visibility(kb_file) == "private":
        private_files.append(str(md_file.relative_to(DOCS_DIR)))

if private_files:
    for pf in private_files:
        print(f"BLOCKED: {pf}", file=sys.stderr)
    print(f"VISIBILITY GATE FAILED: {len(private_files)} private file(s) in docs/", file=sys.stderr)
    sys.exit(1)

print("CLEAN")
sys.exit(0)
