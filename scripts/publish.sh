#!/usr/bin/env bash
# =============================================================================
# Osgiliath KB Publisher
# =============================================================================
# Daily publishing script for the Osgiliath Enterprise Knowledge Base.
#
# Scenarios:
#   1) gh-pages doesn't exist -> build site, push to gh-pages, tag source
#   2) gh-pages exists       -> compare content, create PR branch if changed
#      (skipped entirely when gh-pages already carries a CI deploy of the
#       current master HEAD — the CI - Build and Deploy workflow owns gh-pages
#       on every master push; republishing the same source only spawns PRs
#       that CI's next force-push turns CONFLICTING — 2026-11 pileup)
#   3) PR open > 3 days      -> force-merge into gh-pages and publish;
#      if it conflicts AND gh-pages is already deployed from current master
#      HEAD, the branch is superseded: close its PR and delete it
#
# Uses SSH deploy key from ~/.ssh/id_ed25519_kb (github-kb host alias)
# =============================================================================
set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────
REPO_DIR="${KB_REPO_DIR:-$HOME/code/kb}"
REMOTE="${KB_REMOTE:-upstream}"
SOURCE_BRANCH="${KB_SOURCE_BRANCH:-master}"
TARGET_BRANCH="gh-pages"
PR_PREFIX="publish/auto"
TAG_PREFIX="publish"
PR_MAX_AGE_DAYS=3
LOG_FILE="${REPO_DIR}/.hermes/publisher.log"

# Google Search Console verification meta tag (public token, already embedded
# in the live site). Without it, every build differs from the deployed site by
# exactly this meta tag + JS hash rotation -> false "content changed".
export GOOGLE_SEARCH_CONSOLE_META_KEY="${GOOGLE_SEARCH_CONSOLE_META_KEY:-xxySnOb78T9sc1drISeu6ym2kIXEB9__sDKBXxSAfHA}"
DATE_STAMP="$(date -u '+%Y%m%d-%H%M%S')"
DATE_HUMAN="$(date -u '+%Y-%m-%d %H:%M:%S UTC')"

# ── Helpers ───────────────────────────────────────────────────────────────────
log()  { printf '[%s] %s\n' "$DATE_HUMAN" "$*" | tee -a "$LOG_FILE"; }
err()  { log "ERROR: $*" >&2; }
die()  { err "$*"; exit 1; }

git_run() {
  # Run git command, suppress auth warnings
  git -C "$REPO_DIR" "$@" 2>&1 | grep -v 'Hi AI!' | grep -v '^$' || true
}

# ── Pre-flight ────────────────────────────────────────────────────────────────
preflight() {
  mkdir -p "$(dirname "$LOG_FILE")"
  log "================================================================="
  log "Osgiliath KB Publisher — $DATE_HUMAN"
  log "================================================================="

  if [ ! -d "$REPO_DIR/.git" ]; then
    die "Not a git repo: $REPO_DIR"
  fi

  # Ensure we're on source branch
  cd "$REPO_DIR"
  git_run fetch "$REMOTE"
  git_run checkout "$SOURCE_BRANCH"
  # Verify the checkout actually happened. git_run swallows errors (|| true),
  # and publishing from the wrong branch is worse than failing: on 2026-10-26
  # the repo was left on a stale PR branch with a conflicting dirty tree, the
  # checkout silently failed, and the whole cycle ran (and committed) on the
  # old branch.
  local current
  current="$(git -C "$REPO_DIR" branch --show-current)"
  if [ "$current" != "$SOURCE_BRANCH" ]; then
    die "Not on $SOURCE_BRANCH (on '$current') — checkout likely failed (dirty/conflicting working tree?). Commit or stash pending changes, then re-run."
  fi
  git_run pull "$REMOTE" "$SOURCE_BRANCH"
  log "HEAD = $(git_run rev-parse --short HEAD) ($SOURCE_BRANCH)"
}

