#!/usr/bin/env bash
# kb-publish.sh — atomic publish gate for KB enricher crons.
# Usage: kb-publish.sh "<commit description>" [expected-note-basename.md ...]
# Steps: kb-sync (correct interpreter) -> commit -> push -> ASSERT.
# Exit 0 + "PUBLISH OK" only if every assertion passes; exit 1 + "PUBLISH FAIL" otherwise.
#
# RETIRED 2026-11-28: KB publication is owned EXCLUSIVELY by the content_publisher
# profile (cron job f3e969f334b4, daily 18:00, via scripts/kb-sync.py + scripts/publish.sh).
# Writer/enricher profiles (arxiv_enricher, knowledge, newssummarizer, kb_zookeeper,
# ebook_kb_enricher) write ONLY the vault and must never commit or push ~/code/kb.
# This script fails closed for every caller; the only escape hatch is the explicit
# KB_PUBLISH_ALLOW=1 env var, reserved for supervised human maintenance
# (see the kb-publisher-triage skill).
if [ "${KB_PUBLISH_ALLOW:-0}" != "1" ]; then
  echo "PUBLISH DENIED: KB publication is owned exclusively by the content_publisher profile (job f3e969f334b4, daily 18:00)."
  echo "If you are an agent profile: writing to /home/tcharlopenclaw/code/kb (kb-sync, git add/commit/push/tag) is FORBIDDEN."
  echo "Notes live in the vault (/home/tcharlopenclaw/Documents/LearningNotes/KB) with visibility: public and reach the site"
  echo "on the next publisher run. Report 'N public notes await next publisher run' instead of publishing."
  echo "Supervised human override: rerun with KB_PUBLISH_ALLOW=1 (see the kb-publisher-triage skill)."
  exit 1
fi
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
