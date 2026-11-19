---
title: 'jQuery 4.1.0 / 3.8.0: ReDoS in Selector Identifier Matching and the 3.x Endgame'
diataxis: Explanation
domain: security-privacy
topic: web-security
source: Developpez
source_url: https://blog.jquery.com/2026-11-17/jquery-4-1-0-and-3-8-0-released-passing-the-torch/
date: 2026-11-19
keywords:
- knowledge-base
- web-security
- security-privacy
- explanations
---
# jQuery 4.1.0 / 3.8.0: ReDoS in Selector Identifier Matching and the 3.x Endgame

On 17 November 2026 jQuery shipped **4.1.0** (first minor of the 4.x line) and **3.8.0** — the
"passing the torch" release: 3.x gets years of backported fixes as a farewell, after which the
3.x branch accepts **only critical security fixes and bug fixes**. Given jQuery ran on **65.3% of
the top 10M websites as of October 2026** (3–4x any other JS library), even a parser-level bug in
the selector engine has enormous blast radius.

## The ReDoS: catastrophic backtracking in the identifier regex

The regex jQuery used to match identifiers in selectors exhibited **catastrophic backtracking**:
a **long chain of hexadecimal escapes followed by an invalid character** — e.g. inside an
attribute selector — made the regex engine explore exponentially many backtracking paths and
**hang the page** (per GitHub issue jquery/jquery#5904, an ~80-character selector already blocks
the main thread for several seconds and the hang grows exponentially with selector length,
unbounded; the patched build resolves the same input instantly).

The attack surface is any code path that feeds **untrusted strings into a jQuery selector**:
`$(userInput)`, `$(ctx).find(userInput)`, attribute-selector templates like
`[id="' + userInput + '"]`. It is a pure availability bug — no XSS, no data leak — but it
freezes the main thread.

**The fix:** the production build now **explicitly excludes digits and hex characters where the
CSS specification requires it**, matching the spec more closely so the ambiguous,
backtracking-prone branch of the regex disappears. Invalid escape sequences in selectors are now
also decoded to **U+FFFD** (the replacement character) as the CSS spec requires.

![ReDoS: exponential backtracking vs spec-exact regex](explanation-jquery-4-1-0-redos-selector-identifier-fix.svg)

Operational note: **regex ReDoS in client-side libraries is underrated** — the DoS target is your
own users' browser tabs, triggered by content you render, and it does not error, it just hangs.
Any library that compiles user input into a regex or selector is a candidate; audit them the same
way you audit server-side parsers.

### Independent measurement and the exact regex defect

A dev.to reproduction ran jQuery's own regression input —
`"[" + Array(31).join("\\a") + "!]"` (63 chars, 30 hex escapes + invalid char) — against both
shipped builds in jsdom (Node 24): **4.0.0 was still running when killed at 120,000 ms; 4.1.0
threw "Syntax error, unrecognized expression" in 4 ms** (≥30,000x). The textbook mechanism: in
the 4.0.0 `identifier` production, the hex-escape branch `\\[\da-fA-F]{1,6}` and the fallback
branch `\\[^\r\n\f]` **both** match `\a`, so each escape has two parses — 30 escapes ≈ up to 2^30
backtracking paths, all explored because the trailing `!` guarantees overall failure. The shipped
fix extracts a shared `escape` production whose second alternative excludes hex digits
(`\\[^\da-fA-F\r\n\f]`), giving every escape exactly one parse
(commit `d41cf7dd`, "Selector: Fix ReDoS in identifier matching", closes gh-5807, reported by
John Herren).

### Follow-up: the fix is partial for six-digit escapes (PR #5904)

Community PR jquery/jquery#5904 (Aug 2026) argues the gh-5807 fix only removed the
**single-character** `\a` ambiguity: runs of **full six-digit hex escapes**
(e.g. `[a=\aaaaaa\aaaaaa...%`) can still be partitioned many ways against the `[\w-]` branch and
backtrack exponentially, reachable via `jQuery()`/`find()`/`is()`/`filter()` with untrusted input
(~80-char selector → multi-second, unbounded hang). Its proposed remedy is maximal-munch on the
hex-digit run so digits are never handed back to `[\w-]`. Treat as an open hardening item, not a
shipped change: keep `$.escapeSelector()` on any user-derived selector string even on 4.1.0.

### Same bug class, server side: soupsieve (Beautiful Soup 4)

CVE-2026-126191 / GHSA-6655-6qjp-jx7x (CVSS v3.1 7.5, published 2026-11-12): `CSS_ESCAPES` and
`IDENTIFIER` subpatterns in soupsieve &lt; 3.0 backtrack exponentially on runs of ambiguous digit
escapes in an attribute-name or tag position — during **selector compilation**, before the
`SELECTOR_LIMIT` guard applies, so a short input stalls a worker in `soupsieve.compile()` or
Beautiful Soup `select()`. Fixed in soupsieve 3.0. If your Python backend accepts user-supplied
CSS selectors, this is the server-side twin of the jQuery bug: same regex-family root cause, same
upgrade-now guidance.


