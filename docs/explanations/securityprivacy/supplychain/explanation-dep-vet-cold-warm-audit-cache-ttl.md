---
title: 'What a Dependency Audit Actually Costs: Cold vs Warm Timings, Cache TTLs,
  and Honest Exit Codes in Dep-Vet'
diataxis: Explanation
domain: security-privacy
topic: supply-chain
source: DEV.to Tech News
source_url: https://dev.to/nassihyassine/a-real-dependency-audit-1090-packages-118-seconds-cold-15-seconds-warm-3oao
date: 2026-11-25
keywords:
- knowledge-base
- supply-chain
- security-privacy
- explanations
---
# What a Dependency Audit Actually Costs: Cold vs Warm Timings, Cache TTLs, and Honest Exit Codes in Dep-Vet

"Checking a dependency before you install it is cheap" hides a number. A measured one on a real lockfile (OWASP NodeGoat, pinned to commit `c5cb68a`, a 2023 tree of 1,090 packages, i7-11800H): **cold audit 118.26 s → warm audit 1.45 s — an 82× gap on identical input and output**, using Dep-Vet 0.16.0 (Rust release build, 19 MB binary, SQLite cache isolated in a temp dir).

## Why the two numbers govern different decisions

The cold run pays every network fetch once: 1,866 cache entries / 115 MiB — packuments, advisory batch+detail pages, EPSS and KEV lookups, download counts. No daemon, no preload. The warm run reads all of it from SQLite. In day-to-day use almost every check is a **diff**, which is why the warm number is the one that matters:

- CI runs audit on a pull request → checks *added* packages, not the whole tree.
- `watch` re-audits when the lockfile changes.
- `guard` runs pre-install, only on packages being installed.

Honest framing: the *first* audit of a tree costs a couple of minutes; every audit after that costs ~1.5 s.

## Cache-TTL design as a security decision

Dep-Vet's split TTLs are the reusable pattern: **registry metadata cached 24 h** (packuments rarely change and staleness is harmless) vs **advisories cached 5 min** ("a five-minute-old advisory list is fine and a day-old one is not"). A warm run more than five minutes later re-queries OSV and takes longer than 1.45 s — the benchmark number is a genuinely warm run, not a best case with stale security data. Any dependency-scanning cache should justify each TTL by the *staleness cost per data class*, not by one global TTL.

## Exit code 3 as an integrity guarantee

Both runs exit `3` — by design. One package in the lockfile, `grunt-if@0.2.0`, no longer exists on npm. Dep-Vet still reports everything it checked (210 HIGH findings across 101 packages, 356 WARN across 205) but **refuses to print "clean"**:

```
could not check 1 package:
  grunt-if@0.2.0: '0.2.0' of 'grunt-if' was not found on npm; dep-vet takes
  an exact version or dist-tag, not a range
this report is incomplete
```

A package installable in 2023 and gone in 2026 is a **supply-chain event** (typosquat window, silent removal), not a parsing inconvenience. The lesson generalises beyond this tool: audit pipelines must distinguish "no findings" from "could not finish", and CI should treat the latter as a distinct status — never collapse it into either pass or crash.

## Reproducing

```bash
git clone https://github.com/nassih-yassine/Dep-Vet
cd Dep-Vet && cargo build --release
DEPVET_BIN=./target/release/dep-vet examples/benchmark/run.sh
```

The benchmark script clones NodeGoat to a temp dir, wipes an isolated cache, times `dep-vet audit package-lock.json` twice, prints cache entry count/size. Quick try: `npx @nassihyas/dep-vet audit package-lock.json` (MIT, no account/API key).

## What the benchmark is not

Not a comparison to `npm audit` (different question, different work: one bulk registry request). Not a risk claim about npm 2026 — the 101 HIGH packages are a property of a deliberately old fixture. One machine, one lockfile, one run each.

## See also

- `howto-dependency-track-openclarity-sbom-cve-scanning.md` — continuous SBOM platforms vs point-in-time audit tools.
- `explanation-nth-party-trust-chain.md` — why "gone from the registry" is a trust-chain signal.

## References

- [A real dependency audit: 1,090 packages, 118 seconds cold, 1.5 seconds warm — DEV.to](https://dev.to/nassihyassine/a-real-dependency-audit-1090-packages-118-seconds-cold-15-seconds-warm-3oao)
- [Dep-Vet repository](https://github.com/nassih-yassine/Dep-Vet)
- [OWASP NodeGoat](https://github.com/OWASP/NodeGoat)
