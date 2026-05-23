#!/usr/bin/env python3
"""
KB Sync Script — Syncs LearningNotes KB to Docusaurus docs/
Organizes content by Diátaxis type: tutorials/, how-to/, reference/, examples/
Each type contains domain/topic subdirectories with the actual content.
"""

import os
import re
import sys
import yaml
import shutil
from pathlib import Path
from datetime import datetime

KB_SOURCE = Path("/home/tcharlopenclaw/Documents/LearningNotes/KB/")
DOCS_DIR  = Path("/home/tcharlopenclaw/code/kb/docs/")
SIDEBARS  = Path("/home/tcharlopenclaw/code/kb/sidebars.js")

# Diátaxis type mapping from filename prefix
# KB types: HOWTO, TUTORIAL, EXPLANATION, EXAMPLE — REFERENCE type is NOT used
# Note: 'explanation' and 'reference' both map to 'explanations' docs path
DIATAXIS_TYPES = {
    'tutorial': 'tutorials',
    'howto': 'how-to',
    'how-to': 'how-to',
    'reference': 'explanations',
    'explanation': 'explanations',
    'example': 'examples',
    'news': 'explanations',  # news articles become explanations
}

# Domain display names
DOMAIN_LABELS = {
    'ai-machine-learning': 'AI & Machine Learning',
    'cloud-infrastructure': 'Cloud & Infrastructure',
    'data-databases': 'Data & Databases',
    'developer-tools-practices': 'Developer Tools & Practices',
    'programming': 'Programming',
    'security-privacy': 'Security & Privacy',
}

# Track changes
added = []
updated = []
removed = []
errors = []


def sanitize_filename(name: str) -> str:
    """Convert filename to safe Docusaurus slug."""
    slug = name.replace(".md", "").replace(".mdx", "")
    slug = slug.lower()
    slug = re.sub(r'[^a-z0-9\s-]', '-', slug)
    slug = re.sub(r'\s+', '-', slug)
    slug = re.sub(r'-{2,}', '-', slug)
    slug = slug.rstrip('-_.')
    if len(slug) > 80:
        slug = slug[:80].rsplit('-', 1)[0]
        slug = slug.rstrip('-_.')
    return slug


def sanitize_dirname(name: str) -> str:
    """Convert directory name to safe path segment."""
    slug = name.lower()
    slug = re.sub(r'[^a-z0-9\s/]', '', slug)
    slug = re.sub(r'\s+', '-', slug)
    slug = re.sub(r'-{2,}', '-', slug)
    slug = slug.rstrip('-_.')
    return slug


def detect_diataxis_type(filename: str) -> tuple:
    """Extract (docs_path, display_label) from filename prefix."""
    name = filename.lower().replace(".md", "").replace(".mdx", "")
    display_map = {
        'tutorial': ('tutorials', 'Tutorial'),
        'howto': ('how-to', 'How-to Guide'),
        'how-to': ('how-to', 'How-to Guide'),
        'reference': ('explanations', 'Explanation'),
        'explanation': ('explanations', 'Explanation'),
        'example': ('examples', 'Example'),
        'news': ('explanations', 'Explanation'),
    }
    for prefix, (docs_path, label) in display_map.items():
        if name.startswith(prefix + '-') or name.startswith(prefix + '_'):
            return docs_path, label
    return 'explanations', 'Explanation'  # default


def fix_yaml_frontmatter(content: str, meta: dict, diataxis_type: str) -> str:
    """Ensure proper YAML frontmatter for Docusaurus."""
    fm_pattern = re.compile(r'^---\s*\n(.*?)\n---\s*\n', re.DOTALL)
    match = fm_pattern.match(content)

    if match:
        body = content[match.end():]
        try:
            existing = yaml.safe_load(match.group(1))
            if not isinstance(existing, dict):
                existing = {}
        except:
            existing = {}
    else:
        body = content
        existing = {}

    # Use diataxis_label from meta if available, else fallback to diataxis_type
    diataxis_display = meta.get('diataxis_label', diataxis_type.replace('-', ' ').title())

    frontmatter = {
        'title': meta.get('title', ''),
        'diataxis': diataxis_display,
        'domain': meta.get('domain', ''),
        'topic': meta.get('topic', ''),
        'source': meta.get('source', ''),
    }

    if meta.get('source_url'):
        frontmatter['source_url'] = meta.get('source_url')
    if meta.get('created'):
        frontmatter['date'] = meta.get('created')
    if meta.get('source_url'):
        frontmatter['keywords'] = ['knowledge-base', meta.get('topic', ''), meta.get('domain', ''), diataxis_type]

    # Use proper YAML serialization to avoid quoting issues
    yaml_str = yaml.dump(frontmatter, default_flow_style=False, allow_unicode=True, sort_keys=False)
    yaml_block = '---\n' + yaml_str + '---\n'
    return yaml_block + body


