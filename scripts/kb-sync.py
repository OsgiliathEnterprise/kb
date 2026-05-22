#!/usr/bin/env python3
"""
KB Sync Script — Syncs LearningNotes KB to Docusaurus docs/
Handles: filename sanitization, YAML frontmatter, MDX fixes, sidebar updates
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

# Track changes
added = []
updated = []
removed = []
errors = []

def sanitize_filename(name: str) -> str:
    """Convert filename to safe Docusaurus slug."""
    # Remove .md extension for processing
    slug = name.replace(".md", "").replace(".mdx", "")
    # Lowercase
    slug = slug.lower()
    # Replace special chars with hyphens
    slug = re.sub(r'[^a-z0-9\s-]', '-', slug)
    # Replace spaces with hyphens
    slug = re.sub(r'\s+', '-', slug)
    # Collapse multiple hyphens
    slug = re.sub(r'-{2,}', '-', slug)
    # Remove trailing hyphens, dots, underscores
    slug = slug.rstrip('-_.')
    # Truncate at word boundary (max 80 chars)
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

def fix_yaml_frontmatter(content: str, meta: dict) -> str:
    """Ensure proper YAML frontmatter for Docusaurus."""
    # Extract existing frontmatter if any
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
    
    # Merge metadata - KB fields take priority for their domain
    frontmatter = {
        'title': meta.get('title', ''),
        'diataxis': meta.get('diataxis', 'reference'),
        'domain': meta.get('domain', ''),
        'topic': meta.get('topic', ''),
        'source': meta.get('source', ''),
    }
    
    # Add optional fields only if present
    if meta.get('source_url'):
        frontmatter['source_url'] = meta.get('source_url')
    if meta.get('created'):
        frontmatter['date'] = meta.get('created')
    if meta.get('source_url'):
        frontmatter['keywords'] = ['knowledge-base', meta.get('topic', ''), meta.get('domain', '')]
    
    # Format YAML
    yaml_lines = []
    for key, value in frontmatter.items():
        if isinstance(value, str):
            # Quote strings containing special chars
            if any(c in value for c in [':', '#', '[', ']', '{', '}', ',', '&', '*', '?', '|', '-', '<', '>', '=', '!', '%', '@', '`']):
                yaml_lines.append(f'{key}: "{value}"')
            elif value.startswith(('http://', 'https://')):
                yaml_lines.append(f'{key}: "{value}"')
            else:
                yaml_lines.append(f'{key}: {value}')
        elif isinstance(value, list):
            yaml_lines.append(f'{key}:')
            for item in value:
                yaml_lines.append(f'  - "{item}"')
        else:
            yaml_lines.append(f'{key}: {value}')
    
    yaml_block = '---\n' + '\n'.join(yaml_lines) + '\n---\n'
    return yaml_block + body

def fix_mdx_issues(content: str) -> str:
    """Fix common MDX parsing issues."""
    # Escape bare < that aren't part of HTML tags or code blocks
    lines = content.split('\n')
    fixed_lines = []
    in_code_block = False
    
    for line in lines:
        # Track code blocks
        if line.strip().startswith('```'):
            in_code_block = not in_code_block
            fixed_lines.append(line)
            continue
        
        if in_code_block:
            fixed_lines.append(line)
            continue
        
        # Skip frontmatter
        if line.startswith('---') or line.startswith('#') or line.startswith('-'):
            fixed_lines.append(line)
            continue
        
        # Fix bare < in text (not in HTML tags)
        # Only escape < that aren't followed by a letter (HTML tag) or / (closing tag)
        fixed = re.sub(r'(?<!\")<(?![a-zA-Z/])', '&lt;', line)
        fixed_lines.append(fixed)
    
    return '\n'.join(fixed_lines)

def extract_title_from_content(content: str) -> str:
    """Extract title from first H1 heading."""
    # Remove frontmatter first
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
    """Map a KB file path to docs/ destination path and metadata."""
    # KB structure: KB/Domain/Topic/file.md
    rel = kb_file.relative_to(KB_SOURCE)
    parts = rel.parts
    
    if len(parts) < 2:
        # Root INDEX.md - skip
        return None, {}
    
    domain = sanitize_dirname(parts[0])
    topic = sanitize_dirname(parts[1]) if len(parts) > 2 else ''
    
    # Skip INDEX.md files - they're navigation only
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
    
    slug = sanitize_filename(parts[-1])
    
    # Build docs path
    if topic:
        dest_dir = DOCS_DIR / "kb" / domain / topic
    else:
        dest_dir = DOCS_DIR / "kb" / domain
    
    dest_file = dest_dir / f"{slug}.md"
    
    return dest_file, {
        'title': title,
        'domain': parts[0],
        'topic': parts[1] if len(parts) > 2 else '',
        'source': meta.get('source', ''),
        'source_url': meta.get('source_url', ''),
        'created': meta.get('created', meta.get('research_date', '')),
        'diataxis': meta.get('diataxis', 'reference'),
    }

def sync_kb():
    """Main sync function."""
    print("=" * 60)
    print("KB Sync — Syncing LearningNotes to Docusaurus docs/")
    print("=" * 60)
    
    # Collect all KB markdown files
    kb_files = list(KB_SOURCE.rglob("*.md"))
    print(f"\nFound {len(kb_files)} markdown files in KB source")
    
    # Get existing docs files (only kb/ subdirectory)
    kb_docs_dir = DOCS_DIR / "kb"
    existing_kb_files = set()
    if kb_docs_dir.exists():
        existing_kb_files = {p.relative_to(DOCS_DIR) for p in kb_docs_dir.rglob("*.md")}
    
    # Process each KB file
    new_files = {}
    for kb_file in kb_files:
        dest_file, meta = map_kb_to_docs_path(kb_file)
        if dest_file is None:
            continue
        
        rel_dest = dest_file.relative_to(DOCS_DIR)
        new_files[rel_dest] = (kb_file, meta)
        
        # Check if file needs update
        if dest_file.exists():
            # Compare modification times
            if kb_file.stat().st_mtime > dest_file.stat().st_mtime:
                # File updated
                content = kb_file.read_text(encoding='utf-8')
                content = fix_yaml_frontmatter(content, meta)
                content = fix_mdx_issues(content)
                
                dest_file.parent.mkdir(parents=True, exist_ok=True)
                dest_file.write_text(content, encoding='utf-8')
                updated.append(str(rel_dest))
                print(f"  UPDATED: {rel_dest}")
        else:
            # New file
            content = kb_file.read_text(encoding='utf-8')
            content = fix_yaml_frontmatter(content, meta)
            content = fix_mdx_issues(content)
            
            dest_file.parent.mkdir(parents=True, exist_ok=True)
            dest_file.write_text(content, encoding='utf-8')
            added.append(str(rel_dest))
            print(f"  ADDED:   {rel_dest}")
    
    # Remove stale files
    for old_rel in existing_kb_files:
        if old_rel not in new_files:
            old_file = DOCS_DIR / old_rel
            if old_file.exists():
                old_file.unlink()
                removed.append(str(old_rel))
                print(f"  REMOVED: {old_rel}")
    
    print(f"\nSync complete: {len(added)} added, {len(updated)} updated, {len(removed)} removed")
    return len(added) + len(updated) > 0 or len(removed) > 0

def update_sidebars():
    """Update sidebars.js to include KB content."""
    print("\nUpdating sidebar configuration...")
    
    # Build sidebar entries from docs/kb/ structure
    kb_dir = DOCS_DIR / "kb"
    if not kb_dir.exists():
        print("  No KB directory found — skipping sidebar update")
        return
    
    categories = []
    for domain_dir in sorted(kb_dir.iterdir()):
        if not domain_dir.is_dir():
            continue
        
        domain_label = domain_dir.name.replace('-', ' ').title()
        items = []
        
        # Check for subcategories (topics)
        topic_dirs = sorted([d for d in domain_dir.iterdir() if d.is_dir()])
        if topic_dirs:
            for topic_dir in topic_dirs:
                topic_label = topic_dir.name.replace('-', ' ').title()
                topic_files = sorted([f.stem for f in topic_dir.glob("*.md")])
                if topic_files:
                    items.append({
                        'type': 'category',
                        'label': topic_label,
                        'items': topic_files,
                    })
        else:
            # Files directly in domain
            domain_files = sorted([f.stem for f in domain_dir.glob("*.md")])
            items.extend(domain_files)
        
        if items:
            categories.append({
                'type': 'category',
                'label': f"Knowledge Base: {domain_label}",
                'items': items,
            })
    
    # Read current sidebars
    sidebars_content = SIDEBARS.read_text()
    
    # Build the new sidebar entries as JS code
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
    
    new_entries_block = '\n'.join(entries)
    
    # Insert before the closing of docsSidebar array
    insert_marker = '  ],\n};'
    if insert_marker in sidebars_content:
        if entries:
            new_sidebars = sidebars_content.replace(
                insert_marker,
                '\n    // ── Knowledge Base (auto-generated) ──\n' + new_entries_block + '\n' + insert_marker
            )
        else:
            new_sidebars = sidebars_content
    else:
        print("  WARNING: Could not find sidebar insertion point")
        return
    
    SIDEBARS.write_text(new_sidebars)
    print("  Sidebar updated with %d KB categories" % len(categories))

def count_total_articles():
    """Count total articles in docs/."""
    count = len(list(DOCS_DIR.rglob("*.md")))
    return count

if __name__ == "__main__":
    try:
        changed = sync_kb()
        update_sidebars()
        total = count_total_articles()
        print(f"\nTotal articles in docs/: {total}")
        
        if errors:
            print(f"\nErrors encountered: {len(errors)}")
            for e in errors:
                print(f"  - {e}")
        
        print("\nSync summary:")
        print(f"  Added:   {len(added)}")
        print(f"  Updated: {len(updated)}")
        print(f"  Removed: {len(removed)}")
        print(f"  Errors:  {len(errors)}")
        print(f"  Total:   {total}")
        
        sys.exit(0 if not errors else 1)
    except Exception as e:
        print(f"FATAL: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)