## Migration-relevant changes in 4.1.0

- **AJAX transport `complete` callback gains an object form.** Custom transports may now invoke
  `function({ status, statusText, responses, headers })` instead of positional arguments — new
  fields can be added without breaking argument order. 4.1.0 already uses this for `responseURL`.
- **`jqXHR.responseURL`** exposes the final URL after browser-followed redirects (only when the
  transport can supply it — XHR yes, IE 11 / script / JSONP transports no). Check for
  open-redirect tracking with it.
- **Form-associated custom elements** (`customElements.define(..., { formAssociated: true })`) now
  serialize correctly with `.serialize()` / `.serializeArray()` — membership in `form.elements`
  decides submittability instead of tag-name filtering.
- **CSS methods work in XML documents**: internally switched to `createElementNS` with the XHTML
  namespace so `.css()` works on XSLT-transformed documents where `createElement` puts elements
  in the XML namespace with no `style` property.
- **`querySelectorAll` everywhere**: `getElementsByTagName`/`getElementsByClassName` are gone
  internally — qSA returns a static list (no dynamic-collection snapshotting) and fixes long-standing
  bugs (MathML tag-name matching on cloned nodes in IE 11, leading-combinator selectors on
  document fragments, unusual characters in tag names).
- **`uniqueSort` is now O(N) time / O(1) extra space** — single-pass two-pointer compaction
  replaced repeated merges (was O(N²) time / O(N) space). Same output order.

## What 3.8.0 removes (so 3.x users see the 4.x migration surface)

- Array methods `push`, `sort`, `splice` on the jQuery prototype (internal-only since Sizzle was
  folded in). Replace `$elems.push(elem)` with `[].push.call($elems, elem)`.
- `jQuery.expr[":"]` and `jQuery.expr.filters` — deprecated since 3.0.0, never moved into the
  `deprecated` module. Use **`jQuery.expr.pseudos`**.
- Backported 4.0.0 fixes: self-clearing scripts in `.html()`, `jQuery.cleanData` skipping
  elements, correct `<col>` dimensions, more robust `leverageNative`, CSS-zoom and hidden-iframe
  compat test fixes.

## Decision guidance

1. If you still serve jQuery 3.x: take 3.8.0 **now** for the ReDoS fix, but plan the 4.x
   migration — 3.x is critical-fixes-only from here.
2. Grep your codebase for selectors built from user input (`$(.*\+`, `[id=`, `:has(` templates);
   that pattern is both the ReDoS vector and a general code smell — pass elements, not
   string-concatenated selectors, or sanitize with `$.escapeSelector()`.
3. If you ship pinned jQuery on a CDN, treat this like any CVE-driven bump: re-scan your
   dependency inventory and pin the new version hash.

## See also

- `explanation-third-party-js-supply-chain-optimizely-csp.md` — same delivery path (CDN'd JS), different threat class
- `../web-app-security-hoffman/howto-automate-dependency-tree-cve-scanning.md` — how to catch library CVEs like this automatically

## References

- [jQuery 4.1.0 and 3.8.0 Released: Passing the Torch — Official jQuery Blog](https://blog.jquery.com/2026-11-17/jquery-4-1-0-and-3-8-0-released-passing-the-torch/)
- [jQuery's 120-second hang now takes 4 ms in 4.1.0 — dev.to (independent jsdom benchmark, regex walkthrough)](https://dev.to/frankchu/jquerys-120-second-hang-now-takes-4-ms-in-410-1ni2)
- [PR jquery/jquery#5904 — ReDoS in six-digit hex escape runs (follow-up hardening, open)](https://github.com/jquery/jquery/pull/5904)
- [CVE-2026-126191 / GHSA-6655-6qjp-jx7x — soupsieve &lt; 3.0 selector-compilation ReDoS (OpenCVE)](https://app.opencve.io/cve/CVE-2026-126191)
- [jQuery 4.1.0 fixes a ReDoS and speeds up element searches — MA-NO](https://www.ma-no.org/en/programming/javascript/jquery-4-1-0-fixes-a-redos-and-speeds-up-element-searches)
- [Developpez coverage (FR): jQuery 4.1.0 / 3.8.0 avec correction ReDoS](https://javascript.developpez.com/actu/389272/Les-versions-4-1-0-et-3-8-0-de-la-bibliotheque-Javascript-jQuery-sont-disponibles-avec-une-correction-d-une-vulnerabilite-ReDoS-dans-la-correspondance-des-identifiants/)
