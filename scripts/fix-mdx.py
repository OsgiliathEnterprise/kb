#!/usr/bin/env python3
"""Fix MDX issues in docs/kb/ files - escape bare < characters that break MDX parsing."""
import os, re

docs_dir = '/home/tcharlopenclaw/code/kb/docs/kb/'
fixed_count = 0

for root, dirs, files in os.walk(docs_dir):
    for fname in files:
        if not fname.endswith('.md'):
            continue
        fpath = os.path.join(root, fname)
        with open(fpath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Split into lines for processing
        lines = content.split('\n')
        new_lines = []
        in_code_block = False
        in_frontmatter = False
        fm_lines = 0
        
        for line in lines:
            # Track frontmatter
            if fm_lines == 0 and line.strip() == '---':
                in_frontmatter = True
                fm_lines = 1
                new_lines.append(line)
                continue
            elif in_frontmatter:
                if line.strip() == '---':
                    in_frontmatter = False
                    fm_lines = 0
                new_lines.append(line)
                continue
            
            # Track code blocks
            if line.strip().startswith('```'):
                in_code_block = not in_code_block
                new_lines.append(line)
                continue
            
            if in_code_block:
                new_lines.append(line)
                continue
            
            # Fix bare < that aren't HTML tags
            # Pattern: < followed by non-letter, non-!, non-/, non-?
            # This catches <1s, <=, <<, <?, etc.
            fixed = re.sub(r'(?<!&lt;)(?<!")<(?![a-zA-Z!/?])', '&lt;', line)
            
            if fixed != line:
                fixed_count += 1
                print('Fixed %s: %s' % (fpath, line.strip()[:80]))
            
            new_lines.append(fixed)
        
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write('\n'.join(new_lines))

print('\nTotal fixes: %d' % fixed_count)