# ── Pick a python interpreter that has PyYAML (needed by visibility-gate.py) ──
# The agent environment may put a bundled python3 first in PATH that lacks yaml;
# fall back to /usr/bin/python3 (system package python3-pyyaml).
pick_python() {
  local p
  for p in python3 /usr/bin/python3; do
    if command -v "$p" >/dev/null 2>&1 && "$p" -c "import yaml" >/dev/null 2>&1; then
      printf '%s' "$p"
      return 0
    fi
  done
  die "No python with PyYAML found — install python3-pyyaml (dnf) or pip install pyyaml"
}

# ── Visibility gate: reject private content in docs/ ──────────────────────────
visibility_gate() {
  log "Running visibility gate (checking docs/ for private content)..."
  cd "$REPO_DIR"

  local python_bin
  python_bin="$(pick_python)"
  log "Using $python_bin for visibility gate"

  # NOTE: `|| gate_exit=$?` is required — under set -e a failing command
  # substitution in an assignment aborts the script BEFORE the error handler
  # below runs (silent death, no ERROR line in the log).
  local gate_output gate_exit=0
  gate_output="$("$python_bin" "$REPO_DIR/scripts/visibility-gate.py" 2>&1)" || gate_exit=$?

  if [ $gate_exit -ne 0 ]; then
    err "VISIBILITY GATE FAILED"
    echo "$gate_output" | while IFS= read -r line; do
      err "  $line"
    done
    err "Aborting publish — private content would leak to the website."
    err "Fix: run kb-sync.py to filter private content, then retry"
    exit 1
  fi

  log "Visibility gate passed — no private content in docs/"
}

# ── MDX precheck: fix angle-bracket URLs that break MDX/JSX parser ─────────────
# Implemented in scripts/mdx_precheck.py (code-context aware: fences and inline
# code are left alone — the old sed fixed `<0.12.0` inside code fences too,
# which double-escaped to `&amp;lt;` and made the publisher build differ from
# the CI build of the same commit -> daily spurious "content changed" PRs).
# The edits live in the master worktree only for the duration of the build; an
# EXIT trap reverts exactly the files we touched (and only while unchanged).
MDX_STATE=""
MDX_PY=""

mdx_precheck() {
  log "Running MDX precheck (fixing angle-bracket URLs and <number patterns outside code)..."
  cd "$REPO_DIR"
  MDX_PY="$(pick_python)"
  MDX_STATE="$REPO_DIR/.hermes/mdx_precheck_state.json"
  mkdir -p "$REPO_DIR/.hermes"
  local fixed
  fixed="$("$MDX_PY" "$REPO_DIR/scripts/mdx_precheck.py" fix docs "$MDX_STATE")" \
    || die "mdx_precheck.py failed"
  log "MDX precheck complete — $fixed files changed"
}

revert_mdx_precheck() {
  [ -n "$MDX_STATE" ] && [ -f "$MDX_STATE" ] || return 0
  "$MDX_PY" "$REPO_DIR/scripts/mdx_precheck.py" revert "$MDX_STATE" --repo "$REPO_DIR" >/dev/null || \
    log "WARNING: mdx_precheck revert had issues — check 'git status' in $REPO_DIR"
}

# ── Build ─────────────────────────────────────────────────────────────────────
build_site() {
  log "Building site..."
  cd "$REPO_DIR"
  npm ci --ignore-scripts --prefer-offline 2>&1 | tail -2 || \
  npm install --ignore-scripts 2>&1 | tail -2
  npm run build 2>&1 | tail -3
  [ -d "$REPO_DIR/build" ] || die "Build failed — no build/ directory"
  local count
  count="$(find "$REPO_DIR/build" -type f | wc -l)"
  log "Built $count files"
}

