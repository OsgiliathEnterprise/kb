#!/usr/bin/env python3
"""Fix YAML frontmatter quoting issues in docs/kb/ files."""
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
        
        # Extract frontmatter
        m = re.match(r'^---\s*\n(.*?)\n---\s*\n', content, re.DOTALL)
        if not m:
            continue
        
        fm_text = m.group(1)
        body = content[m.end():]
        
        # Parse existing frontmatter
        lines = fm_text.strip().split('\n')
        new_lines = []
        needs_fix = False
        
        i = 0
        while i < len(lines):
            line = lines[i]
            # Check for key: value pattern
            kv_match = re.match(r'^(\w[\w-]*):\s*(.*)', line)
            if kv_match:
                key = kv_match.group(1)
                value = kv_match.group(2)
                
                # Check if value has problematic quotes
                has_dq = '"' in value
                has_sq = "'" in value
                
                # Remove existing quotes from value
                if value.startswith('"') and value.endswith('"'):
                    value = value[1:-1]
                    has_dq = '"' in value
                    has_sq = "'" in value
                elif value.startswith("'") and value.endswith("'"):
                    value = value[1:-1]
                    has_dq = '"' in value
                    has_sq = "'" in value
                
                # Choose quoting strategy
                if has_dq and has_sq:
                    # Both quotes present - use double quotes, escape internal double quotes
                    value = value.replace('"', '\\"')
                    new_lines.append('%s: "%s"' % (key, value))
                    needs_fix = True
                elif has_dq:
                    # Has double quotes - use single quotes
                    value = value.replace("'", "''")
                    new_lines.append("%s: '%s'" % (key, value))
                    needs_fix = True
                elif has_sq:
                    # Has single quotes - use double quotes
                    new_lines.append('%s: "%s"' % (key, value))
                    needs_fix = True
                elif any(c in value for c in [':', '#', '[', ']', '{', '}', ',', '&', '*', '?', '|', '-', '<', '>', '=', '!', '%', '@', '`']):
                    new_lines.append('%s: "%s"' % (key, value))
                elif value.startswith(('http://', 'https://')):
                    new_lines.append('%s: "%s"' % (key, value))
                else:
                    new_lines.append('%s: %s' % (key, value))
            else:
                # List item or other line
                new_lines.append(line)
            i += 1
        
        if needs_fix:
            new_fm = '---\n' + '\n'.join(new_lines) + '\n---\n'
            new_content = new_fm + body
            with open(fpath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            fixed_count += 1
            print('Fixed: %s' % fpath)

print('\nTotal fixed: %d' % fixed_count)
