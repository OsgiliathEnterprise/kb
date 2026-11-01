#!/usr/bin/env python3
"""
Render fenced ```excalidraw JSON blocks in KB docs as static SVG images.

Docusaurus has no Excalidraw runtime, so an inline block like:

    ```excalidraw
    {"type": "drawing", "elements": [...]}
    ```

would ship to the site as raw JSON in a code block. This script converts each
such block (via excalidraw-to-svg.py) into ``<md-stem>-excalidraw-<n>.svg``
next to the markdown file and replaces the fence with a markdown image
reference. Blocks whose JSON does not parse or which produce no drawable
elements are left untouched (with a warning) so content is never lost.

Idempotent: once converted, the fence is gone and the SVG is referenced;
re-running on the same file is a no-op. If a re-sync restores the fences, the
SVGs are regenerated under the same deterministic names.

Usage:
    render-excalidraw-fences.py <dir>     # recurse over *.md under dir
    render-excalidraw-fences.py a.md b.md # explicit files
"""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

CONVERTER = Path(__file__).resolve().parent / "excalidraw-to-svg.py"


def _extract_blocks(lines):
    """Return [(open_idx, close_idx, json_text)] for top-level ```excalidraw fences.

    Tracks generic fence state so an 'excalidraw' line inside another fence
    (e.g. inside a ```text block) is never treated as a diagram.
    """
    blocks = []
    i, n = 0, len(lines)
    in_fence = False
    while i < n:
        stripped = lines[i].strip()
        if stripped.startswith("```"):
            if not in_fence:
                in_fence = True
                lang = stripped[3:].strip().lower().split(" ")[0]
                if lang == "excalidraw":
                    j = i + 1
                    buf = []
                    while j < n and not lines[j].strip().startswith("```"):
                        buf.append(lines[j])
                        j += 1
                    blocks.append((i, j, "\n".join(buf)))
                    # jump past the closing fence (j is its index, or EOF)
                    i = j + 1 if j < n else j
                    in_fence = False
                    continue
            else:
                in_fence = False
        i += 1
    return blocks


def process_file(md_path: Path, quiet=False):
    """Convert fenced excalidraw blocks in one markdown file.

    Returns (rendered, kept) counts.
    """
    text = md_path.read_text(encoding="utf-8")
    if "excalidraw" not in text:
        return 0, 0
    lines = text.split("\n")
    blocks = _extract_blocks(lines)
    if not blocks:
        return 0, 0

    stem = md_path.stem
    out = list(lines)
    rendered = kept = 0

    # Replace from last to first so earlier indices stay valid.
    for k, (open_i, close_i, blob) in reversed(list(enumerate(blocks, start=1))):
        svg_name = f"{stem}-excalidraw-{k}.svg"
        svg_path = md_path.parent / svg_name
        try:
            json.loads(blob, strict=False)
        except Exception as exc:
            if not quiet:
                print(f"  SKIP (invalid JSON) {md_path.name} block {k}: {exc}",
                      file=sys.stderr)
            kept += 1
            continue
        tmp = None
        proc = None
        try:
            with tempfile.NamedTemporaryFile(
                    "w", suffix=".excalidraw", delete=False) as tf:
                tf.write(blob)
                tmp = Path(tf.name)
            proc = subprocess.run(
                [sys.executable, str(CONVERTER), str(tmp), str(svg_path)],
                capture_output=True, text=True)
            ok = proc.returncode == 0 and svg_path.exists()
        except Exception as exc:
            if not quiet:
                print(f"  ERROR {md_path.name} block {k}: {exc}", file=sys.stderr)
            ok = False
        finally:
            if tmp is not None:
                tmp.unlink(missing_ok=True)
        if not ok:
            if not quiet:
                detail = ((proc.stderr or "") + (proc.stdout or "")).strip() \
                    if proc is not None else ""
                print(f"  SKIP (no drawable output) {md_path.name} block {k}: {detail}",
                      file=sys.stderr)
            svg_path.unlink(missing_ok=True)
            kept += 1
            continue
        out[open_i:close_i + 1] = [f"![Diagram {k} — {stem}]({svg_name})"]
        rendered += 1

    if rendered:
        md_path.write_text("\n".join(out), encoding="utf-8")
    return rendered, kept


def main() -> int:
    args = sys.argv[1:]
    if not args:
        print(__doc__, file=sys.stderr)
        return 2
    md_files = []
    for arg in args:
        p = Path(arg)
        if p.is_dir():
            md_files.extend(sorted(p.rglob("*.md")))
        elif p.is_file():
            md_files.append(p)
        else:
            print(f"  WARN: no such path: {arg}", file=sys.stderr)

    total_rendered = total_kept = files_touched = 0
    for md in md_files:
        rendered, kept = process_file(md)
        if rendered:
            files_touched += 1
        total_rendered += rendered
        total_kept += kept

    print(f"Excalidraw fences: {total_rendered} diagram(s) rendered in "
          f"{files_touched} file(s); {total_kept} block(s) left as-is.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