def fix_mdx_issues(content: str) -> str:
    """Fix common MDX parsing issues."""
    lines = content.split('\n')
    fixed_lines = []
    in_code_block = False
    in_frontmatter = False

    for line in lines:
        if line.strip().startswith('```'):
            in_code_block = not in_code_block
            fixed_lines.append(line)
            continue
        if in_code_block:
            fixed_lines.append(line)
            continue
        if line.strip() == '---':
            in_frontmatter = not in_frontmatter
            fixed_lines.append(line)
            continue
        if in_frontmatter:
            fixed_lines.append(line)
            continue
        # Skip headings — don't touch them
        if line.lstrip().startswith('#'):
            fixed_lines.append(line)
            continue
        # Escape < followed by non-alpha/non-slash (triggers JSX parsing)
        fixed = re.sub(r'(?<!")<(?![a-zA-Z/])', '&lt;', line)
        fixed_lines.append(fixed)

    return '\n'.join(fixed_lines)


def extract_title_from_content(content: str) -> str:
    """Extract title from first H1 heading."""
    fm_pattern = re.compile(r'^---\s*\n(.*?)\n---\s*\n', re.DOTALL)
    match = fm_pattern.match(content)
    body = content[match.end():] if match else content
    title_match = re.search(r'^#\s+(.+)$', body, re.MULTILINE)
    if title_match:
        return title_match.group(1).strip()
    return ""


def extract_yaml_metadata(content: str) -> dict:
    """Extract metadata from YAML frontmatter."""
    fm_pattern = re.compile(r'^---\s*\n(.*?)\n---\s*', re.DOTALL)
    match = fm_pattern.match(content)
    if match:
        try:
            data = yaml.safe_load(match.group(1))
            return data if isinstance(data, dict) else {}
        except:
            pass
    return {}


def map_kb_to_docs_path(kb_file: Path) -> tuple:
    """Map a KB file path to docs/ destination organized by Diátaxis type."""
    rel = kb_file.relative_to(KB_SOURCE)
    parts = rel.parts

    if len(parts) < 1:
        return None, {}

    # Skip INDEX.md files
    if parts[-1] == 'INDEX.md':
        return None, {}

    # Read file and extract metadata
    try:
        content = kb_file.read_text(encoding='utf-8')
    except Exception as e:
        errors.append(f"Cannot read {kb_file}: {e}")
        return None, {}

    meta = extract_yaml_metadata(content)
    title = meta.get('title', '') or extract_title_from_content(content)

    # Detect Diátaxis type from filename
    diataxis_path, diataxis_label = detect_diataxis_type(parts[-1])

    # Build domain/topic path
    if len(parts) >= 3:
        # Normal structure: Domain/Topic/file.md
        domain = sanitize_dirname(parts[0])
        topic = sanitize_dirname(parts[1])
    elif len(parts) == 2:
        # Root-level HOWTO/ or REFERENCE/ folder -> assign to 'general' domain
        domain = 'general'
        topic = ''
    else:
        domain = 'general'
        topic = ''

    slug = sanitize_filename(parts[-1])

    # Build docs path: docs/<diataxis-path>/<domain>[/<topic>]/<slug>.md
    if topic:
        dest_dir = DOCS_DIR / diataxis_path / domain / topic
    else:
        dest_dir = DOCS_DIR / diataxis_path / domain

    dest_file = dest_dir / f"{slug}.md"

    return dest_file, {
        'title': title,
        'domain': parts[0] if len(parts) >= 1 else 'General',
        'topic': parts[1] if len(parts) > 2 else '',
        'source': meta.get('source', ''),
        'source_url': meta.get('source_url', ''),
        'created': meta.get('created', meta.get('research_date', '')),
        'diataxis': diataxis_path,
        'diataxis_label': diataxis_label,
    }


