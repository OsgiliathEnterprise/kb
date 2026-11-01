#!/usr/bin/env python3
"""
Excalidraw -> SVG converter for the KB publishing pipeline.

Converts .excalidraw JSON diagram files into static SVG images so Docusaurus
can render them without a JS runtime.

Usage:
    excalidraw-to-svg.py input.excalidraw output.svg
    excalidraw-to-svg.py --in-place file1.excalidraw [file2 ...]  (writes .svg next to each)

Supported element types: rectangle, ellipse, diamond, arrow, line, text.
Text is accepted in all three shapes the content generators emit:
  * free-standing text elements (``text`` is a string),
  * container-bound text elements (``containerId`` points at a shape),
  * labels embedded inside shapes (``text`` is a ``{"content": ...}`` dict).
The elements array is flattened: nested arrays (generator artifacts) are
expanded and bare strings/numbers are skipped instead of crashing.
Arrows draw a head by default unless ``endArrowhead`` is explicitly "none".
Other element types are skipped with a warning.
"""
import json
import math
import sys
from pathlib import Path

SUPPORTED_TYPES = {"rectangle", "ellipse", "diamond", "arrow", "line", "text"}
SHAPE_TYPES = {"rectangle", "ellipse", "diamond"}


def _esc(s: str) -> str:
    return (s.replace("&", "&amp;").replace("<", "&lt;")
             .replace(">", "&gt;").replace('"', "&quot;"))


def _flatten(raw) -> list:
    """Flatten the elements array: keep dicts, expand nested lists, drop junk."""
    out = []

    def walk(items):
        for e in items:
            if isinstance(e, dict):
                out.append(e)
            elif isinstance(e, (list, tuple)):
                walk(e)
            # bare strings/numbers are generator artifacts — skip silently

    walk(raw)
    return [e for e in out if not e.get("deleted")]


def _text_of(el: dict) -> str:
    """Text of an element in any of its emitted shapes."""
    t = el.get("text")
    if isinstance(t, dict):
        t = t.get("content") or t.get("text") or ""
    if not isinstance(t, str):
        orig = el.get("originalText")
        t = orig if isinstance(orig, str) else ""
    return t


def _dash_attr(el: dict) -> str:
    style = el.get("strokeStyle")
    if style == "dashed":
        return ' stroke-dasharray="7 5"'
    if style == "dotted":
        return ' stroke-dasharray="2 4"'
    return ""


def _draw_text(el: dict, container: "dict | None" = None) -> str:
    """Render a text element; if container given, center the block inside it."""
    raw = _text_of(el).replace("\r\n", "\n").split("\n")
    if not any(line.strip() for line in raw):
        return ""
    font_size = float(el.get("fontSize") or 16)
    line_h = font_size * 1.25
    color = el.get("strokeColor", "#1e1e1e")

    if container is not None:
        cx = container["x"] + container.get("width", 0) / 2
        cy = container["y"] + container.get("height", 0) / 2
        anchor = "middle"
        first_baseline = cy - (len(raw) - 1) * line_h / 2 + font_size * 0.8
    else:
        cx, anchor = el["x"], "start"
        first_baseline = el["y"] + font_size * 0.8

    tspans = []
    for i, line in enumerate(raw):
        y = first_baseline + i * line_h
        tspans.append(
            f'<tspan x="{cx:.1f}" y="{y:.1f}">{_esc(line) if line.strip() else " "}</tspan>'
        )
    return (
        f'<text font-family="Excalifont, \'Segoe UI\', sans-serif" '
        f'font-size="{font_size:g}" fill="{color}" text-anchor="{anchor}">'
        + "".join(tspans) + "</text>"
    )


def _points_of(el: dict):
    """Absolute point list of an arrow/line element."""
    pts = el.get("points") or []
    return [(el["x"] + p[0], el["y"] + p[1]) for p in pts
            if isinstance(p, (list, tuple)) and len(p) >= 2]


def _arrowhead(abs_pts, head_kind) -> str:
    if not head_kind or head_kind == "none" or len(abs_pts) < 2:
        return ""
    ex, ey = abs_pts[-1]
    px, py = abs_pts[-2]
    dx, dy = ex - px, ey - py
    length = math.hypot(dx, dy) or 1.0
    ux, uy = dx / length, dy / length
    if head_kind == "dot":
        r = min(6.0, max(3.0, length * 0.15))
        return f'<circle cx="{ex:.1f}" cy="{ey:.1f}" r="{r:.1f}" fill="currentColor"/>'
    L = min(14.0, max(8.0, length * 0.35))
    ang = math.atan2(uy, ux) + math.pi
    head = ""
    for side in (math.radians(26), -math.radians(26)):
        hx = ex + L * math.cos(ang + side)
        hy = ey + L * math.sin(ang + side)
        head += f'<line x1="{ex:.1f}" y1="{ey:.1f}" x2="{hx:.1f}" y2="{hy:.1f}"/>'
    return head


