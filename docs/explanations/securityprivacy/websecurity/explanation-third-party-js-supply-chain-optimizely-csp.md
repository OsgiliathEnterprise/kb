---
title: 'Third-Party JavaScript Supply Chain: The Optimizely A/B-Test Malware Campaign
  and Why CSP Is the Missing Control'
diataxis: Explanation
domain: security-privacy
topic: web-security
source: HackerNews
source_url: https://krebsonsecurity.com/2026/11/attackers-used-optimizely-to-a-b-test-malware-on-top-websites/
date: 2026-11-18
keywords:
- knowledge-base
- web-security
- security-privacy
- explanations
---
# Third-Party JavaScript Supply Chain: The Optimizely A/B-Test Malware Campaign and Why CSP Is the Missing Control

On 2026-11-16 an attacker exploited a vulnerability in **Optimizely Experimentation** to inject malicious JavaScript into customer projects, and at least **178 top web destinations** — including the BBC, CNN, Equifax, Ledger and Zoom — served it to visitors within 24 hours. None of those sites had their own code or infrastructure breached. The incident is the clearest evidence yet that the web's dominant defense against exactly this scenario — **Content Security Policy** — is either absent or too permissive to work.

![Third-party JS supply chain attack path and CSP outcome](explanation-third-party-js-supply-chain-optimizely-csp.svg)

## What happened

- Malicious JavaScript was delivered **through the A/B-testing pipeline itself**: the payload was rebuilt **26 times during a single day**, versioned and measured like a product feature. Report URI's Scott Helme observed the same technique defenders use — iteration loops — pointed the other way.
- The dropped kit was multi-purpose: **payment-card skimming, cookie and screenshot theft, and cryptocurrency address swapping** on checkout pages.
- It also served **zero-click iOS exploit kits** (named "DarkSword" and "Coruna") targeting known vulnerabilities in older iPhones/iPads, chaining roughly half a dozen flaws into full device compromise.
- Optimizely's statement: an "unauthorized party exploited a vulnerability in Optimizely Experimentation to add malicious JavaScript to some customer projects." Remediation was blocking the vulnerable path, deploying a fix, removing injected code, ending sessions, revoking tokens, and resetting affected accounts; Cloudflare-side protections were added to block delivery of malicious code.
- Damage was modest (~**$7,500** in cryptocurrency plus an unknown number of card records) — an indicator of reach, not of the ceiling.

## Why it fired without any user interaction

A/B-testing snippets are engineered to run **as high in the page as possible and immediately on load**, deliberately *not* gated behind a consent dialog, because they must measure the unfiltered original experience. Infoblox researcher Zach Edwards: the compromised payload therefore "didn't require any clicking or consent to trigger — most of the impacted clients would immediately serve up the payload as soon as someone loaded the page." The same design property that makes the product work makes its compromise maximally dangerous.

Context: per the HTTP Archive **2025 Web Almanac**, the **median homepage loads at least 22 JavaScript files**, most of them third-party.

## The CSP numbers that matter

Report URI measured CSP coverage across the 178 affected sites:

| CSP state | Sites | Outcome |
| --- | --- | --- |
| No CSP at all | 68 | Malicious domain injection unrestricted |
| CSP present but permissive | 50 | **Both the payload delivery and the data theft passed** |
| CSP that fully blocked the payload | 24 (15%) | Attack stopped |

Across the web's busiest sites, CSP deployment is only about **10%** (crawler.ninja, top 1M sites). Helme's framing: the current absence of CSP is "the Wild West" — organizations run code they don't know the behavior of. The reason for the low adoption is organizational, not technical: marketing teams need tags to load, so policies get loosened until they no longer constrain anything.

A genuine caveat from practitioner discussion: a CSP that allowlists a compromised first-party vendor's own domain does not stop an in-place payload swap. It stopped **this** attack because the injected script fetched its kit from several domains that were not Optimizely's. `strict-dynamic` weakens the story further — it requires nonces/hashes, and script that can inject can often steal a nonce. So CSP is necessary, not sufficient: it constrains **exfiltration and second-stage fetch destinations**, which is precisely where this campaign was caught.

## Defense checklist

**Site operators**
1. Deploy a CSP with an explicit `script-src` allowlist; audit it quarterly against the tags actually in use, and treat every wildcard (`*`, `https:`, `unsafe-inline`) as a finding.
2. Prefer nonces/hashes over host allowlists where you control the templates; be deliberate about `strict-dynamic` (it reopens dynamic injection by design).
3. Pin third-party scripts with **Subresource Integrity** where the vendor ships stable builds.
4. Move marketing/experimentation tags onto a **separate hostname/domain** so their cookies cannot reach the authenticated origin.
5. Give the marketing stack the same supply-chain review you give payments and auth: who can publish code that executes on your origin, and how fast.
6. Monitor the gap: Report URI / `report-to` endpoints, plus a canary that alerts when an unknown script origin appears on checkout pages.

