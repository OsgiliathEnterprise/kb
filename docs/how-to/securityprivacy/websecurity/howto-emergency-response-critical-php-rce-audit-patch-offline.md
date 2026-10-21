---
title: 'Emergency Response to Critical PHP RCE (CVE-2026-109618 / CVE-2026-109619):
  Audit, Patch Window, and the Offline Switch'
diataxis: How-to Guide
domain: security-privacy
topic: web-security
source: DEV.to Tech News
source_url: https://dev.to/slabb/a-92-unauthenticated-rce-in-php-the-audit-the-patch-window-and-the-offline-switch-51l7
date: 2026-10-21
keywords:
- knowledge-base
- web-security
- security-privacy
- how-to
---
# Emergency Response to Critical PHP RCE (CVE-2026-109618 / CVE-2026-109619): Audit, Patch Window, and the Offline Switch

On 2026-10-21 the PHP security team released fixes for **two critical vulnerabilities rated 9.2 on CVSS v4.0** — both unauthenticated remote code execution in the PHP runtime itself (not a plugin or framework bug). Affected surface: **PHP 5 onward**, i.e. WordPress, Drupal, Joomla, Magento, shared hosting, control panels, and anything quietly running PHP under the hood.

Agency guidance at the time:

- **CERT-EU** (advisory 2026-018): the 9.2 rating indicates unauthenticated RCE — code running on your server without login. Guidance: prepare for **immediate patching**; organizations unable to patch should **take affected sites offline** (not "patch later", not "monitor").
- **ACSC** (Australia): identify every PHP system in your environment, prepare to patch, monitor for exploitation. As of the advisory: *not aware of active exploitation* — "currently".
- **GoDaddy / Huntress / Scope**: code execution over the internet → data theft, defacement, full system compromise; all PHP versions from 5 onward potentially affected.

The CVE identifiers circulating in the leak and advisories: **CVE-2026-109618** and **CVE-2026-109619** (CVSS 9.2, technical details withheld until the patch window). The PHP team stated they may release details earlier "should evidence of active exploitation appear in the wild."

## Why this is different

WAF rules, input validation, and hardening checklists are all PHP *executing your defense*. An unauthenticated RCE in the runtime is an attack on the layer that decides what "executing" means — the runtime is the ground the controls stand on.

## Step 1: The inventory — find every PHP you control

```bash
# what's installed (Debian/Ubuntu and RHEL families)
dpkg -l | grep -E "php[0-9.]*-" | awk '{print $2, $3}'
rpm -qa | grep -E "^php" | sort

# what actually executes, and since when
php -v 2>/dev/null; php-fpm -v 2>/dev/null

# every PHP binary on disk, including the ones a panel installed years ago
sudo find / -name "php*" -type f -perm -111 2>/dev/null | grep -vE "/proc|/sys" | head -20
```

That last command finds the forgotten PHP 5.6 sitting in a panel directory nobody touched since 2019 — exactly the asset the advisory exists for.

## Step 2: The exposure — what faces the internet right now

```bash
# php-fpm sockets and pools
ss -tlnp | grep -E "php|9000"
# every vhost routing to PHP
grep -rE "php|fastcgi" /etc/nginx/sites-enabled/ /etc/apache2/sites-enabled/ 2>/dev/null | wc -l
```

## Step 3: The watch — exploit probes are your tripwire until the patch lands

You don't know the exploit signature, so watch volume and weirdness:

```bash
# requests hitting PHP endpoints, last hour, with response codes
awk -v d="$(date -d '1 hour ago' '+%d/%b/%Y:%H:%M')" '$0 ~ d' /var/log/nginx/access.log \
  | grep -E "\.php" | awk '{print $1, $9}' | sort | uniq -c | sort -rn | head
```

Spikes of POSTs to `.php` paths on sites with no PHP forms, or 200s from paths that should 404, is "not aware of active exploitation" becoming "aware."

## Step 4: The patch — when it drops

```bash
sudo apt update && sudo apt install --only-upgrade "php*"
sudo systemctl restart php8.3-fpm   # your version
php -v                                # confirm the new release
```

## Step 5: The offline switch — for assets you cannot patch in the window

```bash
sudo systemctl stop php8.3-fpm
# serve a static maintenance page with no PHP in the path:
# nginx: return 503 with a maintenance root; the runtime is out of the request path entirely.
```

Stopping `php-fpm` removes the runtime from the request path — no PHP executing, no PHP vulnerability executing. Crudest control available, and the one CERT-EU explicitly endorsed for the unpatchable.

## Decision tree

- **Can patch in the window** → patch and verify the version (`php -v`).
- **Cannot patch** → offline switch, or take the asset off the internet edge.
- **Don't know if you're exposed** → run the inventory commands; that's the prerequisite for patching in minutes instead of days.

Honest limit: the audit tells you *where* every PHP lives; it cannot tell you whether you're vulnerable to *these specific* flaws — that only publishes with the patch.

## References

- [A 9.2 unauthenticated RCE in PHP: the audit, the patch window, and the offline switch (DEV.to)](https://dev.to/slabb/a-92-unauthenticated-rce-in-php-the-audit-the-patch-window-and-the-offline-switch-51l7)
- [CERT-EU security advisory 2026-018: Critical Vulnerabilities in PHP](https://cert.europa.eu/publications/security-advisories/2026-018/)
- [The Hacker News: PHP2Shell — two unpatched critical PHP RCE flaws (CVE-2026-109618, CVE-2026-109619)](https://thehackernews.com/2026/10/php2shell-two-unpatched-critical-php.html)
