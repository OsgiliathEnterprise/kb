---
title: Mini Shai-Hulud — The TanStack npm Worm That Spread Through a Dependabot Bump
diataxis: Explanation
domain: security-privacy
topic: supply-chain
source: DEV.to Tech News
source_url: https://dev.to/axrisi/tanstack-npm-supply-chain-attack-how-a-dependabot-bump-spread-a-worm-1h4l
date: 2026-10-01
keywords:
- knowledge-base
- supply-chain
- security-privacy
- explanations
---
# Mini Shai-Hulud — The TanStack npm Worm That Spread Through a Dependabot Bump

On May 11, 2026, a self-spreading npm worm ("Mini Shai-Hulud") published **84 malicious versions of 42 `@tanstack/*` packages** from TanStack's own release pipeline — all carrying *valid SLSA Build Level 3 provenance*. Two and a half hours later, a routine Dependabot grouped bump pulled two poisoned versions into the small aviation-data project `neilcochran/squawk`; a single merge click turned its maintainer's publish token into **110 more malicious versions in 95 minutes**. No password was phished; the only human step was one merge.

## Why this matters: provenance, OIDC and 2FA all worked — and didn't help

The upstream packages were genuinely built by TanStack's official pipeline after the pipeline itself was poisoned. As TanStack's follow-up put it: *"npm provenance, SLSA, OIDC, and 2FA all worked as advertised and still didn't stop this attack."* Provenance answers "which pipeline built this?" — it cannot answer "was the pipeline clean?". Once attacker code runs inside the job that holds the credential, every signature it produces is genuine. The short-lived OIDC token died in minutes, but the worm read it out of memory while it was alive.

## Attack chain (all times UTC)

