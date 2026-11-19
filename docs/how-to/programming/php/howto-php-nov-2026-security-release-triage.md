---
title: Triage the November 2026 PHP Security Release (8.5.13 / 8.4.28 / 8.3.37 / 8.2.36,
  12+ CVEs)
diataxis: How-to Guide
domain: programming
topic: php
source: DEV.to Tech News
source_url: https://dev.to/devtalk94/php-security-release-nov-2026-fixes-in-8513-8428-5fj3
date: 2026-11-19
keywords:
- knowledge-base
- php
- programming
- how-to
---
# Triage the November 2026 PHP Security Release (8.5.13 / 8.4.28 / 8.3.37 / 8.2.36, 12+ CVEs)

On 2026-11-19 PHP released **8.5.13, 8.4.28, 8.3.37 and 8.2.36** with fixes for 12 CVEs on every supported branch (plus more on newer ones), highest severity **critical**. PHP 8.1 and older are out of support and get nothing. This note is the patch-triage procedure: what was fixed, who is actually exposed to the headline CVE, how to check, and why `php -v` lies on Linux.

## Step 1 — Know what was fixed

**On every supported branch (8.5, 8.4, 8.3, 8.2):**

| CVE | Component | Issue |
| --- | --- | --- |
| CVE-2026-115560 | Session | Serializer mismatch → RCE |
| CVE-2026-126714 | Session | Partially overwritten session files → RCE |
| CVE-2026-129496 | Date | Timezone cache use-after-free → RCE |
| CVE-2026-129538 | CGI | OOB read/write during PATH_INFO correction |
| CVE-2026-129289 | PHP-FPM | Request smuggling via unread HTTP request body |
| CVE-2026-129292 | PHP-FPM | Status endpoint XSS (unescaped user/script fields) |
| CVE-2026-129291 | PHP-FPM | epoll use-after-free → local privilege escalation |
| CVE-2026-128090 | PHAR | OpenSSL signature bypass via algorithm downgrade |
| CVE-2026-129506 | SOAP | Use-after-free on DTD entity references |
| CVE-2026-15353 | SOAP | Info disclosure via malformed array dimensions |
| CVE-2026-128064 | Streams | Mixed-case HTTPS/FTPS URLs expose plaintext |
| CVE-2026-127960 | Streams | DoS via folded HTTP response headers |

**Some branches only:** CVE-2026-129481 (8.5/8.4/8.3, interrupted session shutdown UAF), CVE-2026-129501 (8.5/8.4, DOM XML serialization double free), and on 8.5 only: CVE-2026-129474 (magic-method backtrace UAF → RCE), CVE-2026-129182, CVE-2026-129438, CVE-2026-48841 (uriparser 1.0.3).

Context: the 21 October emergency release (8.5.12 / 8.4.27 / 8.3.36 / 8.2.35) fixed "PHP2Shell" (CVE-2026-109618/-109619) but **did not** fix CVE-2026-115560. Updating to the October builds was not enough.

## Step 2 — Check exposure to CVE-2026-115560 (the discussed one)

Session-upload-progress RCE requires **both**:

1. Config sets `session.serialize_handler` to `php_binary` or `php_serialize`, **and** code switches the handler to `php` (via `ini_set()` **or** the `session_start()` options array) before `session_start()` — a configured-vs-runtime handler mismatch.
2. Session upload progress is enabled — **true by default** on stock installs.

Search code (the options-array form matters, so grep the setting name, not just `ini_set`):

```bash
grep -rnE "serialize_handler" app src public --include=*.php
# also check vendor/ if unsure (frameworks may use native sessions)
```

Check server config (CLI and FPM can differ — run `php-fpm -i` too):

```bash
php -i | grep -E "^session\.(serialize_handler|upload_progress\.enabled)"
grep -rnE "^\s*(php_value|php_admin_value)?\s*\[?session\.(serialize_handler|upload_progress\.enabled)" /etc/php 2>/dev/null
```

## Step 3 — If you cannot patch today, disable upload progress correctly

```ini
; php.ini or the FPM pool configuration — NOT at runtime
session.upload_progress.enabled = 0
```

`ini_set()` **cannot** change it: the setting is `PHP_INI_PERDIR` (access level 2), so `ini_set('session.upload_progress.enabled', '0')` returns `false`. Restart PHP workers afterwards. This covers one CVE only — it is a stopgap, not a substitute for upgrading.

## Step 4 — Upgrade, then verify by CVE id, not version number

Upgrade to 8.5.13 / 8.4.28 / 8.3.37 / 8.2.36 or a distro package that lists these CVEs as fixed. **`php -v` misleads**: distros backport fixes without bumping the upstream version (e.g. a patched Ubuntu box still reports 8.3.6). Compare CVE ids in the package changelog:

```bash
# Debian/Ubuntu
zcat /usr/share/doc/php8.3-common/changelog.Debian.gz | grep -o "CVE-2026-[0-9]*" | sort -u
# RPM-based: search the package changelog (rpm -q --changelog php | grep CVE-2026)
```

Distribution fixes typically trail upstream by days.

## Framework notes

- **Laravel**: no native `session_start()` calls in the framework itself (it manages sessions through its own store), so the session-specific CVEs are less likely to apply — but packages or app code may still use native sessions; grep `vendor/` too. The PHP-FPM, timezone-cache, SOAP, streams and PHAR fixes apply regardless.
- Prioritize the CVEs the release notes label "can lead to remote code execution": the two session bugs, the timezone-cache UAF, and (8.5 only) the magic-method backtrace UAF.

## References

- Walkthrough with verification commands: [PHP Security Release Nov 2026 — DEV.to](https://dev.to/devtalk94/php-security-release-nov-2026-fixes-in-8513-8428-5fj3)
- Upstream CVE lists: [php-src NEWS 8.4.28](https://github.com/php/php-src/blob/php-8.4.28/NEWS), [8.3.37](https://github.com/php/php-src/blob/php-8.3.37/NEWS), [8.2.36](https://github.com/php/php-src/blob/php-8.2.36/NEWS)
- Release announcement: [PHP Foundation Discourse](https://discourse.thephp.foundation/t/php-webmaster-web-php-master-announce-php-8-5-13-8-4-28-8-3-37-8-2-36/6451)
- Coverage: [The Register](https://www.theregister.com/patches/2026-11-18/get-ready-for-another-critical-php-security-release-to-drop/5310911), [The Hacker News](https://thehackernews.com/2026/11/php-warns-of-critical-security-flaws.html)
- Related: [[explanation-php-8-6-new-features]]
