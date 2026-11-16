---
title: How to Fix ERR_PNPM_OUTDATED_LOCKFILE in GitHub Actions Without Disabling the
  Check
diataxis: How-to Guide
domain: developer-tools-practices
topic: cicd-patterns
source: DEV.to Tech News
source_url: https://dev.to/kalemi/errpnpmoutdatedlockfile-in-github-actions-dmi
date: 2026-11-15
keywords:
- knowledge-base
- cicd-patterns
- developer-tools-practices
- how-to
---
# How to Fix ERR_PNPM_OUTDATED_LOCKFILE in GitHub Actions Without Disabling the Check

`ERR_PNPM_OUTDATED_LOCKFILE` means pnpm ran a **frozen install**, compared `pnpm-lock.yaml` against every `package.json` it can see, and found a difference it is not allowed to write away. You did not pass a flag to get here: pnpm turns frozen installs **on by itself when it detects CI** (defaults to `true` in CI when a lockfile is present, `false` elsewhere). The same command that updates the lockfile on your laptop refuses to on a runner — that is the intended design: CI installs what was reviewed.

```text
Error: ERR_PNPM_OUTDATED_LOCKFILE
× installing dependencies
╰─▶ Cannot install with "frozen-lockfile" because pnpm-lock.yaml is not up
    to date with package.json.
    Failure reason:
    specifiers in the lockfile don't match specifiers in package.json:
  * in importers["."]:
  * 1 dependency was added: left-pad@1.3.0
```

The **importer path** in the failure reason is the most useful line: `importers["."]` is the root package, `importers["packages/api"]` is that workspace member — the manifest to relock against, not the one you edited.

## Three sibling codes, one refusal to write the lockfile

| Code | Meaning |
| --- | --- |
| `ERR_PNPM_OUTDATED_LOCKFILE` | Dependencies in the lockfile don't match the manifests |
| `ERR_PNPM_FROZEN_LOCKFILE_WITH_OUTDATED_LOCKFILE` | Same refusal, older pnpm wording |
| `ERR_PNPM_LOCKFILE_CONFIG_MISMATCH` | Manifests agree, but an install setting baked into the lockfile (`auto-install-peers`, `node-linker`, hoist patterns) no longer matches your config |

## Causes

1. **Manifest changed, lockfile not regenerated with it** — the ordinary case; the failure reason names the importer and the dependency.
2. **The two pnpm versions disagree.** The lockfile format has its own version and majors write different files from the same manifests. Relock with pnpm 10 while CI runs pnpm 12 → the freshly committed lockfile is out of date on arrival. Corepack resolves whatever it defaults to unless pinned.
3. **A workspace member you did not touch drifted.** A frozen install compares the lockfile against *every* manifest in the workspace — this is the "I changed nothing" report (someone else's merge added a dependency elsewhere).
4. **A lockfile-affecting setting changed** in `.npmrc`/package.json without relocking — or an `.npmrc` exists on the runner but not in the repo (`ERR_PNPM_LOCKFILE_CONFIG_MISMATCH`).

## The fix

```bash
# 1. Pin pnpm where both sides read it (Corepack and pnpm/action-setup honour it)
corepack use pnpm@12.5.1
# 2. Rebuild the lockfile only — writes nothing to node_modules
pnpm install --lockfile-only
# 3. Commit lockfile in the SAME commit as the manifest change
git add package.json pnpm-lock.yaml
git commit -m "chore: relock after adding left-pad"
```

Workflow side — pin via `packageManager`, keep the frozen install:

```yaml
jobs:
  install:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: pnpm/action-setup@v6     # reads packageManager from package.json
      - uses: actions/setup-node@v7
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
```

Workspace drift — read the importer out of the failure, relock from the root:

```bash
pnpm install --lockfile-only
git diff --stat pnpm-lock.yaml
git log --oneline -3 -- packages/api/package.json   # who touched the manifest the error named
```

Config mismatch — commit the setting, then relock so the lockfile records it:

```ini
# .npmrc, committed
auto-install-peers=true
node-linker=isolated
```

## The sibling flags you actually want instead of `--no-frozen-lockfile`

Verified against the pnpm 12 CLI docs:

| Flag | Behaviour |
| --- | --- |
| `--prefer-frozen-lockfile` (`preferFrozenLockfile`) | Use the existing lockfile **without re-resolving**, even when the manifest might have changed — fast path that still refuses to silently write a new lockfile. Inverse: `--no-prefer-frozen-lockfile` always re-resolves against the registry. |
| `--ignore-manifest-check` | Skips the "lockfile up to date with package.json" check under `--frozen-lockfile`. Docs warn: *use it only when you just wrote the lockfile yourself* — a targeted escape hatch, not a blanket CI setting. |
| `--dry-run` | Full resolution, reports what a real install would change, writes nothing. **Exits 0 even when it would update the lockfile** — so it shows you the diff without failing the job. |

Two detection details worth knowing:

- **How pnpm decides "I'm in CI":** the same rules as the [`ci-info`](https://github.com/watson/ci-info) package (any recognized CI env var counts). Set `CI=false` to turn detection off locally — useful when your shell exports `CI` for other tooling and you wonder why a plain `pnpm install` suddenly refuses to relock.
- **`pnpmfile` checksums.** The lockfile records a checksum of `.pnpmfile.cjs`; the check is content-based, so an unchanged pnpmfile passes `--frozen-lockfile` (verified on pnpm 12.5.1). But editing the pnpmfile without relocking reproduces this exact error (pnpm/pnpm#7951) — treat pnpmfile edits as manifest-equivalent changes.

## --no-frozen-lockfile: diagnose, never ship

It makes the job green and the lockfile meaningless: the runner rewrites the lockfile, the runner gets thrown away, and your repository keeps the file that failed. Run it once locally to see what pnpm *would* change, then commit that change instead of disabling the check that found it.

## Prevention

- Pin pnpm with the `packageManager` field so one version writes and reads the lockfile.
- Commit `pnpm-lock.yaml` with every manifest change, in every workspace member.
- Commit the `.npmrc` carrying lockfile-affecting settings; relock when you change one.
- Leave frozen install on in CI — it is the check, not the obstacle.
- Reproduce CI exactly before pushing: `CI=1 pnpm install --frozen-lockfile` locally.

## References

- Original article: [ERR_PNPM_OUTDATED_LOCKFILE in GitHub Actions](https://dev.to/kalemi/errpnpmoutdatedlockfile-in-github-actions-dmi)
- [pnpm: install options, frozen-lockfile and its CI default](https://pnpm.io/cli/install)
- [pnpm/pnpm#7934 — frozen-lockfile drift in CI](https://github.com/pnpm/pnpm/issues/7934)
- [pnpm: the packageManager field and Corepack](https://pnpm.io/installation)
- [pnpm CLI docs: --frozen-lockfile / --prefer-frozen-lockfile / --ignore-manifest-check / --dry-run](https://github.com/pnpm/pnpm.io/blob/main/docs/cli/install.md)
- [watson/ci-info: the CI-detection rules pnpm reuses](https://github.com/watson/ci-info)
- [pnpm/pnpm#7951 — pnpmfileChecksum and frozen installs (content-based checksum, verified pnpm 12.5.1)](https://github.com/pnpm/pnpm/issues/7951)
- [GitHub Actions: dependency caching with actions/setup-node](https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching)
