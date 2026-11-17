---
title: Update Playwright Screenshot Baselines Safely on Unstable Pages
diataxis: How-to Guide
domain: developer-tools-practices
topic: cicd-patterns
source: DEV.to Tech News
source_url: https://dev.to/garyparker/playwright-update-snapshots-overwrote-a-good-baseline-and-passed-226-of-226-runs-2h3m
date: '2026-11-17'
keywords:
- knowledge-base
- cicd-patterns
- developer-tools-practices
- how-to
---
# Update Playwright Screenshot Baselines Safely on Unstable Pages

## The bug (Playwright issue #44128, opened 2026-11-15)
On a page that **never becomes stable** (JS animation via `requestAnimationFrame`, live clock updated every 20 ms), `npx playwright test --update-snapshots=changed|all` can replace a good baseline with a random animation frame **and exit 0**. Measured in a PoC across versions 1.40.0 → 1.65.1:
- `changed` / `all`: **226 of 226 runs passed and 226 baselines were overwritten**; the next normal CI run then failed every time (226/226) against the corrupted baseline.
- `none` / `missing`: 0 overwrites, 0 false passes — without the update flag the same pages fail correctly ("Failed to take two consecutive stable screenshots" from 1.49.1; "Screenshot comparison failed" on 1.40/1.45).
- Masking the moving element did **not** stop it for the JS animation; **masking its container did**.
- A fix PR ("fix(screenshots): preserve baselines when capture is unstable") is in flight upstream — until it lands, treat `--update-snapshots` output on animating pages as untrusted.

## Why it matters for CI
A popular 2024-era pattern is a scheduled CI job running `--update-snapshots` and opening a PR with the new PNGs. On unstable pages that job silently launders a random frame into the baseline *while reporting success*, training the team to trust broken suites.

## Safe baseline-update procedure
1. **Prefer `missing` mode.** From 1.50 the flag takes a mode (`missing`, `changed`, `all`; before 1.50, `-u` means `all`); on recent versions the default when passed without a value is `missing`, which only writes where no baseline exists and still fails that test so a brand-new PNG can't slip in unnoticed. Never use `=all` / `=changed` in an automated PR job.
2. **Make the page freezeable before snapshotting it**: disable CSS animations (`animations: 'disabled'`, the `toHaveScreenshot` default), and for JS-driven motion, mask the **container** of the moving element (masking the element itself is not enough), or stub time/`requestAnimationFrame` in tests.
3. **Require human review of every baseline diff** — a passing update run is not evidence the new baseline is correct; compare against the previous good baseline (pixel-diff count) before merging.
4. **Guard against silent corruption**: after any baseline update, re-run the test without the update flag on the unchanged page; a failure means the new baseline is a random frame, not a legitimate change.
5. Keep version pinning in mind when triaging: reproducible from at least 1.40.0 through 1.65.1 (first reported on 1.59.1).

## Reproduction
Test core (`toHaveScreenshot` with defaults: 5 s timeout, CSS animations off) over four card variants (stable / css-animation / js-animation / live-clock) × four update settings (`none`, `missing`, `changed`, `all`), 10 runs each, plus older versions 3 runs each. Full harness: PoC repo `qa-gary-parker/poc-playwright-update-snapshots-unstable`.

## References
- Original: [Playwright --update-snapshots Overwrote a Good Baseline and Passed: 226 of 226 Runs](https://dev.to/garyparker/playwright-update-snapshots-overwrote-a-good-baseline-and-passed-226-of-226-runs-2h3m)
- Upstream: [microsoft/playwright#44128](https://github.com/microsoft/playwright/issues/44128)
- Related: [Automatic snapshot creation in CI for Playwright (2024 pattern this breaks)](https://garyparker.dev/blog/automatic-snapshot-creation-in-ci-for-playwright)