# ── Scenario 1: gh-pages doesn't exist ────────────────────────────────────────
create_ghpages() {
  log "gh-pages does not exist — creating it..."

  cd "$REPO_DIR"

  # Create orphan branch for gh-pages
  git_run worktree remove "$REPO_DIR/.gh-pages-wt" --force 2>/dev/null || true
  rm -rf "$REPO_DIR/.gh-pages-wt"
  git_run worktree add "$REPO_DIR/.gh-pages-wt" --detach --force

  cd "$REPO_DIR/.gh-pages-wt"
  git rm -rf . 2>/dev/null || true
  cp -r "$REPO_DIR/build/"* .
  touch .nojekyll

  git add -A
  git commit -m "publish: initial KB website ($DATE_STAMP)" || true
  git push "$REMOTE" HEAD:"refs/heads/$TARGET_BRANCH" --force

  # Clean up
  cd "$REPO_DIR"
  git_run worktree remove "$REPO_DIR/.gh-pages-wt" --force 2>/dev/null || true

  # Tag the source commit
  local tag_name="${TAG_PREFIX}-${DATE_STAMP}"
  local sha
  sha="$(git_run rev-parse HEAD)"
  git_run tag -a "$tag_name" -m "KB publish $tag_name — source $sha" "$sha"
  git_run push "$REMOTE" "$tag_name"
  log "Created gh-pages + tagged $tag_name (source: $sha)"
}

# ── Which source commit does the live gh-pages tree come from? ───────────────
# The CI deploy workflow (peaceiris/actions-gh-pages) appends the full source
# SHA to the gh-pages commit subject: "deploy: KB website update <40-hex>".
# Empty output means gh-pages was not produced by CI (e.g. scenario-1 push or
# a force-merge) — callers must fall back to the conservative path.
ghpages_deployed_sha() {
  git -C "$REPO_DIR" log -1 --format='%s' "$REMOTE/$TARGET_BRANCH" 2>/dev/null \
    | grep -oE '\b[0-9a-f]{40}\b' | head -1 || true
}

site_is_current() {
  # true when gh-pages already serves a CI deploy of the current master HEAD
  local deployed
  deployed="$(ghpages_deployed_sha)"
  [ -n "$deployed" ] && [ "$deployed" = "$(git -C "$REPO_DIR" rev-parse HEAD)" ]
}

# ── Scenario 2: gh-pages exists — compare & create PR ─────────────────────────
# Asset bundle filenames (main.<hash>.js) rotate between builds even when the
# source is identical, so raw file hashes always differ. We fingerprint the
# *normalized* content of every non-asset file instead: strip 8-hex asset hash
# names from each file, hash it, and combine per-file hashes into one digest.
norm_content() { sed -E 's/[a-f0-9]{8}\.(js|css)/HASH.\1/g'; }

fingerprint_remote() {
  local f h
  for f in $(git ls-tree -r --name-only "$REMOTE/$TARGET_BRANCH" | grep -v '^assets/' || true); do
    h="$(git show "$REMOTE/$TARGET_BRANCH:$f" 2>/dev/null | norm_content | git hash-object --stdin)"
    printf '%s %s\n' "$h" "$f"
  done | sort -k2 | git hash-object --stdin
}

fingerprint_local() {
  local f h
  for f in $(find build -type f ! -path 'build/assets/*' | sed 's|^build/||' || true); do
    h="$(norm_content < "build/$f" | git hash-object --stdin)"
    printf '%s %s\n' "$h" "$f"
  done | sort -k2 | git hash-object --stdin
}

