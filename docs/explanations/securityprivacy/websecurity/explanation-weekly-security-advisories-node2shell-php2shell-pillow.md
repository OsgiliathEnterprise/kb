---
title: 'Weekly Security Advisories: Node2Shell, PHP2Shell, Pillow 13.0.0, CISA KEV
  Additions'
diataxis: Explanation
domain: security-privacy
topic: web-security
source: DEV.to Tech News
source_url: https://dev.to/deepak_kumar_44eb8741f4b2/i-read-every-security-advisory-this-week-so-you-dont-have-to-this-is-the-most-personal-and-54jc
date: 2026-10-24
keywords:
- knowledge-base
- web-security
- security-privacy
- explanations
---
# Weekly Security Advisories: Node2Shell, PHP2Shell, Pillow 13.0.0, CISA KEV Additions

A digest of one busy week of advisories (late October 2026), each with the version you need and the command that tells you whether you're affected. Cross-checked against independent advisories (SOC Prime, Vercel KB, Aikido, OpenCVE/Threat Radar).

## 1. Node2Shell — CVE-2026-111497: the `fetch()` Brotli trap

An **out-of-bounds write in the Brotli decoder** bundled inside the `node` binary. The trap: you don't have to "use Brotli" to be exposed.

- Built-in `fetch()` decompresses **any** response with `Content-Encoding: br`, no matter what your request asked for.
- Express 5's body parsers also decode Brotli request bodies by default.
- `node:zlib` reaches it directly.

So a link-preview service, webhook sender, or AI agent that fetches URLs is a target even if nobody on the team has ever typed the word Brotli.

**Fixed in**: `v22.23.4+`, `v24.22.1+`, `v26.12.1+`. **Node 20 and older: no fix.**

```bash
node -v   # need v22.23.4+, v24.22.1+ or v26.12.1+
node -p "require('zlib').constants.BROTLI_DECODER_ERROR_FORMAT_BLOCK_SWITCH || 'missing'"
# -17 = patched build, missing = not patched
```

## 2. PHP2Shell — CVE-2026-109618 + CVE-2026-109619

Memory bugs in the **PHP engine itself**: a perfectly clean WordPress or Laravel app is still exposed if the PHP underneath is old. Details leaked before the patch was ready; Cloudflare saw tens of thousands of exploit attempts within 45 minutes and millions by the next day (a Mirai botnet joined in). As of the digest, zero confirmed break-ins — but reliable exploitation turned out to be only hard, not impossible.

**Fixed in**: 8.5.12, 8.4.27, 8.3.36, or 8.2.35+.

```bash
php -v
# BUT this is the CLI. Your web server might run a different PHP-FPM build.
```

**The Ondřej Surý story**: Debian/Ubuntu packages from `ppa:ondrej/php` and `packages.sury.org` are maintained in spare time by one volunteer for 20+ years. He shipped patched builds the same day and backported the fix to PHP 5.6 — a version PHP itself no longer supports. "I feel a responsibility toward the users of the internet." If you've ever typed `add-apt-repository ppa:ondrej/php`, check whether you still rely on him:

```bash
apt policy php8.3   # swap in your version
```

## 3. Pillow 13.0.0 — one crafted image, code on your server

Two bugs worry most:

- **CVE-2026-112398** (CWE-122 heap overflow): a crafted **FlashPix** file can run code from a single `Image.open()` when `olefile` is installed. Pillow detects formats by *content*, so renaming the upload to `.png` does not save you.
- **CVE-2026-96639**: multi-frame images (PSD, MPO, DCX, MIC) can make Pillow **write past a buffer** when you `seek()` through frames.

**The pip trap**: Pillow 13 needs Python 3.11+. On Python 3.10, `pip install -U pillow` "succeeds" but quietly installs a vulnerable 12.x. Fail loudly instead:

```bash
python -c "import PIL; print(PIL.__version__)"
pip install -U "Pillow>=13.0.0"   # errors on 3.10 — which is what you want
```

## 4. CISA KEV additions — already being exploited

Two flaws added to the Known Exploited Vulnerabilities list the same week:

- **CVE-2026-110447** — Collabora Online's built-in server for Nextcloud (`richdocumentscode`). Attackers planted **PHP web shells** and went looking for KeePass files and crypto wallets. **Disabling the app doesn't fix it**: update to 26.4.303+ or remove it.
- **CVE-2026-114625** — Arista VeloCloud Orchestrator. SQL injection that lets the lowest read-only user become a full operator.

If you run Nextcloud, look for leftover shells **even if you've patched**:

```bash
find /path/to/nextcloud -name 'shx*.php'
```

## The pattern to internalize

Three of these five are the same bug wearing different clothes: **native code decoding untrusted bytes** — a Brotli stream, a PHP request body, an image file. Your code can be clean TypeScript or Python and still hand attacker-controlled data to C code you've never looked at.

The other two are a reminder that "patched" ≠ "safe": the Collabora fix shipped a month before anyone called it a security fix, and patching doesn't remove a web shell planted before the update.

Checklist:

1. Know what's actually decoding your inputs — not just what's in `package.json` / `requirements.txt`.
2. Check the runtime that **serves traffic**, not the one in your terminal.
3. After you patch, hunt for what got in before you did.
4. Throw a few dollars at the maintainers your stack quietly depends on.

## Diagram

[explanation-weekly-security-advisories-node2shell-php2shell-pillow.excalidraw](explanation-weekly-security-advisories-node2shell-php2shell-pillow.svg)

## References

- [Weekly security advisory digest — ByteMuni via DEV.to](https://dev.to/deepak_kumar_44eb8741f4b2/i-read-every-security-advisory-this-week-so-you-dont-have-to-this-is-the-most-personal-and-54jc)
- [CVE-2026-111497: Node.js Brotli decoder RCE — SOC Prime](https://socprime.com/blog/cve-2026-111497-node-js-brotli-decoder-flaw-enables-remote-code-execution/)
- [Node.js security advisory: Brotli decoder RCE — Vercel KB](https://vercel.com/kb/bulletin/node-js-security-advisory)
- [Node2Shell: CVE-2026-111497 and the fix — Aikido](https://www.aikido.dev/blog/node2shell-nodejs-brotli-rce-cve-2026-111497)
- [Node.js CVE-2026-111497: which versions to upgrade — hol.org](https://hol.org/blog/cve-2026-111497nodejs-brotli-decoder-out-of-bounds-write)
- [CVE-2026-112398 Pillow FlashPix heap overflow — OpenCVE](https://app.opencve.io/cve/CVE-2026-112398)
- [Pillow crafted-image vulnerabilities — ByteMuni](https://bytemuni.com/cyber-security/pillow-vulnerability-cve-2026-96639/)
- [PHP2Shell patches for web servers — ByteMuni](https://bytemuni.com/cyber-security/php2shell-patches-for-php-web-servers/)
- [CISA KEV: Collabora Online + Arista VeloCloud — ByteMuni](https://bytemuni.com/cyber-security/cisa-kev-collabora-online-arista-velocloud/)