def sync_kb():
    """Main sync function."""
    print("=" * 60)
    print("KB Sync — Organizing by Diátaxis type")
    print("=" * 60)

    # Collect all KB markdown files
    kb_files = list(KB_SOURCE.rglob("*.md"))
    print(f"\nFound {len(kb_files)} markdown files in KB source")

    # Get existing docs files
    existing_files = set()
    if DOCS_DIR.exists():
        existing_files = {p.relative_to(DOCS_DIR) for p in DOCS_DIR.rglob("*.md")}

    # Process each KB file
    new_files = {}
    for kb_file in kb_files:
        dest_file, meta = map_kb_to_docs_path(kb_file)
        if dest_file is None:
            continue

        rel_dest = dest_file.relative_to(DOCS_DIR)
        new_files[rel_dest] = (kb_file, meta)

        if dest_file.exists():
            # Always regenerate to catch frontmatter/YAML fixes
            content = kb_file.read_text(encoding='utf-8')
            content = fix_yaml_frontmatter(content, meta, meta['diataxis'])
            content = fix_mdx_issues(content)
            existing_content = dest_file.read_text(encoding='utf-8')
            if content != existing_content:
                dest_file.parent.mkdir(parents=True, exist_ok=True)
                dest_file.write_text(content, encoding='utf-8')
                updated.append(str(rel_dest))
                print(f"  UPDATED: {rel_dest}")
        else:
            content = kb_file.read_text(encoding='utf-8')
            content = fix_yaml_frontmatter(content, meta, meta['diataxis'])
            content = fix_mdx_issues(content)
            dest_file.parent.mkdir(parents=True, exist_ok=True)
            dest_file.write_text(content, encoding='utf-8')
            added.append(str(rel_dest))
            print(f"  ADDED:   {rel_dest}")

    # Remove stale files
    for old_rel in existing_files:
        if old_rel not in new_files:
            old_file = DOCS_DIR / old_rel
            if old_file.exists():
                old_file.unlink()
                removed.append(str(old_rel))
                print(f"  REMOVED: {old_rel}")

    # Clean up empty directories
    for dirpath, dirnames, filenames in os.walk(DOCS_DIR, topdown=False):
        if not filenames and not dirnames:
            try:
                Path(dirpath).rmdir()
            except:
                pass

    print(f"\nSync complete: {len(added)} added, {len(updated)} updated, {len(removed)} removed")
    return len(added) + len(updated) > 0 or len(removed) > 0


def update_sidebars():
    """Update sidebars.js organized by Diátaxis type."""
    print("\nUpdating sidebar configuration (Diátaxis-first)...")

    # Diátaxis type ordering and labels
    diataxis_order = [
        ('tutorials', 'Tutorials', 'book-open'),
        ('how-to', 'How-to Guides', 'wrench'),
        ('explanations', 'Explanations', 'book'),
        ('examples', 'Examples', 'code'),
    ]

    categories = []
    for diataxis_type, label, _ in diataxis_order:
        type_dir = DOCS_DIR / diataxis_type
        if not type_dir.exists():
            continue

        items = []
        for domain_dir in sorted(type_dir.iterdir()):
            if not domain_dir.is_dir():
                continue

            domain_slug = domain_dir.name
            domain_label = DOMAIN_LABELS.get(domain_slug, domain_slug.replace('-', ' ').title())

            # Get subcategories (topics)
            topic_dirs = sorted([d for d in domain_dir.iterdir() if d.is_dir()])
            domain_files = sorted([str(f.relative_to(DOCS_DIR).with_suffix('')) for f in domain_dir.glob("*.md")])

            if topic_dirs:
                for topic_dir in topic_dirs:
                    topic_label = topic_dir.name.replace('-', ' ').title()
                    topic_files = sorted([str(f.relative_to(DOCS_DIR).with_suffix('')) for f in topic_dir.glob("*.md")])
                    if topic_files:
                        items.append({
                            'type': 'category',
                            'label': topic_label,
                            'items': topic_files,
                        })
                # Also add files directly in domain if any
                if domain_files:
                    items.extend(domain_files)
            elif domain_files:
                items.extend(domain_files)

        if items:
            categories.append({
                'type': 'category',
                'label': label,
                'items': items,
            })

    # Build sidebar JS
    entries = []
    for cat in categories:
        lines = []
        lines.append("    {")
        lines.append("      type: 'category',")
        lines.append("      label: '%s'," % cat['label'])
        lines.append("      collapsed: true,")
        lines.append("      items: [")

        for item in cat['items']:
            if isinstance(item, dict):
                file_list = ', '.join(["'" + f + "'" for f in item['items']]) if item['items'] else ''
                lines.append("        {")
                lines.append("          type: 'category',")
                lines.append("          label: '%s'," % item['label'])
                lines.append("          items: [%s]," % file_list)
                lines.append("        },")
            else:
                lines.append("        '%s'," % item)

        lines.append("      ],")
        lines.append("    },")
        entries.append('\n'.join(lines))

    new_sidebars = """const sidebars = {
  main: [
"""
    if entries:
        new_sidebars += '\n'.join(entries) + '\n'
    new_sidebars += """  ],
};

export default sidebars;
"""

    SIDEBARS.write_text(new_sidebars)
    print(f"  Sidebar updated with {len(categories)} Diátaxis categories")