update_ghpages() {
  log "gh-pages exists — comparing content..."

  cd "$REPO_DIR"

  local remote_fp local_fp
  remote_fp="$(fingerprint_remote)"
  local_fp="$(fingerprint_local)"

  if [ "$remote_fp" = "$local_fp" ]; then
    log "Content unchanged (normalized fingerprint $remote_fp) — nothing to publish"
    return 0
  fi

  log "Content changed (remote=$remote_fp local=$local_fp) — creating PR"

  # Create PR branch
  local pr_branch="${PR_PREFIX}-${DATE_STAMP}"

  # Remove old PR branches (keep repo clean)
  for old in $(git_run for-each-ref --format='%(refname:short)' refs/heads/"$PR_PREFIX-"* 2>/dev/null); do
    git_run branch -D "$old" 2>/dev/null || true
    git_run push "$REMOTE" --delete "$old" 2>/dev/null || true
  done

  # Create new site-only PR branch from the current gh-pages tip, with the
  # build output replacing its content.
  # BUGFIX (2026-10-27): the previous approach (branch from $SOURCE_BRANCH,
  # copy build/ into the repo root, `git add -A`) produced SOURCE-ONLY
  # branches: .gitignore excludes the site files at the repo root
  # (index.html, assets/, */**.html, search/, sitemap.xml, ...), so
  # `git add -A` silently skipped every built file and only source fixes
  # were committed. A branch like that, merged into gh-pages, would add the
  # entire source tree to the site branch and never actually update the
  # deployed site. A site-only branch based on the gh-pages tip:
  #   - merges cleanly into gh-pages (no add/add conflicts — scenario 3),
  #   - never pollutes the site branch with source files,
  #   - keeps the main repo on $SOURCE_BRANCH (worktree), avoiding the
  #     2026-10-26 "left on a stale PR branch" failure mode.
  # The worktree checks out the gh-pages tip, which tracks no .gitignore, so
  # plain `git add -A` stages the full build output.
  local wt_dir="$REPO_DIR/.pr-wt"
  git -C "$REPO_DIR" worktree remove "$wt_dir" --force 2>/dev/null || true
  rm -rf "$wt_dir"
  git -C "$REPO_DIR" worktree add "$wt_dir" "$REMOTE/$TARGET_BRANCH" >/dev/null || \
    die "Could not create worktree at $REMOTE/$TARGET_BRANCH"
  cd "$wt_dir" || { err "Cannot enter $wt_dir"; return 1; }

  git rm -rf --quiet . 2>/dev/null || true
  cp -r "$REPO_DIR/build/"* .
  touch .nojekyll
  git add -A
  git diff --cached --quiet || \
    git commit -m "publish: KB website update ($DATE_STAMP)"

  git push "$REMOTE" "HEAD:refs/heads/$pr_branch"

  # Cleanup
  cd "$REPO_DIR"
  git -C "$REPO_DIR" worktree remove "$wt_dir" --force 2>/dev/null || true
  rm -rf "$wt_dir"

  # Create PR via GitHub API (using SSH key's associated account)
  create_pr "$pr_branch"

  log "PR branch $pr_branch pushed"
}

