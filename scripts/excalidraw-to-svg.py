#!/usr/bin/env python3
"""
Excalidraw -> SVG converter for the KB publishing pipeline.

Converts .excalidraw JSON diagram files (rectangles, arrows, text) into
static SVG images so Docusaurus can render them without a JS runtime.

Usage:
    excalidraw-to-svg.py input.excalidraw output.svg
    excalidraw-to-svg.py --in-place file1.excalidraw [file2 ...]  (writes .svg next to each)

Supported element types: rectangle, arrow, text (free and container-bound).
Other element types are skipped with a warning.
"""
import json
import math
import sys
from pathlib import Path


def _esc(s: str) -> str:
    return (s.replace("&", "&amp;").replace("<", "&lt;")
             .replace(">", "&gt;").replace('"', "&quot;"))


def convert(excalidraw_path: Path, svg_path: Path) -> bool:
    """Convert one .excalidraw file to SVG. Returns True on success."""
    data = json.loads(excalidraw_path.read_text(encoding="utf-8"))
    elements = [e for e in data.get("elements", []) if not e.get("deleted")]

    rects = [e for e in elements if e.get("type") == "rectangle"]
    arrows = [e for e in elements if e.get("type") == "arrow"]
    texts = [e for e in elements if e.get("type") == "text"]
    skipped = [e for e in elements
               if e.get("type") not in ("rectangle", "arrow", "text")]
    if skipped:
        kinds = sorted({e.get("type") for e in skipped})
        print(f"  WARNING {excalidraw_path.name}: skipping unsupported types {kinds}",
              file=sys.stderr)

    # Map containerId -> rectangle (for centering bound text)
    rect_by_id = {r.get("id"): r for r in rects}

    # ---- bounding box -------------------------------------------------
    min_x, min_y = float("inf"), float("inf")
    max_x, max_y = -float("inf"), -float("inf")

    def expand(x0, y0, x1, y1):
        nonlocal min_x, min_y, max_x, max_y
        min_x, min_y = min(min_x, x0), min(min_y, y0)
        max_x, max_y = max(max_x, x1), max(max_y, y1)

    for r in rects:
        expand(r["x"], r["y"], r["x"] + r.get("width", 0), r["y"] + r.get("height", 0))
    for a in arrows:
        pts = a.get("points") or []
        if not pts:
            continue
        xs = [a["x"] + p[0] for p in pts]
        ys = [a["y"] + p[1] for p in pts]
        expand(min(xs), min(ys), max(xs), max(ys))
    for t in texts:
        if t.get("containerId"):
            continue  # covered by its container rect
        expand(t["x"], t["y"], t["x"] + t.get("width", 0), t["y"] + t.get("height", 0))

    if min_x == float("inf"):
        print(f"  WARNING {excalidraw_path.name}: no drawable elements, skipping",
              file=sys.stderr)
        return False

    PAD = 24
    vb_x, vb_y = min_x - PAD, min_y - PAD
    vb_w, vb_h = (max_x - min_x) + 2 * PAD, (max_y - min_y) + 2 * PAD

    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb_x:.1f} {vb_y:.1f} '
        f'{vb_w:.1f} {vb_h:.1f}" width="{max(1, round(vb_w))}" height="{max(1, round(vb_h))}">',
        '<rect x="{}" y="{}" width="{}" height="{}" fill="#ffffff"/>'.format(
            f"{vb_x:.1f}", f"{vb_y:.1f}", f"{vb_w:.1f}", f"{vb_h:.1f}"),
    ]

    # ---- rectangles ----------------------------------------------------
    for r in rects:
        bg = r.get("backgroundColor") or "transparent"
        fill = "none" if bg == "transparent" else bg
        stroke = r.get("strokeColor", "#1e1e1e")
        rx = 8 if (r.get("roundness") or {}).get("type") in (2, 3) else 0
        parts.append(
            f'<rect x="{r["x"]:.1f}" y="{r["y"]:.1f}" width="{r.get("width", 0):.1f}" '
            f'height="{r.get("height", 0):.1f}" rx="{rx}" fill="{fill}" '
            f'stroke="{stroke}" stroke-width="1.5"/>'
        )

    # ---- arrows --------------------------------------------------------
    for a in arrows:
        pts = a.get("points") or []
        if len(pts) < 2:
            continue
        abs_pts = [(a["x"] + p[0], a["y"] + p[1]) for p in pts]
        stroke = a.get("strokeColor", "#1e1e1e")
        d = "M {:.1f} {:.1f}".format(*abs_pts[0])
        for px, py in abs_pts[1:]:
            d += f" L {px:.1f} {py:.1f}"

        head = ""
        if a.get("endArrowhead") and a["endArrowhead"] != "none":
            ex, ey = abs_pts[-1]
            px, py = abs_pts[-2]
            dx, dy = ex - px, ey - py
            length = math.hypot(dx, dy) or 1.0
            ux, uy = dx / length, dy / length          # unit direction
            L = min(14.0, max(8.0, length * 0.35))    # head size
            ang = math.atan2(uy, ux) + math.pi         # pointing back along line
            for side in (math.radians(26), -math.radians(26)):
                hx = ex + L * math.cos(ang + side)
                hy = ey + L * math.sin(ang + side)
                head += f'<line x1="{ex:.1f}" y1="{ey:.1f}" x2="{hx:.1f}" y2="{hy:.1f}"/>'

        parts.append(
            f'<g stroke="{stroke}" stroke-width="1.5" fill="none">'
            f'<path d="{d}"/>{head}</g>'
        )

    # ---- text ----------------------------------------------------------
    for t in texts:
        raw = (t.get("text") or "").replace("\r\n", "\n").split("\n")
        if not any(line.strip() for line in raw):
            continue
        font_size = float(t.get("fontSize") or 16)
        line_h = font_size * 1.25
        color = t.get("strokeColor", "#1e1e1e")

        container = rect_by_id.get(t.get("containerId")) if t.get("containerId") else None
        if container is not None:
            # Center the text block inside the container rectangle.
            cx = container["x"] + container.get("width", 0) / 2
            cy = container["y"] + container.get("height", 0) / 2
            anchor = "middle"
            n = len(raw)
            first_baseline = cy - (n - 1) * line_h / 2 + font_size * 0.8
        else:
            cx, anchor = t["x"], "start"
            first_baseline = t["y"] + font_size * 0.8

        tspans = []
        for i, line in enumerate(raw):
            y = first_baseline + i * line_h
            tspans.append(
                f'<tspan x="{cx:.1f}" y="{y:.1f}">{_esc(line) if line.strip() else " "}</tspan>'
            )
        parts.append(
            f'<text font-family="Excalifont, \'Segoe UI\', sans-serif" '
            f'font-size="{font_size:g}" fill="{color}" text-anchor="{anchor}">'
            + "".join(tspans) + "</text>"
        )

    parts.append("</svg>")
    svg_path.write_text("\n".join(parts), encoding="utf-8")
    return True


def main() -> int:
    args = sys.argv[1:]
    if not args:
        print(__doc__, file=sys.stderr)
        return 2

    if args[0] == "--in-place":
        rc = 0
        for name in args[1:]:
            src = Path(name)
            ok = convert(src, src.with_suffix(".svg"))
            print(f"{'OK' if ok else 'SKIP'} {src.name} -> {src.stem}.svg")
            rc |= 0 if ok else 1
        return rc

    if len(args) != 2:
        print(__doc__, file=sys.stderr)
        return 2
    src, dst = Path(args[0]), Path(args[1])
    ok = convert(src, dst)
    print(f"{'OK' if ok else 'SKIP'} {src} -> {dst}")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