**End users** — the effective control flipped: ad and script blockers are now the firewall. uBlock Origin / NoScript-class tooling blocks most third-party JavaScript; the 2016-era advice (antivirus plus host firewall) does not address code executing inside your browser's origin.

## The write path and loader variants (what to hunt for)

The injection point was the **Project JavaScript (`projectJS`)** field of Optimizely Web Experimentation — customer-authored code that executes wherever the per-project snippet loads. The attacker wrote a loader into that field across many unrelated projects and left everything else untouched; Report URI confirmed it was **not cache poisoning** — the CDN served exactly what it was given, with Optimizely's own certificate. Three loader variants were observed:

1. A plain tag appending `https://1688360.cc/track.js`.
2. The same URL **base64-encoded and decoded at runtime** (`atob`) — a text search of your repo, WAF rules or tag inventory finds nothing. Smartsheet's snippet was cleaned and then **re-infected with the base64 variant**, proving the attacker retained write access during cleanup.
3. A full inline payload executed via `eval()` as fallback when `1688360.cc` was blocked.

Self-hosted snippet copies (`opt.scheels.com`, `www.vodafone.com.au/js/<id>.js`) were affected too — the content still comes from the same Optimizely project. Exposure ran **04:21–23:11 UTC** (~18h50m), with the payload rebuilt 26 times in that window.

Detection: in the browser, on your own pages,

```js
[...document.scripts].map(s => s.src).filter(s => s && !s.startsWith(location.origin))
// payload markers seen in this campaign
window._k7, window.__k7b, document.querySelector('[data-channel-code="02111110"]')
```

Hunt `1688360.cc`, `webshell.lol`, `5vobauua3ojpklx.icu`, `eil786npto9u5bq.icu`, `linkforge.cc` in page source, CSP reports and proxy logs. The first two are now on `clientHold` — domains dead, **historical logs are not**. If you used Optimizely: audit Project JavaScript/experiment code for those domains and `atob(`, rotate credentials and API tokens, treat cards entered on 16 Nov as exposed and non-`HttpOnly` session cookies as stolen.

## The CSP data: which directives actually decided the outcome

Report URI evaluated the policies of 256 affected organizations against what the payload needs: 68 had **no CSP**; 50 allowed **both payload and exfiltration**; 17 blocked only `connect-src` (addresses still swapped in-page, but no cards/cookies/screenshots left the browser); 24 (15%) blocked the payload outright. Allowlisting `cdn.optimizely.com` was never going to help — that is where the code legitimately came from. Two directives inverted the protection:

- **`'strict-dynamic'`** — trusts any script inserted by a trusted script; the loader *is* a script inserted by a trusted script.
- **`'unsafe-eval'`** — lets the inline fallback run. Observed on HSBC: `track.js` was blocked and theft blocked, but the inline copy still executed — and Optimizely's own docs tell customers to allow it.

`connect-src` is the undervalued directive: it is what separated total compromise from partial. CSP never judges whether an allowed script is honest — it constrains what that script may load and where it may send data.

Compliance angle for card-taking sites: **PCI DSS v4.x requirements 6.4.3** (authorize, inventory and integrity-check every payment-page script) and **11.6.1** (change/tamper detection on that page) have been mandatory since 2025-03-31. Monitor for script *change*, not uptime — the certificate was valid and the servers were up the whole 19 hours.

## Related

- [[../ai-agent-security/explanation-adaptive-prompt-injection-agent-swarms]] — same trust-collapse theme: the input you trust is the one you did not write.
- [[../supply-chain/howto-audit-transitive-github-action-dependencies-pin-deep]] — pinning and auditing for the *other* JS supply chain (build-time vs run-time).

## References

- [Attackers Used Optimizely to A/B Test Malware on Top Websites — Krebs on Security](https://krebsonsecurity.com/2026/11/attackers-used-optimizely-to-a-b-test-malware-on-top-websites/)
- [World's largest brands infected with malware via Optimizely — Report URI blog](https://blog.report-uri.com/worlds-largest-brands-infected-with-malware-via-optimizely/)
- [Content Security Policy — MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP)
- [2025 Web Almanac — HTTP Archive](https://almanac.httparchive.org/en/2025/table-of-contents)
- [Optimizely Security Incident Report, Nov 17 2026 (PDF)](https://pages.optimizely.com/rs/947-RKE-048/images/Security%20Incident%20Report%20-%20Optimizely%20Web%20Experimentation%20-%20Nov%2017%202026.pdf)
- [OPTIMJACK technical breakdown (loader variants, CSP outcomes, IOCs) — DEV.to](https://dev.to/stanleya/optimjack-how-178-sites-served-a-card-skimmer-from-a-trusted-cdn-and-why-csp-allowlisting-cant-1397)
- [Owner-facing deep dive — WardenBit](https://wardenbit.com/posts/optimizely-supply-chain-attack-178-sites-third-party-script-risk/)
- [OPTIMJACK analysis — StepSecurity](https://www.stepsecurity.io/blog/optimjack-optimizely-hosted-scripts-crypto-clipper-card-skimmer), [Truesec](https://www.truesec.com/hub/blog/optimjack-optimizely)