# ── Create PR via GitHub API ──────────────────────────────────────────────────
create_pr() {
  local head_branch="$1"
  local pr_title="Publish KB website — $DATE_STAMP"
  local pr_body="Automated publish of the Osgiliath Knowledge Base.

**Source:** \`$SOURCE_BRANCH\`
**Built:** $DATE_HUMAN

This PR was created by the daily publisher cron job."

  # Use gh CLI if available, otherwise curl with SSH-derived token
  if command -v gh &>/dev/null && gh auth status &>/dev/null; then
    local repo_slug
    repo_slug="$(git_run remote get-url "$REMOTE" | sed -E 's#^(https?://|git@)[^/:]+[:/]##; s#\.git$##')"
    # NOTE: no `2>/dev/null` — a failed PR creation must be visible in the log.
    if ! gh pr create \
      --base "$TARGET_BRANCH" \
      --head "$head_branch" \
      --title "$pr_title" \
      --body "$pr_body" \
      --repo "$repo_slug"; then
      err "gh pr create FAILED for $head_branch (branch pushed, no PR created)"
    fi
  else
    log "gh CLI not authenticated — PR branch pushed, manual review needed"
  fi
}

# ── Scenario 3: Stale PR detection & force-merge ──────────────────────────────
close_stale_pr() {
  # Best-effort PR closure for a superseded publish branch (gh auth via the
  # same account create_pr uses). Failure to close must not fail the run —
  # the branch deletion is what keeps the repo clean.
  local branch="$1"
  command -v gh >/dev/null 2>&1 || { log "gh CLI not available — close PR for $branch manually"; return 0; }
  gh auth status >/dev/null 2>&1 || { log "gh CLI not authenticated — close PR for $branch manually"; return 0; }
  local slug num head_sha
  slug="$(git_run remote get-url "$REMOTE" | sed -E 's#^(https?://|git@)[^/:]+[:/]##; s#\.git$##')"
  head_sha="$(git -C "$REPO_DIR" rev-parse --short HEAD)"
  num="$(gh pr list --repo "$slug" --state open --head "$branch" --json number --jq '.[0].number' 2>/dev/null || true)"
  if [ -n "$num" ] && [ "$num" != "null" ]; then
    if ! gh pr close "$num" --repo "$slug" \
      --comment "Superseded: gh-pages already serves a CI 'Build and Deploy' of current master (\`$head_sha\`). This publish branch predates that deploy and adds no content missing from gh-pages; its conflict is caused by CI's force-push. Auto-closed without merge by scripts/publish.sh."; then
      log "WARNING: could not close PR #$num for $branch — do it manually"
    fi
  fi
}

check_stale_prs() {
  log "Checking for stale PR branches (> ${PR_MAX_AGE_DAYS} days)..."

  cd "$REPO_DIR"
  git_run fetch "$REMOTE" --prune

  local now
  now="$(date +%s)"
  local stale_found=false

  for ref in $(git_run for-each-ref --format='%(refname:short)' refs/remotes/"$REMOTE"/"$PR_PREFIX-"* 2>/dev/null); do
    local branch
    branch="${ref#$REMOTE/}"

    local commit_date
    commit_date="$(git_run log -1 --format='%ct' "$ref" 2>/dev/null || echo '0')"

    local age_days=$(( (now - commit_date) / 86400 ))

    if [ "$age_days" -ge "$PR_MAX_AGE_DAYS" ]; then
      log "STALE: $branch is ${age_days} days old — force-merging"
      # Guarded: one unmergeable branch must not abort the whole run under
      # set -e (the Nov-8 run died here before branch/PR hygiene).
      if ! force_merge "$branch"; then
        log "force_merge of $branch failed — branch kept, continuing with the rest"
      fi
      stale_found=true
    else
      log "  $branch — ${age_days} days old (ok)"
    fi
  done

  if [ "$stale_found" = false ]; then
    log "No stale PRs found"
  fi
}

# ── Force-publish a stale branch onto gh-pages ───────────────────────────────
# HISTORY:
#  2026-10-09: git commands must run with real cwd (worktree), not git_run.
#  2026-10-31: tag derived from the branch stamp, tolerate pre-existing tag.
#  2026-11-10: `git merge` replaced by commit-tree. The CI workflow deploys
#    gh-pages with peaceiris force_orphan:true — every deploy is an ORPHAN
#    commit, so a publish branch and the current gh-pages tip share no
#    history: `git merge` sees unrelated histories and can never merge
#    cleanly (it always aborts as "conflict"), which turned scenario 3 into a
#    permanent no-op and piled up CONFLICTING PRs for days. gh-pages is a
#    *generated* tree anyway, so the only sane merge is "the newest complete
#    build wins": graft the branch's whole tree onto the current gh-pages tip
#    via commit-tree (GitHub then closes the PR as MERGED automatically).
#    If gh-pages already serves a CI deploy of current master HEAD, the
#    branch is by definition superseded (it was built from an older master
#    commit) — close its PR and delete it instead (2026-11-08..10 failure).
force_merge() {
  local branch="$1"

  log "Force-publishing $branch → $TARGET_BRANCH"

  # Check for supersession BEFORE touching anything.
  if site_is_current; then
    log "$branch superseded: gh-pages already deployed from master HEAD ($(git -C "$REPO_DIR" rev-parse --short HEAD)) — closing PR, deleting branch"
    close_stale_pr "$branch"
    git push "$REMOTE" --delete "$branch" 2>/dev/null || true
    git -C "$REPO_DIR" branch -D "$branch" 2>/dev/null || true
    return 0
  fi

  # Graft the branch's complete site tree onto the current gh-pages tip.
  local tree new_commit
  tree="$(git -C "$REPO_DIR" rev-parse "$REMOTE/$branch^{tree}" 2>/dev/null)" || {
    err "Cannot resolve tree of $REMOTE/$branch"
    return 1
  }
  new_commit="$(git -C "$REPO_DIR" commit-tree "$tree" \
    -p "$REMOTE/$TARGET_BRANCH" -p "$REMOTE/$branch" \
    -m "publish: auto-merge $branch (stale > ${PR_MAX_AGE_DAYS}d)")" || {
    err "commit-tree failed for $branch"
    return 1
  }

  if ! git push "$REMOTE" "$new_commit:refs/heads/$TARGET_BRANCH"; then
    err "Push of auto-merge commit to $TARGET_BRANCH failed — $branch kept for investigation"
    return 1
  fi

  # Tag the published commit so the old build stays reachable.
  local branch_stem="${branch#"$PR_PREFIX-"}"
  local tag_name="${TAG_PREFIX}-merged-${branch_stem}"
  git -C "$REPO_DIR" tag -a "$tag_name" -m "Auto-merged $branch — $new_commit" "$new_commit" || \
    log "WARNING: tag $tag_name already exists — skipping tag creation"
  git -C "$REPO_DIR" push "$REMOTE" "$tag_name" 2>/dev/null || \
    log "WARNING: could not push tag $tag_name (already exists?)"

  # Delete stale branch (only after a successful publish)
  git push "$REMOTE" --delete "$branch" 2>/dev/null || true
  git -C "$REPO_DIR" branch -D "$branch" 2>/dev/null || true

  log "Force-published $branch → $TARGET_BRANCH (commit $new_commit), tagged $tag_name"
}

# ── Main ──────────────────────────────────────────────────────────────────────
main() {
  preflight

  # Safety gate: abort if private content leaked into docs/
  visibility_gate

  # Check if gh-pages exists on remote
  if git_run ls-remote --heads "$REMOTE" "$TARGET_BRANCH" | grep -q .; then
    # CI (CI - Build and Deploy on every master push) owns gh-pages and embeds
    # the deployed source SHA in its commit subject. When gh-pages already
    # serves master HEAD, a republish is pure noise: the build can never be
    # byte-identical to CI's (bundle hash rotation), so the fingerprint check
    # false-positives and every run spawns a PR that CI's next force-push
    # turns CONFLICTING. Skip build + PR entirely (2026-11: 3 stuck PRs).
    if site_is_current; then
      log "gh-pages already deployed from master HEAD ($(git -C "$REPO_DIR" rev-parse --short HEAD)) — nothing to publish"
    else
      # Fix MDX-incompatible patterns before building (reverted on exit)
      mdx_precheck
      trap revert_mdx_precheck EXIT
      build_site
      update_ghpages
    fi
    check_stale_prs
  else
    # Fix MDX-incompatible patterns before building (reverted on exit)
    mdx_precheck
    trap revert_mdx_precheck EXIT
    build_site
    create_ghpages
  fi

  # Hygiene: leave the repo on the source branch. update_ghpages ends on the
  # PR branch; the next run that starts there with a conflicting dirty tree
  # fails its preflight checkout (now fatal, see preflight above) or, before
  # that fix, misfired the entire cycle on the stale branch (2026-10-26).
  git -C "$REPO_DIR" checkout "$SOURCE_BRANCH" >/dev/null 2>&1 || \
    log "WARNING: could not return to $SOURCE_BRANCH (dirty/conflicting tree?)"
  local final_branch
  final_branch="$(git -C "$REPO_DIR" branch --show-current)"
  if [ "$final_branch" != "$SOURCE_BRANCH" ]; then
    log "WARNING: repo left on '$final_branch' instead of $SOURCE_BRANCH — next run may abort in preflight until resolved"
  fi

  log "Publish cycle complete"
  log "================================================================="
}

main "$@"
