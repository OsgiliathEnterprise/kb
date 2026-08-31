---
title: Open Redirect Vulnerabilities in PHP and Laravel — When Your Own Domain Becomes
  the Attack
diataxis: Explanation
domain: security-privacy
topic: web-security
source: DEV.to Tech News
source_url: https://dev.to/kriosa/open-redirect-vulnerabilities-in-php-and-laravel-when-your-own-domain-becomes-the-attack-43cf
date: 2026-08-28
keywords:
- knowledge-base
- web-security
- security-privacy
- explanations
---
# Open Redirect Vulnerabilities in PHP and Laravel — When Your Own Domain Becomes the Attack

An open redirect lets an attacker send users from **your trusted domain** to a malicious one. The victim never sees `evil.com` in the link they were asked to trust — only `yoursite.com`. That makes it a *trust weaponization* attack, not a low-severity footnote: your domain's reputation is redirected against your own users.

## The core pattern

```php
// After login, redirect back to where the user was:
header('Location: ' . $_GET['redirect']);
exit;
```

Legitimate use: `https://yoursite.com/login?redirect=/dashboard`.
Attacker-crafted: `https://yoursite.com/login?redirect=https://evil.com/fake-login` — the victim logs in, and your app immediately bounces them to a pixel-perfect fake login page.

## Why it's more dangerous than "low severity" suggests

1. **Weaponizes domain reputation.** A direct link to `evil.com` gets flagged by spam filters and met with suspicion; a link through `yoursite.com` inherits your trust, passes filters, and gets clicked without hesitation.
2. **Chains with other vulnerabilities.** Combined with an OAuth flow it can steal authorization codes; combined with password reset it can steal reset tokens. In auth flows it contributes to account takeover.
3. **Permanent phishing infrastructure.** Once discovered, the redirect is a phishing asset tied to your reputation for as long as the bug exists.

## The four places open redirects appear

| Location | Example parameters |
|----------|-------------------|
| Login redirect (most common) | `?redirect=`, `?return_to=`, `?next=` |
| Logout redirect | `/logout?redirect=https://evil.com` |
| Error page redirects | `/404?return=https://evil.com` |
| Link trackers / URL shorteners | `/go?url=`, `/track?link=`, `/redirect?to=` |

## The four wrong fixes (and why each fails)

**Wrong fix 1 — checking for `http`:**

```php
if (strpos($redirect, 'http') === false) { header('Location: ' . $redirect); exit; }
```

Bypassed by protocol-relative URLs: `//evil.com/phishing` contains no `http`, and the browser resolves it against the current scheme.

**Wrong fix 2 — checking for your domain name in the string:**

```php
if (strpos($redirect, 'yoursite.com') !== false) { /* redirect */ }
```

Bypassed by `https://evil.com/yoursite.com/phishing` or `https://yoursite.com.evil.com/phishing` — the substring is present but the host is not yours.

