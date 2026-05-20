#!/bin/bash
# KB Sync Script - Syncs Obsidian KB to Docusaurus site
set -euo pipefail

KB_DIR="/home/tcharlopenclaw/Documents/LearningNotes/KB"
DOCS_DIR="/home/tcharlopenclaw/code/kb/docs"
TODAY=$(date +%Y-%m-%d)
ADDED=0
UPDATED=0
REMOVED=0
CHANGES=""

# Category mapping: KB folder path -> Docusaurus docs folder
declare -A CAT_MAP
CAT_MAP["AI & Machine Learning/AI-Assisted Development"]="ai-ml/ai-assisted-dev"
CAT_MAP["AI & Machine Learning/LLMs & Agents"]="ai-ml/llms-agents"
CAT_MAP["AI & Machine Learning/Local AI"]="ai-ml/local-ai"
CAT_MAP["AI & Machine Learning/ML Ops"]="ai-ml/ml-ops"
CAT_MAP["Cloud & Infrastructure"]="cloud-infra/general"
CAT_MAP["Cloud & Infrastructure/Kubernetes"]="cloud-infra/kubernetes"
CAT_MAP["Data & Databases/Data Architecture"]="data-databases/data-architecture"
CAT_MAP["Developer Tools & Practices/Architecture & Reliability"]="devtools/architecture-reliability"
CAT_MAP["Developer Tools & Practices/CI-CD & Platforms"]="devtools/cicd-platforms"
CAT_MAP["Programming/Java & Spring"]="programming/java-spring"
CAT_MAP["Security & Privacy/AppSec & Privacy"]="security/appsec-privacy"

# Diataxis type mapping for Docusaurus tags
declare -A DIATAXIS_TAGS
DIATAXIS_TAGS["howto"]="howto,guide"
DIATAXIS_TAGS["example"]="example,casestudy"
DIATAXIS_TAGS["reference"]="reference,documentation"
DIATAXIS_TAGS["news"]="news,article"
DIATAXIS_TAGS["tutorial"]="tutorial,learning"

convert_kb_to_docusaurus() {
    local kb_file="$1"
    local output_file="$2"
    
    # Read the file
    local content
    content=$(cat "$kb_file")
    
    # Extract frontmatter fields
    local created diataxis domain topic source source_url title
    created=$(echo "$content" | grep '^created:' | head -1 | sed 's/^created: *//')
    diataxis=$(echo "$content" | grep '^diataxis:' | head -1 | sed 's/^diataxis: *//')
    domain=$(echo "$content" | grep '^domain:' | head -1 | sed 's/^domain: *//')
    topic=$(echo "$content" | grep '^topic:' | head -1 | sed 's/^topic: *//')
    source=$(echo "$content" | grep '^source:' | head -1 | sed 's/^source: *//')
    source_url=$(echo "$content" | grep '^source_url:' | head -1 | sed 's/^source_url: *//')
    
    # Extract title (first # heading)
    title=$(echo "$content" | grep '^#' | head -1 | sed 's/^# //')
    
    # Get tags from diataxis
    local tags="${DIATAXIS_TAGS[$diataxis]:-$diataxis}"
    
    # Create Docusaurus frontmatter
    local fm
    fm="---
title: \"$title\"
description: \"$title\"
tags: [$tags, $domain]
date: ${created:-$TODAY}
sidebar_label: $(echo "$title" | cut -c1-60)
---

"
    
    # Get body content (after frontmatter ---)
    local body
    body=$(echo "$content" | sed -n '/^---$/,/^---$/p' | tail -n +3)
    
    # Remove Obsidian wikilinks from the end
    body=$(echo "$body" | grep -v '^\[\[INDEX' | grep -v '^\[\[../../INDEX' | grep -v '^\[\[../../../INDEX' | grep -v '^\[\[../../../../INDEX' || echo "$body")
    
    # Convert remaining wikilinks [[text|url]] to [text](url) and [[text]] to [text](./text)
    body=$(echo "$body" | sed -E 's/\[\[([^]|]+\|[^\]]+)\]\]/[\1]/g; s/\[\[([^\]]+)\]\]/[\1](.\1)/g')
    
    # Clean up empty lines at end
    body=$(echo "$body" | sed -e :a -e '/^\n*$/{$d;N;ba' -e '}')
    
    # Write output
    echo -e "${fm}${body}" > "$output_file"
}

# Process each KB file
while IFS= read -r kb_file; do
    # Get relative path from KB dir
    rel_path="${kb_file#$KB_DIR/}"
    
    # Find matching category
    dest_folder=""
    for cat_key in "${!CAT_MAP[@]}"; do
        if [[ "$rel_path" == "$cat_key"* ]]; then
            dest_folder="${CAT_MAP[$cat_key]}"
            break
        fi
    done
    
    if [[ -z "$dest_folder" ]]; then
        echo "WARN: No category mapping for: $rel_path"
        continue
    fi
    
    # Get filename without extension and create slug
    filename=$(basename "$kb_file" .md)
    slug_folder="$DOCS_DIR/$dest_folder"
    output_file="$slug_folder/${filename}.md"
    
    # Create directory if needed
    mkdir -p "$slug_folder"
    
    # Check if file exists (update) or not (add)
    if [[ -f "$output_file" ]]; then
        # Check if KB file has changed
        kb_mtime=$(stat -c %Y "$kb_file" 2>/dev/null || echo 0)
        doc_mtime=$(stat -c %Y "$output_file" 2>/dev/null || echo 0)
        if [[ "$kb_mtime" -gt "$doc_mtime" ]]; then
            convert_kb_to_docusaurus "$kb_file" "$output_file"
            UPDATED=$((UPDATED + 1))
            CHANGES="${CHANGES}  - Updated: ${filename}\n"
        fi
    else
        convert_kb_to_docusaurus "$kb_file" "$output_file"
        ADDED=$((ADDED + 1))
        CHANGES="${CHANGES}  - Added: ${filename}\n"
    fi
done < <(find "$KB_DIR" -name "*.md" ! -name "INDEX.md" -type f)

# Check for removed articles (docs that no longer have KB source)
for doc_file in $(find "$DOCS_DIR" -path "*/ai-ml/*" -o -path "*/cloud-infra/*" -o -path "*/data-databases/*" -o -path "*/devtools/*" -o -path "*/programming/*" -o -path "*/security/*" | grep "\.md$" | sort); do
    # This is a simplified check - in production you'd track file provenance
    :
done

echo "SYNC_RESULT: added=$ADDED updated=$UPDATED removed=$REMOVED"
echo -e "CHANGES:\n$CHANGES"
