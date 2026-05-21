#!/usr/bin/env python3
"""KB Sync Script - Syncs Obsidian KB to Docusaurus site"""

import os
import re
import sys
from pathlib import Path
from datetime import datetime
import subprocess

KB_DIR = Path("/home/tcharlopenclaw/Documents/LearningNotes/KB")
DOCS_DIR = Path("/home/tcharlopenclaw/code/kb/docs")
TODAY = datetime.now().strftime("%Y-%m-%d")

# Category mapping: KB folder prefix -> Docusaurus docs folder
CAT_MAP = {
    "AI & Machine Learning/AI-Assisted Development": "ai-ml/ai-assisted-dev",
    "AI & Machine Learning/LLMs & Agents": "ai-ml/llms-agents",
    "AI & Machine Learning/Local AI": "ai-ml/local-ai",
    "AI & Machine Learning/ML Ops": "ai-ml/ml-ops",
    "Cloud & Infrastructure/Kubernetes": "cloud-infra/kubernetes",
    "Cloud & Infrastructure": "cloud-infra/general",
    "Data & Databases/Data Architecture": "data-databases/data-architecture",
    "Developer Tools & Practices/Architecture & Reliability": "devtools/architecture-reliability",
    "Developer Tools & Practices/CI-CD & Platforms": "devtools/cicd-platforms",
    "Programming/Java & Spring": "programming/java-spring",
    "Security & Privacy/AppSec & Privacy": "security/appsec-privacy",
}

# Diataxis type -> Docusaurus tags
DIATAXIS_TAGS = {
    "howto": "howto,guide",
    "example": "example,casestudy",
    "reference": "reference,documentation",
    "news": "news,article",
    "tutorial": "tutorial,learning",
}

added = 0
updated = 0
changes = []

def extract_frontmatter(content):
    """Extract YAML frontmatter from markdown content."""
    fm = {}
    body = content
    if content.startswith("---"):
        parts = content.split("---", 2)
        if len(parts) >= 3:
            yaml_block = parts[1]
            body = parts[2]
            for line in yaml_block.strip().split("\n"):
                if ":" in line:
                    key, _, val = line.partition(":")
                    fm[key.strip()] = val.strip().strip('"')
    return fm, body

def get_category(rel_path):
    """Find the matching category for a KB file path."""
    rel_str = str(rel_path)
    best_match = None
    best_len = 0
    for cat_key, dest in CAT_MAP.items():
        if rel_str.startswith(cat_key) and len(cat_key) > best_len:
            best_match = dest
            best_len = len(cat_key)
    return best_match

def convert_kb_to_docusaurus(kb_file, output_file):
    """Convert a KB article to Docusaurus-compatible format."""
    content = kb_file.read_text(encoding="utf-8")
    
    fm, body = extract_frontmatter(content)
    
    # Extract title from first heading
    title = fm.get("title", "")
    if not title:
        title_match = re.search(r'^#\s+(.+)', body, re.MULTILINE)
        if title_match:
            title = title_match.group(1)
    
    # Get date
    date = fm.get("created", fm.get("date", TODAY))
    
    # Get diataxis type for tags
    diataxis = fm.get("diataxis", "reference")
    tags = DIATAXIS_TAGS.get(diataxis, diataxis)
    
    # Get domain
    domain = fm.get("domain", "General")
    
    # Existing tags from frontmatter
    existing_tags = fm.get("tags", "")
    if existing_tags and "[" in existing_tags:
        # Parse existing tags like [security, authorization, ai-agents]
        tag_list = re.sub(r'[\[\]]', '', existing_tags).split(",")
        tags = ",".join(t.strip() for t in tag_list if t.strip())
    
    # Clean up body - remove Obsidian wikilinks
    body = re.sub(r'\[\[INDEX[^]]*\]\].*$', '', body, flags=re.MULTILINE)
    body = re.sub(r'\[\[[^\]]*INDEX[^\]]*\]\].*$', '', body, flags=re.MULTILINE)
    
    # Convert remaining wikilinks
    # [[text|url]] -> [text](url)
    body = re.sub(r'\[\[([^]|]+)\|([^\]]+)\]\]', r'[\1](\2)', body)
    # [[text]] -> [text](./text)
    body = re.sub(r'\[\[([^\]]+)\]\]', r'[\1](.\1)', body)
    
    # Clean trailing empty lines
    body = body.rstrip() + "\n"
    
    # Create Docusaurus frontmatter
    # Truncate sidebar_label at word boundary, max 60 chars
    if len(title) > 60:
        truncated = title[:60].rsplit(' ', 1)[0]
        sidebar_label = truncated if truncated else title[:60]
    else:
        sidebar_label = title

    # Remove embedded quotes that break YAML double-quoted strings
    safe_title = title.replace('"', '').replace("'", "")
    safe_sidebar = sidebar_label.replace('"', '').replace("'", "")
    # Domain names with & or commas need quoting in YAML arrays
    safe_domain = domain.replace('"', '').replace("'", "")

    frontmatter = f"""---
title: "{safe_title}"
description: "{safe_title}"
tags: [{tags}, "{safe_domain}"]
date: {date}
sidebar_label: "{safe_sidebar}"
---

"""
    
    output_file.parent.mkdir(parents=True, exist_ok=True)
    output_file.write_text(frontmatter + body, encoding="utf-8")

# Process all KB files
kb_files = sorted(KB_DIR.rglob("*.md"))
kb_files = [f for f in kb_files if f.name != "INDEX.md"]

for kb_file in kb_files:
    rel_path = kb_file.relative_to(KB_DIR)
    dest_folder = get_category(rel_path)
    
    if not dest_folder:
        print(f"WARN: No category mapping for: {rel_path}")
        continue
    
    filename = kb_file.stem
    # Clean filename: lowercase, strip trailing hyphens/dots, max 80 chars
    if len(filename) > 80:
        filename = filename[:80].rsplit(' ', 1)[0]
    filename = filename.rstrip('-_.')
    output_file = DOCS_DIR / dest_folder / f"{filename}.md"
    
    # Check if update or add
    if output_file.exists():
        kb_mtime = kb_file.stat().st_mtime
        doc_mtime = output_file.stat().st_mtime
        if kb_mtime > doc_mtime:
            convert_kb_to_docusaurus(kb_file, output_file)
            updated += 1
            changes.append(f"Updated: {filename}")
    else:
        convert_kb_to_docusaurus(kb_file, output_file)
        added += 1
        changes.append(f"Added: {filename}")

print(f"SYNC_RESULT: added={added} updated={updated} removed=0")
for c in changes:
    print(f"  - {c}")