**Wrong fix 3 — partial `parse_url()` validation:** checking only `$parsed['host']` without validating scheme and guarding against bypass characters (`\`, `@`) where PHP's parser and browsers disagree on edge cases.

**Wrong fix 4 — blacklisting domains.** The attacker can register unlimited domains; a blacklist is not a security control.

## The correct fixes

### Fix 1 — Whitelist by key (strongest)

Never accept arbitrary URLs; accept a **key** that maps to a known destination:

```php
$allowedRedirects = [
    'dashboard' => '/dashboard',
    'profile'   => '/profile',
    'settings'  => '/settings',
    'orders'    => '/orders',
];

$key = $_GET['redirect'] ?? 'dashboard';
$redirect = $allowedRedirects[$key] ?? '/dashboard';

header('Location: ' . $redirect);
exit;
```

The destination is never derived from user input — the attack surface disappears entirely.

### Fix 2 — Relative-URL validation

If you must accept user-supplied paths, restrict them to same-domain relative paths:

```php
function isSafeRedirect(string $url): bool
{
    if (str_starts_with($url, '//')) return false;              // no protocol-relative
    if (preg_match('/^[a-zA-Z][a-zA-Z0-9+\-.]*:/', $url)) return false; // no scheme
    if (!str_starts_with($url, '/')) return false;             // must be absolute path
    return true;
}

$redirect = $_GET['redirect'] ?? '/dashboard';
if (!isSafeRedirect($redirect)) { $redirect = '/dashboard'; }
header('Location: ' . $redirect);
exit;
```

A URL starting with `/` and containing no scheme can only resolve within the current domain.

### Fix 3 — Domain validation for absolute URLs

Validate **both** scheme and host precisely (exact match or confirmed subdomain):

```php
function isTrustedRedirect(string $url, string $trustedHost): bool
{
    $parsed = parse_url($url);
    if (empty($parsed['host'])) return false;
    if (!in_array($parsed['scheme'] ?? '', ['http', 'https'], true)) return false;

    $host = strtolower($parsed['host']);
    $trusted = strtolower($trustedHost);
    return $host === $trusted || str_ends_with($host, '.' . $trusted);
}
```

### Defense in depth: always fall back to a safe default

If validation fails for *any* reason (unexpected input format, `parse_url()` edge case), redirect to a known-safe destination instead of proceeding with an unvalidated URL.

## Laravel-specific patterns

**Danger:** passing user input straight into the `redirect()` helper:

```php
$redirect = $request->input('redirect', '/dashboard');
return redirect($redirect); // vulnerable
```

**Fix 1 — `redirect()->intended()`.** The intended URL is stored **server-side in the session** before the user sees the login page, so it never comes from request input:

```php
// In auth middleware
return redirect()->guest('/login');

// After successful login
return redirect()->intended('/dashboard');
```

**Fix 2 — Whitelist by key** (same map pattern as plain PHP).

**Fix 3 — Relative-URL validation:**

```php
$redirect = $request->input('redirect', '/dashboard');
if (!str_starts_with($redirect, '/') ||
    str_starts_with($redirect, '//') ||
    preg_match('/^[a-zA-Z][a-zA-Z0-9+\-.]*:/', $redirect)) {
    $redirect = '/dashboard';
}
return redirect($redirect);
```

**Fix 4 — Signed URLs for trusted flows** (email links, password reset, OAuth callbacks). The cryptographic signature covers the entire URL including the destination parameter; tampering invalidates it. Still validate after the signature check:

```php
// Generate
$url = URL::signedRoute('post.login.redirect', ['destination' => '/orders/1042']);

// Verify + re-validate before redirecting
public function postLoginRedirect(Request $request)
{
    if (!$request->hasValidSignature()) { abort(403); }

    $destination = $request->input('destination', '/dashboard');
    if (!str_starts_with($destination, '/') || str_starts_with($destination, '//')) {
        $destination = '/dashboard';
    }
    return redirect($destination);
}
```

## OAuth flows: where open redirects reach critical severity

If your app uses a user-supplied `redirect_uri` without validating it against a **registered allowlist with exact string matching** (not prefix/suffix), an attacker can intercept the authorization code:

```php
// Dangerous
$callbackUri = $_GET['redirect_uri'];
header('Location: ' . $callbackUri . '?code=' . $authCode);
```

OAuth specs require redirect URIs to be registered in advance and matched exactly. Any deviation must fail the flow entirely:

```php
$registeredCallbacks = [
    'https://yoursite.com/oauth/callback',
    'https://yoursite.com/oauth/mobile/callback',
];

$callbackUri = $_GET['redirect_uri'] ?? '';
if (!in_array($callbackUri, $registeredCallbacks, true)) {
    http_response_code(400);
    die('Invalid redirect URI.');
}
```

## Checklist (plain PHP)

- Never pass `$_GET`/`$_POST` values directly to `header('Location: ...')`.
- Prefer a whitelist of destinations mapped by key.
- If accepting user paths: must start with `/`, no scheme, no leading `//`.
- If allowing absolute URLs: scheme in `{http, https}` **and** host exactly matches your domain or a confirmed subdomain.
- Always fall back to a known-safe default when validation fails.
- Never blacklist specific domains.

## References

- [Open Redirect Vulnerabilities in PHP and Laravel — When Your Own Domain Becomes the Attack](https://dev.to/kriosa/open-redirect-vulnerabilities-in-php-and-laravel-when-your-own-domain-becomes-the-attack-43cf) (article 17 of a PHP/Laravel application-security series)
- [Snyk: How to prevent open redirect vulnerabilities in Laravel](https://snyk.io/blog/how-to-prevent-open-redirect-vulnerabilities-in-laravel/) — independent corroboration of the same mitigation hierarchy (fixed redirects > destination whitelisting > disallowing external domains), plus a worked vulnerable-app demo

## Related
- [[explanation-lm-studio-bionic-shell-judge-auto-review]]
- [[explanation-ssl-tls-three-jobs]]
- [[explanation-llm-inference-engine-exploits]]