def count_by_type():
    """Count articles by Diátaxis type."""
    counts = {}
    for dirpath, dirnames, filenames in os.walk(DOCS_DIR):
        dp = Path(dirpath)
        rel = dp.relative_to(DOCS_DIR)
        top_level = rel.parts[0] if rel.parts else ''
        if top_level in ('tutorials', 'how-to', 'explanations', 'examples'):
            counts[top_level] = counts.get(top_level, 0) + len(filenames)
    return counts


def generate_whats_new():
    """Generate recent content list for homepage."""
    import json
    
    recent = []
    for dirpath, dirnames, filenames in os.walk(DOCS_DIR):
        dp = Path(dirpath)
        for f in filenames:
            if f.endswith('.md'):
                fp = dp / f
                rel = fp.relative_to(DOCS_DIR)
                parts = rel.parts
                if len(parts) >= 2:
                    diataxis_type = parts[0]
                    title_match = re.match(r'(tutorial|howto|how-to|explanation|example)-(.+)', f.replace('.md', ''))
                    if title_match:
                        title = title_match.group(2).replace('-', ' ').title()
                        type_label = diataxis_type.replace('how-to', 'How-to').replace('explanations', 'Explanation').title()
                        # Estimate reading time (200 words/min average)
                        try:
                            content = fp.read_text(encoding='utf-8')
                            words = len(content.split())
                            read_time = max(1, round(words / 200))
                        except:
                            read_time = 3
                        recent.append({
                            'title': title,
                            'type': type_label,
                            'link': '/' + '/'.join(parts).replace('.md', ''),
                            'time': f'{read_time} min read',
                            'mtime': fp.stat().st_mtime,
                        })
    
    # Sort by modification time (newest first), take top 6
    recent.sort(key=lambda x: x['mtime'], reverse=True)
    recent = recent[:6]
    
    # Remove mtime from output
    for r in recent:
        del r['mtime']
    
    # Write to JSON file for homepage to consume
    whats_new_path = Path('/home/tcharlopenclaw/code/kb/static/whats-new.json')
    with open(whats_new_path, 'w') as f:
        json.dump(recent, f, indent=2)
    
    return recent


if __name__ == "__main__":
    try:
        changed = sync_kb()
        update_sidebars()
        counts = count_by_type()
        total = sum(counts.values())
        print(f"\nContent by Diátaxis type:")
        for t, c in sorted(counts.items()):
            print(f"  {t}: {c}")
        print(f"  Total: {total}")
        
        # Generate what's new data
        recent = generate_whats_new()
        print(f"\nWhat's New ({len(recent)} items):")
        for r in recent:
            print(f"  [{r['type']}] {r['title']} ({r['time']})")

        if errors:
            print(f"\nErrors encountered: {len(errors)}")
            for e in errors:
                print(f"  - {e}")

        print("\nSync complete.")
        sys.exit(0 if not errors else 1)
    except Exception as e:
        print(f"FATAL: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)