def convert(excalidraw_path: Path, svg_path: Path) -> bool:
    """Convert one .excalidraw file to SVG. Returns True on success."""
    # strict=False: generators sometimes emit literal newlines/tabs inside
    # JSON string values (invalid per spec, but recoverable).
    data = json.loads(excalidraw_path.read_text(encoding="utf-8"), strict=False)
    if isinstance(data, dict):
        raw_elements = data.get("elements", [])
    elif isinstance(data, list):
        raw_elements = data  # tolerate a bare elements array
    else:
        raw_elements = []
    elements = _flatten(raw_elements)

    skipped = [e for e in elements if e.get("type") not in SUPPORTED_TYPES]
    if skipped:
        kinds = sorted({str(e.get("type")) for e in skipped})
        print(f"  WARNING {excalidraw_path.name}: skipping unsupported types {kinds}",
              file=sys.stderr)

    by_id = {e.get("id"): e for e in elements if e.get("id") is not None}

    # ---- bounding box -------------------------------------------------
    min_x, min_y = float("inf"), float("inf")
    max_x, max_y = -float("inf"), -float("inf")

    def expand(x0, y0, x1, y1):
        nonlocal min_x, min_y, max_x, max_y
        min_x, min_y = min(min_x, x0), min(min_y, y0)
        max_x, max_y = max(max_x, x1), max(max_y, y1)

    def text_is_bound(t: dict) -> bool:
        cid = t.get("containerId")
        return bool(cid) and cid in by_id

    for e in elements:
        etype = e.get("type")
        if etype in SHAPE_TYPES:
            expand(e.get("x", 0), e.get("y", 0),
                   e.get("x", 0) + e.get("width", 0),
                   e.get("y", 0) + e.get("height", 0))
        elif etype in ("arrow", "line"):
            pts = _points_of(e)
            if pts:
                xs = [p[0] for p in pts]
                ys = [p[1] for p in pts]
                expand(min(xs), min(ys), max(xs), max(ys))
        elif etype == "text":
            if text_is_bound(e) and not _text_of(e):
                continue
            if text_is_bound(e):
                continue  # covered by its container
            expand(e.get("x", 0), e.get("y", 0),
                   e.get("x", 0) + e.get("width", 0),
                   e.get("y", 0) + e.get("height", 0))

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

    # ---- shapes ---------------------------------------------------------
    for e in elements:
        etype = e.get("type")
        if etype not in SHAPE_TYPES:
            continue
        bg = e.get("backgroundColor") or "transparent"
        fill = "none" if bg == "transparent" else bg
        stroke = e.get("strokeColor", "#1e1e1e")
        sw = e.get("strokeWidth") or 1
        dash = _dash_attr(e)
        x, y = e.get("x", 0), e.get("y", 0)
        w, h = e.get("width", 0), e.get("height", 0)
        if etype == "rectangle":
            rx = 8 if (e.get("roundness") or {}).get("type") in (2, 3) else 0
            parts.append(
                f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" '
                f'rx="{rx}" fill="{fill}" stroke="{stroke}" stroke-width="1.5"{dash}/>'
            )
        elif etype == "ellipse":
            parts.append(
                f'<ellipse cx="{x + w / 2:.1f}" cy="{y + h / 2:.1f}" '
                f'rx="{w / 2:.1f}" ry="{h / 2:.1f}" fill="{fill}" '
                f'stroke="{stroke}" stroke-width="1.5"{dash}/>'
            )
        elif etype == "diamond":
            pts = (f"{x + w / 2:.1f},{y:.1f} {x + w:.1f},{y + h / 2:.1f} "
                   f"{x + w / 2:.1f},{y + h:.1f} {x:.1f},{y + h / 2:.1f}")
            parts.append(
                f'<polygon points="{pts}" fill="{fill}" stroke="{stroke}" '
                f'stroke-width="1.5"{dash}/>'
            )

    # ---- arrows and lines -----------------------------------------------
    for e in elements:
        etype = e.get("type")
        if etype not in ("arrow", "line"):
            continue
        abs_pts = _points_of(e)
        if len(abs_pts) < 2:
            continue
        stroke = e.get("strokeColor", "#1e1e1e")
        dash = _dash_attr(e)
        d = "M {:.1f} {:.1f}".format(*abs_pts[0])
        for px, py in abs_pts[1:]:
            d += f" L {px:.1f} {py:.1f}"
        head = ""
        start = ""
        if etype == "arrow":
            # Excalidraw draws an arrowhead by default; only explicit "none" removes it.
            end_kind = e.get("endArrowhead") or "arrow"
            head = _arrowhead(abs_pts, end_kind)
            start_pts = list(reversed(abs_pts))
            start = _arrowhead(start_pts, e.get("startArrowhead"))
        parts.append(
            f'<g stroke="{stroke}" stroke-width="1.5" fill="none"{dash}>'
            f'<path d="{d}"/>{start}{head}</g>'
        )

    # ---- text (free-standing, container-bound, shape-embedded) ----------
    for e in elements:
        etype = e.get("type")
        if etype in SHAPE_TYPES:
            label = _text_of(e)
            if label:
                parts.append(_draw_text({"text": label,
                                         "fontSize": (e.get("fontSize")
                                                      or (e.get("text") or {}).get("fontSize")
                                                      if isinstance(e.get("text"), dict)
                                                      else None
                                                      or 16)},
                                        container=e))
        elif etype == "text":
            cid = e.get("containerId")
            container = by_id.get(cid) if cid else None
            if container is not None and container.get("type") not in SUPPORTED_TYPES:
                container = None
            parts.append(_draw_text(e, container=container))

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
