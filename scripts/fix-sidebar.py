#!/usr/bin/env python3
"""Regenerate KB sidebar entries with full paths."""
import os
from pathlib import Path

DOCS_DIR = Path("/home/tcharlopenclaw/code/kb/docs/")
KB_DIR = DOCS_DIR / "kb"
SIDEBARS = Path("/home/tcharlopenclaw/code/kb/sidebars.js")

def get_doc_id(file_path):
    """Get Docusaurus doc ID from file path (relative to docs/, without .md)."""
    rel = file_path.relative_to(DOCS_DIR)
    return str(rel.with_suffix(''))

def build_kb_sidebar():
    """Build sidebar entries for KB content."""
    if not KB_DIR.exists():
        return []
    
    categories = []
    for domain_dir in sorted(KB_DIR.iterdir()):
        if not domain_dir.is_dir():
            continue
        
        domain_label = domain_dir.name.replace('-', ' ').title()
        items = []
        
        # Get files directly in domain directory
        domain_files = sorted([get_doc_id(f) for f in domain_dir.glob("*.md")])
        
        # Get subcategory (topic) directories
        topic_dirs = sorted([d for d in domain_dir.iterdir() if d.is_dir()])
        
        topic_items = []
        for topic_dir in topic_dirs:
            topic_label = topic_dir.name.replace('-', ' ').title()
            topic_files = sorted([get_doc_id(f) for f in topic_dir.glob("*.md")])
            if topic_files:
                topic_items.append((topic_label, topic_files))
        
        # If there are files directly in domain dir, add them
        if domain_files:
            items.extend(domain_files)
        
        # Add topic subcategories
        for topic_label, topic_files in topic_items:
            items.append(('category', topic_label, topic_files))
        
        if items:
            categories.append(('category', 'Knowledge Base: %s' % domain_label, items))
    
    return categories

def sidebar_to_js(categories):
    """Convert sidebar data to JS code."""
    lines = []
    lines.append("    // ── Knowledge Base (auto-generated) ──")
    
    for cat_type, cat_label, cat_items in categories:
        lines.append("    {")
        lines.append("      type: 'category',")
        lines.append("      label: '%s'," % cat_label)
        lines.append("      collapsed: true,")
        lines.append("      items: [")
        
        item_strs = []
        for item in cat_items:
            if isinstance(item, tuple) and item[0] == 'category':
                _, sub_label, sub_files = item
                file_list = ', '.join(["'" + f + "'" for f in sub_files])
                item_strs.append("        {\n          type: 'category',\n          label: '%s',\n          items: [%s],\n        }" % (sub_label, file_list))
            else:
                item_strs.append("        '%s'" % item)
        
        lines.append(",\n".join(item_strs) + ",")
        lines.append("      ],")
        lines.append("    },")
    
    return '\n'.join(lines)

def main():
    categories = build_kb_sidebar()
    kb_block = sidebar_to_js(categories)
    
    # Read current sidebars
    content = SIDEBARS.read_text()
    
    # Remove old KB section
    marker_start = "    // ── Knowledge Base (auto-generated) ──"
    marker_end = "  ],\n};"
    
    if marker_start in content:
        # Find and remove old KB section
        start_idx = content.index(marker_start)
        end_idx = content.rindex(marker_end)
        content = content[:start_idx] + content[end_idx:]
    
    # Insert new KB section
    if kb_block:
        content = content.replace(
            marker_end,
            kb_block + '\n' + marker_end
        )
    
    SIDEBARS.write_text(content)
    print("Sidebar regenerated with %d KB categories" % len(categories))

if __name__ == "__main__":
    main()
