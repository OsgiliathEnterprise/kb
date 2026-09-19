---
title: libheif HEIC RCE + OpenAI SSO Flaw — The 'HEIF Heist' Exploit Chain
diataxis: Explanation
domain: security-privacy
topic: web-security
source: HackerNews
source_url: https://www.hacktron.ai/blog/hacking-openai
date: 2026-09-19
keywords:
- knowledge-base
- web-security
- security-privacy
- explanations
---
# libheif HEIC RCE + OpenAI SSO Flaw — The "HEIF Heist" Exploit Chain

On July 25, 2026, Hacktron chained two critical vulnerabilities to compromise multiple OpenAI employees' ChatGPT/Codex accounts and reach internal repositories. The chain: a **heap buffer overflow in `libheif`** (reached via ImageMagick on the Discourse forum at community.openai.com) plus an **OpenAI SSO identity flaw** that turned a forum compromise into account takeover of any service using "Sign in with OpenAI". Proof of impact was a harmless PR (#1186742) opened *by an employee's own Codex* in the internal monorepo `openai/openai`. Discovery-to-repo-access took under 72 hours; OpenAI patched within ~14h and paid a $6,500 bounty (for the OpenAI-side finding only — testing community.openai.com was explicitly out of their bounty scope).

## Why libheif is such a wide target

Discourse normally checks images with FastImage, but HEIC/HEIF files are unsupported there and fall through to ImageMagick's `magick` conversion — exposing the underlying **libheif parser directly to attacker-controlled uploads**. The vulnerable code had been changed upstream the previous year in a commit that was *not documented as a security fix* and received no CVE, which is why Debian 12 (bookworm) never got the backport: Discourse's Docker image shipped libheif **1.19.7**, and even Debian 13 still carried vulnerable **1.19.8** until DSA-6417-1 on August 8, 2026.

The overflow gives OOB read/write primitives during HEIC decoding (attacker-controlled `iloc` extent copied into a pixel buffer sized from declared image dimensions). The exploit was developed with AI assistance: Opus 4.8 found the missing backports and built an ASLR-disabled exploit; after Claude Opus 5's release, a working ARM64 exploit appeared within ~3 hours, then ported to Discourse's x86-64 + `jemalloc` configuration — achieving RCE on a live Discourse Cloud instance via an autonomous `/goal` loop.

## The "HEIF Heist" campaign

The team extended the research across Slack, Meta, GitHub Enterprise, Ruby on Rails, and Node.js frameworks (Next.js, Astro, Gatsby) — a surprising amount of widely-used software depends on this one image library. Total cost: **under $3,000 in tokens over two months with three researchers**; adapting the exploit to each new target took 1–2 days, usually without knowing the exact libheif/libc versions or deployment environment. Only Shopify reportedly detected the activity (repeatedly crashing image processors).

**The strategic takeaway:** known memory-corruption bugs were historically expensive to operationalize — "security through complexity" protected ordinary companies in practice. AI is converting that scarce expertise into compute, compressing months of team work into days. Threat models must price exploitation economics accordingly.

## Affected CVEs and patches (verified against Debian tracker)

Debian **DSA-6417-1** (2026-08-08) covers libheif: CVE-2025-68431, CVE-2026-32740, CVE-2026-32741, CVE-2026-32882, CVE-2026-47178, CVE-2026-47247, CVE-2026-47709, CVE-2026-47714, CVE-2026-48029, CVE-2026-49271, CVE-2026-62289, CVE-2026-62292.

| CVE | Issue | Fixed upstream in |
| --- | --- | --- |
| CVE-2026-32741 | Heap buffer overflow in `MaskImageCodec::decode_mask_image()` — attacker-controlled iloc extent copied via single `memcpy` with no upper-bound check (trigger: mskC bits_per_pixel=8, ispe even width ≥ 64) | 1.22.0 |
| CVE-2026-32740 | Grid tile compositing overflow — 64 bytes of fully attacker-controlled chroma data written past a heap allocation via a 1×4 grid of odd-height tiles, default build config | 1.22.0 |

Debian status: **bookworm (1.15.1-1+deb12u1) still vulnerable**; trixie fixed in `1.19.8-1+deb13u1`; forky/sid at `1.23.3-1`. Note the CVEs above are *not* the only issues — DSA-6417-1 lists 12 total, and upstream's latest security release is **v1.23.4** (as of 2026-09-14).

## Remediation checklist

1. **Patch**: install the latest security-patched `libheif`/`libde265` from your distribution's security channel or upstream v1.23.4+. Distribution packages may carry backported fixes under older version numbers — check the package advisory, not just the version string.
2. **Self-hosted Discourse: rebuild now.** Older Docker images contain a vulnerable libheif dependency permitting code execution through image upload. From `/var/discourse`: `git pull` then `./launcher rebuild app` — a web-interface update alone may not replace the underlying image (advisory GHSA-vhm9-85gw-x335).
3. **Defense in depth**: disable untrusted HEIF/AVIF decoding where not needed, or isolate image-processing pipelines in hardened ephemeral sandboxes; ImageMagick's security policy can restrict accepted formats and resource usage. Discourse additionally started sandboxing ImageMagick (commit a071880).
4. **SSO hygiene**: the escalation was an OpenAI-side identity flaw — any first- or third-party service using that SSO had the same exposure; audit your own SSO trust boundaries, not just the forum.

## Diagram

See [libheif-heic-rce-chain.excalidraw](libheif-heic-rce-chain.svg) for the full exploit chain and remediation surface.

## References

- [Hacking OpenAI (hacktron.ai)](https://www.hacktron.ai/blog/hacking-openai)
- [HEIF Heist — multi-vendor libheif investigation](https://heif-heist.com/)
- [Debian DSA-6417-1: libheif security update](https://lists.debian.org/debian-security-announce/2026/msg00328.html)
- [CVE-2026-32741 (NVD)](https://nvd.nist.gov/vuln/detail/CVE-2026-32741) — mask image heap overflow
- [CVE-2026-32740 (NVD)](https://nvd.nist.gov/vuln/detail/CVE-2026-32740) — grid tile compositing overflow
- [Discourse advisory GHSA-vhm9-85gw-x335](https://github.com/discourse/discourse/security/advisories/GHSA-vhm9-85gw-x335)
