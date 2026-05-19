#!/usr/bin/env bash
# =============================================================================
# Osgiliath KB Publisher
# =============================================================================
# Daily publishing script for the Osgiliath Enterprise Knowledge Base.
#
# Scenarios:
#   1) gh-pages doesn't exist -> build site, push to gh-pages, tag source
#   2) gh-pages exists       -> compare content, create PR branch if changed
#   3) PR open > 3 days      -> force-merge into gh-pages and publish
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
  git_run pull "$REMOTE" "$SOURCE_BRANCH"
  log "HEAD = $(git_run rev-parse --short HEAD) ($SOURCE_BRANCH)"
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

# ── Scenario 2: gh-pages exists — compare & create PR ─────────────────────────
update_ghpages() {
  log "gh-pages exists — comparing content..."

  cd "$REPO_DIR"

  # Get hash of current gh-pages index.html
  local remote_hash
  remote_hash="$(git_run ls-tree "$REMOTE/$TARGET_BRANCH" -- index.html | awk '{print $3}' || echo '')"

  # Get hash of newly built index.html
  local local_hash
  local_hash="$(git_run hash-object "$REPO_DIR/build/index.html" 2>/dev/null || echo 'new-build')"

  if [ "$remote_hash" = "$local_hash" ]; then
    log "Content unchanged — nothing to publish"
    return 0
  fi

  log "Content changed (remote=$remote_hash local=$local_hash) — creating PR"

  # Create PR branch
  local pr_branch="${PR_PREFIX}-${DATE_STAMP}"

  # Remove old PR branches (keep repo clean)
  for old in $(git_run for-each-ref --format='%(refname:short)' refs/heads/"$PR_PREFIX-"* 2>/dev/null); do
    git_run branch -D "$old" 2>/dev/null || true
    git_run push "$REMOTE" --delete "$old" 2>/dev/null || true
  done

  # Create new PR branch from source, inject build output
  git_run checkout -b "$pr_branch" "$SOURCE_BRANCH"
  cp -r "$REPO_DIR/build/"* "$REPO_DIR/"
  git add -A
  git diff --cached --quiet || \
    git commit -m "publish: KB website update ($DATE_STAMP)"

  git_run push "$REMOTE" "$pr_branch"

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
    gh pr create \
      --base "$TARGET_BRANCH" \
      --head "$head_branch" \
      --title "$pr_title" \
      --body "$pr_body" \
      --repo "$(git_run remote get-url "$REMOTE" | sed 's|.*:||;s|\.git$||')" \
      2>/dev/null || log "gh pr create skipped (may already exist)"
  else
    log "gh CLI not authenticated — PR branch pushed, manual review needed"
  fi
}

# ── Scenario 3: Stale PR detection & force-merge ──────────────────────────────
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
      force_merge "$branch"
      stale_found=true
    else
      log "  $branch — ${age_days} days old (ok)"
    fi
  done

  if [ "$stale_found" = false ]; then
    log "No stale PRs found"
  fi
}

# ── Force-merge a stale branch into gh-pages ──────────────────────────────────
force_merge() {
  local branch="$1"

  log "Force-merging $branch → $TARGET_BRANCH"

  cd "$REPO_DIR"

  # Use worktree for gh-pages
  git_run worktree remove "$REPO_DIR/.gh-pages-wt" --force 2>/dev/null || true
  rm -rf "$REPO_DIR/.gh-pages-wt"

  if git_run ls-remote --heads "$REMOTE" "refs/heads/$TARGET_BRANCH" | grep -q .; then
    git_run worktree add "$REPO_DIR/.gh-pages-wt" "$REMOTE/$TARGET_BRANCH"
  else
    git_run worktree add "$REPO_DIR/.gh-pages-wt" --detach --force
  fi

  cd "$REPO_DIR/.gh-pages-wt"
  git_run merge "$REMOTE/$branch" --no-edit --no-ff 2>/dev/null || \
  git_run merge "$REMOTE/$branch" --no-edit 2>/dev/null || true

  git add -A
  git diff --cached --quiet || \
    git commit -m "publish: auto-merge $branch (stale > ${PR_MAX_AGE_DAYS}d)"

  git push "$REMOTE" HEAD:"refs/heads/$TARGET_BRANCH" --force

  # Tag
  local tag_name="${TAG_PREFIX}-merged-${DATE_STAMP}"
  local sha
  sha="$(git_run rev-parse HEAD)"
  git_run tag -a "$tag_name" -m "Auto-merged $branch — $sha" "$sha"
  git_run push "$REMOTE" "$tag_name"

  # Delete stale branch
  git_run push "$REMOTE" --delete "$branch" 2>/dev/null || true
  git_run branch -D "$branch" 2>/dev/null || true

  # Cleanup
  cd "$REPO_DIR"
  git_run worktree remove "$REPO_DIR/.gh-pages-wt" --force 2>/dev/null || true

  log "Force-merged $branch → $TARGET_BRANCH, tagged $tag_name"
}

# ── Main ──────────────────────────────────────────────────────────────────────
main() {
  preflight
  build_site

  # Check if gh-pages exists on remote
  if git_run ls-remote --heads "$REMOTE" "refs/heads/$TARGET_BRANCH" | grep -q .; then
    update_ghpages
    check_stale_prs
  else
    create_ghpages
  fi

  log "Publish cycle complete"
  log "================================================================="
}

main "$@"
