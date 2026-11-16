#!/usr/bin/env bash
# kb-publish.sh — atomic publish gate for KB enricher crons.
# Usage: kb-publish.sh "<commit description>" [expected-note-basename.md ...]
# Steps: kb-sync (correct interpreter) -> commit -> push -> ASSERT.
# Exit 0 + "PUBLISH OK" only if every assertion passes; exit 1 + "PUBLISH FAIL" otherwise.
set -u
KB=~/code/kb
DESC="${1:-publish: kb-sync enrichment run}"
shift || true
EXPECTED=("$@")

fail() { echo "PUBLISH FAIL: $*"; exit 1; }

cd "$KB" || fail "cannot cd $KB"

# 1. Sync vault -> docs (ONLY the interpreter that has pyyaml)
/usr/bin/python3 scripts/kb-sync.py > /tmp/kb-publish-sync.out 2>&1 || fail "kb-sync.py exited nonzero (see /tmp/kb-publish-sync.out)"
tail -3 /tmp/kb-publish-sync.out

# 2. Commit (if anything changed)
git add docs sidebars.js
if ! git diff --cached --quiet; then
  git commit -m "$DESC" > /tmp/kb-publish-commit.out 2>&1 || fail "git commit failed"
  echo "committed: $(git log --oneline -1)"
else
  echo "nothing to commit (docs already in sync)"
fi

# 3. Push
git push origin master 2>&1 | tail -3

# 4. Assertions
[ -z "$(git status --porcelain -- docs sidebars.js)" ] || fail "docs/sidebars not clean after publish:
$(git status --porcelain -- docs sidebars.js | head -10)"
[ -z "$(git log origin/master..master --oneline)" ] || fail "unpushed commits remain:
$(git log origin/master..master --oneline)"
for f in "${EXPECTED[@]}"; do
  found=$(find docs -name "$f" | head -1)
  [ -n "$found" ] || fail "expected note '$f' not found under docs/ — vault note missing or visibility wrong"
done
echo "PUBLISH OK — $(find docs -name '*.md' | wc -l) docs, tree clean, origin/master == master${EXPECTED:+, ${#EXPECTED[@]} expected note(s) present}"
