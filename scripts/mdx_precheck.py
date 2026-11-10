#!/usr/bin/env python3
"""MDX precheck for the KB publisher (replaces the old sed-based fixups).

Fixes MDX/JSX-breaking patterns in docs/**/*.md, OUTSIDE code contexts only:

  1. <https://...>   ->  [https://...](https://...)
  2. <digit          ->  &lt;digit   (prevents JSX tag interpretation)

Inside fenced code blocks and inline code spans MDX does not parse JSX and the
HTML renderer already escapes correctly, so rewriting there DOUBLE-ESCAPES
(``<0.12.0`` -> ``&amp;lt;0.12.0`` in the built page). That bug made the
publisher's build differ from the CI build of the *same* commit every day,
which spawned a spurious publish PR each morning (2026-11 incident: three
stuck CONFLICTING PRs).

Rewritten files are recorded in a JSON state file as {path, sha256-of-new-
content}. The 'revert' subcommand restores those exact files from HEAD, but
only while their content still matches what this tool wrote — so it can never
clobber concurrent edits (e.g. a running sync pipeline).

Usage:
    mdx_precheck.py fix <docs-dir> <state-file>
    mdx_precheck.py revert <state-file> [--repo DIR]
"""
import hashlib
import json
import os
import re
import subprocess
import sys

FENCE_RE = re.compile(r'^(\s{0,3})(`{3,}|~{3,})')
INLINE_CODE_RE = re.compile(r'(`+[^`]*`+)')
URL_RE = re.compile(r'<(https?://[^>\s]+)>')
LT_DIGIT_RE = re.compile(r'<(?=[0-9])')


def fix_line(line):
    """Apply fixes only to segments of a line outside inline code spans."""
    parts = INLINE_CODE_RE.split(line)
    for i in range(0, len(parts), 2):  # even indices = outside code spans
        parts[i] = URL_RE.sub(r'[\1](\1)', parts[i])
        parts[i] = LT_DIGIT_RE.sub('&lt;', parts[i])
    return ''.join(parts)


def fix_text(text):
    out = []
    fence = None  # (indent, fence_char_string) while inside a fenced block
    for line in text.splitlines(keepends=True):
        m = FENCE_RE.match(line)
        if fence is None:
            if m:
                fence = (m.group(1), m.group(2))
                out.append(line)
                continue
            out.append(fix_line(line))
        else:
            out.append(line)
            # closing fence: same char, length >= opening, same-or-less indent
            if m and m.group(2)[0] == fence[1][0] and len(m.group(2)) >= len(fence[1]):
                fence = None
    return ''.join(out)


def sha256_bytes(b):
    return hashlib.sha256(b).hexdigest()


def cmd_fix(docs_dir, state_file):
    changed = []
    for root, _dirs, files in os.walk(docs_dir):
        for name in files:
            if not name.endswith('.md'):
                continue
            path = os.path.join(root, name)
            with open(path, 'rb') as fh:
                raw = fh.read()
            try:
                text = raw.decode('utf-8')
            except UnicodeDecodeError:
                continue
            fixed = fix_text(text)
            if fixed != text:
                data = fixed.encode('utf-8')
                with open(path, 'wb') as fh:
                    fh.write(data)
                changed.append({'path': path, 'sha256': sha256_bytes(data)})
    os.makedirs(os.path.dirname(state_file) or '.', exist_ok=True)
    with open(state_file, 'w') as fh:
        json.dump(changed, fh)
    print(f"{len(changed)}")
    return 0


def cmd_revert(state_file, repo_dir):
    if not os.path.exists(state_file):
        return 0
    try:
        with open(state_file) as fh:
            changed = json.load(fh)
    except (json.JSONDecodeError, OSError):
        changed = []
    for rec in changed:
        path = rec['path']
        try:
            with open(path, 'rb') as fh:
                current = sha256_bytes(fh.read())
        except OSError:
            continue  # file gone — nothing to revert
        if current != rec['sha256']:
            continue  # modified by someone else since we wrote it — hands off
        subprocess.run(
            ['git', '-C', repo_dir, 'checkout', 'HEAD', '--', path],
            check=False,
        )
    try:
        os.remove(state_file)
    except OSError:
        pass
    return 0


def main(argv):
    if len(argv) < 2:
        print(__doc__, file=sys.stderr)
        return 2
    if argv[1] == 'fix':
        if len(argv) != 4:
            print('usage: mdx_precheck.py fix <docs-dir> <state-file>', file=sys.stderr)
            return 2
        return cmd_fix(argv[2], argv[3])
    if argv[1] == 'revert':
        rest = list(argv[2:])
        repo = '.'
        if '--repo' in rest:
            i = rest.index('--repo')
            if i + 1 >= len(rest):
                print('--repo requires a directory argument', file=sys.stderr)
                return 2
            repo = rest[i + 1]
            del rest[i:i + 2]
        if len(rest) != 1:
            print('usage: mdx_precheck.py revert <state-file> [--repo DIR]', file=sys.stderr)
            return 2
        return cmd_revert(rest[0], repo)
    print(f'unknown subcommand: {argv[1]}', file=sys.stderr)
    return 2


if __name__ == '__main__':
    sys.exit(main(sys.argv))