| Time | Event |
| --- | --- |
| May 11, 10:49 | Renamed fork opens PR #7378 ("WIP: simplify history build"); `bundle-size.yml` runs on `pull_request_target`, which executes in the **base repository's context** — attacker code runs with write access to a cache the release job trusts |
| 11:29 | Attacker code saves a poisoned 1.1 GB pnpm-store cache under the exact key the release workflow later looks up; PR force-pushed empty, closed, branch deleted at 11:31 |
| 19:16 | A legitimate merge triggers `release.yml`, which restores the poisoned cache |
| 19:20 / 19:26 | Attacker binaries read `/proc/<pid>/mem` of the `Runner.Worker` process, extract the OIDC token minted for `id-token: write`, and publish directly to the registry — **84 versions across 42 packages** (the workflow's own publish step was skipped because tests failed; the malware published anyway) |
| 19:46 | TanStack did not find it. A StepSecurity researcher opens [TanStack/router#7383](https://github.com/TanStack/router/issues/7383), ~26 minutes after first publish |
| 20:19 → 21:03 | TanStack deprecates 2, then 28, then all 84 versions; advisory posted at 21:19 |
| 21:48 | **Dependabot opens squawk PR #246** — "Bump the dev-dependencies group with 13 updates", 29 minutes after the advisory. Two of thirteen are poisoned: `@tanstack/router-cli 1.166.40 → 1.166.49` and `@tanstack/router-plugin 1.167.32 → 1.167.41` |
| 22:12 | Maintainer reviews and merges (24 minutes after the PR opened). The publish workflow runs `npm ci` with `NPM_TOKEN` in scope; the malicious `prepare` script exfiltrates the token — "a single overly broad classic npm token" reaching all 22 `@squawk/*` packages plus three personal ones |
| 22:17 → 23:52 | **110 malicious `@squawk/*` versions published** (five per package); `latest` on every package points at the worm. First removal of TanStack tarballs had started at 22:13 — deprecated is only a warning, npm still installs it |
| May 12, 00:04 | Downstream maintainer learns from npm notification emails; revokes token, disables Actions |
| 03:37–03:41 | GitHub Trust & Safety removes the 110 versions and resets `latest` |

## How the worm works (per StepSecurity's deobfuscation of the 2.3 MB payload)

- **Runs on install.** Compromised TanStack versions add a hidden `optionalDependency` pointing at an orphan git commit; npm fetches it as a tarball and runs its `prepare` script during install. A grouped-bump diff hides this — it just says "router-cli 1.166.40 → 1.166.49".
- **Wants one thing: a publish token without second factor.** First step searches for a classic npm token with `bypass_2fa: true`; in CI it exchanges the GitHub OIDC token for per-package publish tokens.
- **Asks the registry what else you own.** With a publish credential, it queries npm search for every package the maintainer controls and publishes an infected tarball for each — one HTTP request per version, no human step, no cooldown. That is why 95 minutes was enough for 110 versions.
- **Dresses as Dependabot.** Dead-drop commits use a fabricated author named "claude" (not Anthropic), message `chore: update dependencies`, and branch names like `dependabot/github_actions/format/fremen` — mimicking Dependabot's naming convention to blend in.

## Why it spread so far

npm's install model is the biggest enabler (the author's blame split, for what it's worth): **lifecycle scripts run on install by default; deprecated versions stay installable; unpublish is refused while dependents exist** — TanStack's postmortem notes this "adds hours of delay during which malicious tarballs remain installable" (first removal 2 h 53 min after first publish, last 4 h 35 min). Vendors counted **160+ packages ecosystem-wide**, including Mistral AI's; SafeDep later reported a jump to PyPI.

## Hardening that actually shipped (copy-paste checklist)

The downstream maintainer's [hardening post](https://github.com/neilcochran/squawk/discussions/264) is four concrete PRs anyone can copy:

1. `--ignore-scripts` on every `npm ci`.
2. Split `publish.yml` into a **build job** (no publish credential, runs install/build) and a **publish job** (`id-token: write`, downloads the artifact, never installs anything).
3. **OIDC Trusted Publishing** instead of a long-lived token — a credential that lives ~15 minutes.
4. A production-publish **environment with a required reviewer**.

TanStack's side (from its [follow-up](https://tanstack.com/blog/incident-followup)): pnpm cache disabled in the release pipeline, all Actions caches removed on affected workflows, third-party actions pinned to commit SHAs, `repository_owner` guards on workflows, non-SMS 2FA enforced across npm and GitHub.

```yaml
# publish.yml (illustrative sketch of the build/publish split)
jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read              # no publish credential in this job
    steps:
      - uses: actions/checkout@<pinned-sha>
      - run: npm ci --ignore-scripts
      - run: npm run build
      - uses: actions/upload-artifact@<pinned-sha>
        with: { name: dist, path: dist }

  publish:
    needs: build
    environment: production-publish   # required reviewer
    permissions:
      id-token: write                 # short-lived OIDC, no NPM_TOKEN secret
    steps:
      - uses: actions/download-artifact@<pinned-sha>
        with: { name: dist }
      # publish the built artifact; no npm install runs in this job
```

Code from `node_modules` runs in `build`, which holds nothing worth stealing. The job that can publish never installs anything. Two more habits from the [HN thread](https://news.ycombinator.com/item?id=48100706) (1,097 points): "Trusted Publishing is not enough by itself", and a **minimum release age** — a delay before freshly published versions are allowed into your tree. These bad versions were live for hours; a longer cooldown skips them entirely.

## Detection: how to know if you were hit

- Check your lockfile against TanStack's postmortem list of affected packages/versions (all published May 11, 2026 around 19:20 and 19:26 UTC).
- Rotate any credential that was present in the environment where a compromised install ran.
- If you maintain npm packages with an overly broad classic token (`bypass_2fa`), assume it is burned — the worm's first search target is exactly that.

## Diagram

See [tanstack-mini-shai-hulud-attack-chain.excalidraw](tanstack-mini-shai-hulud-attack-chain.svg) for the full attack chain from poisoned cache to downstream republishing.

## References

- [TanStack npm supply-chain attack: how a Dependabot bump spread a worm (dev.to, 2026-10-01)](https://dev.to/axrisi/tanstack-npm-supply-chain-attack-how-a-dependabot-bump-spread-a-worm-1h4l)
- [TanStack postmortem: npm supply-chain compromise](https://tanstack.com/blog/npm-supply-chain-compromise-postmortem)
- [TanStack incident follow-up (hardening)](https://tanstack.com/blog/incident-followup)
- [StepSecurity: Mini Shai-Hulud is back — a self-spreading supply-chain attack hits the npm ecosystem](https://www.stepsecurity.io/blog/mini-shai-hulud-is-back-a-self-spreading-supply-chain-attack-hits-the-npm-ecosystem)
- [neilcochran/squawk incident report (discussion #251)](https://github.com/neilcochran/squawk/discussions/251)
- [Hacker News discussion](https://news.ycombinator.com/item?id=48100706)
