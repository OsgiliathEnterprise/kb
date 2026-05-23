#!/usr/bin/env python3
"""Regenerate sidebar entries organized by Diátaxis type."""
import os
from pathlib import Path

DOCS_DIR = Path("/home/tcharlopenclaw/code/kb/docs/")
SIDEBARS = Path("/home/tcharlopenclaw/code/kb/sidebars.js")

DOMAIN_LABELS = {
    'ai-machine-learning': 'AI & Machine Learning',
    'cloud-infrastructure': 'Cloud & Infrastructure',
    'data-databases': 'Data & Databases',
    'developer-tools-practices': 'Developer Tools & Practices',
    'programming': 'Programming',
    'security-privacy': 'Security & Privacy',
    'general': 'General',
}

DIATAXIS_ORDER = ['tutorials', 'how-to', 'reference', 'examples']
DIATAXIS_LABELS = {
    'tutorials': 'Tutorials',
    'how-to': 'How-to Guides',
    'reference': 'Reference',
    'examples': 'Examples',
}


def get_doc_id(file_path):
    rel = file_path.relative_to(DOCS_DIR)
    return str(rel.with_suffix(''))


def build_sidebar():
    categories = []
    for diataxis_type in DIATAXIS_ORDER:
        type_dir = DOCS_DIR / diataxis_type
        if not type_dir.exists():
            continue

        items = []
        for domain_dir in sorted(type_dir.iterdir()):
            if not domain_dir.is_dir():
                continue

            domain_label = DOMAIN_LABELS.get(domain_dir.name, domain_dir.name.replace('-', ' ').title())

            topic_dirs = sorted([d for d in domain_dir.iterdir() if d.is_dir()])
            domain_files = sorted([get_doc_id(f) for f in domain_dir.glob("*.md")])

            if topic_dirs:
                for topic_dir in topic_dirs:
                    topic_label = topic_dir.name.replace('-', ' ').title()
                    topic_files = sorted([get_doc_id(f) for f in topic_dir.glob("*.md")])
                    if topic_files:
                        items.append(('category', topic_label, topic_files))
                if domain_files:
                    items.extend(domain_files)
            elif domain_files:
                items.extend(domain_files)

        if items:
            categories.append((DIATAXIS_LABELS.get(diataxis_type, diataxis_type), items))

    return categories


def sidebar_to_js(categories):
    lines = ["const sidebars = {", "  main: ["]
    lines.append("    {")
    lines.append("      type: 'doc',")
    lines.append("      id: 'index',")
    lines.append("      label: 'Discover',")
    lines.append("    },")

    for cat_label, cat_items in categories:
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

    lines.append("  ],")
    lines.append("};")
    lines.append("")
    lines.append("export default sidebars;")
    lines.append("")

    return '\n'.join(lines)


def main():
    categories = build_sidebar()
    content = sidebar_to_js(categories)
    SIDEBARS.write_text(content)
    print("Sidebar regenerated with %d Diátaxis categories" % len(categories))


if __name__ == "__main__":
    main()
