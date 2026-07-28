---
title: 'JWT, OAuth2, OIDC, and PKCE: Complete Authentication Flow Guide'
diataxis: How-to Guide
domain: Software-Engineering
topic: API-Design
source: DEV.to
source_url: https://dev.to/newavtar/jwt-oauth2-oidc-pkce-complete-small-guide-4j91
date: 2026-07-28
keywords:
- knowledge-base
- API-Design
- Software-Engineering
- how-to
---
# JWT, OAuth2, OIDC, and PKCE: Complete Authentication Flow Guide

## Overview

A comprehensive walkthrough of modern web authentication covering JWT token structure and validation, OAuth2 authorization flows, OpenID Connect identity layering, and PKCE security for single-page applications.

## Authentication Fundamentals

Every secure application answers two questions:

- **Authentication**: "Who are you?" — verifying identity through credentials (username/password, MFA)
- **Authorization**: "What are you allowed to do?" — determining permissions (roles, scopes)

Authentication always precedes authorization.

## Session-Based vs. JWT Authentication

### Traditional Session Authentication (Stateful)

The server stores session state and issues a session ID cookie:

```
User logs in → Server creates session ID → Stores in database/memory → Returns cookie
Every request → Browser sends cookie → Server looks up session → Grants access
```

**Problems with sessions:**
- Server must maintain state (database or shared cache)
- Scaling requires sticky sessions or shared session storage across servers
- Load balancer routing complexity

### JWT Authentication (Stateless)

JWT (JSON Web Token) embeds user information directly in the token, eliminating server-side session storage.

## JWT Structure

A JWT consists of three Base64URL-encoded parts separated by dots:

```
HEADER.PAYLOAD.SIGNATURE
```

### Header

Contains metadata about the token:

```json
{
  "alg": "RS256",
  "typ": "JWT"
}
```

Common algorithms: `HS256` (symmetric), `RS256` (asymmetric RSA), `ES256` (ECDSA).

### Payload (Claims)

Contains assertions about the user:

```json
{
  "sub": "12345",
  "name": "User Name",
  "role": "ADMIN",
  "exp": 1788888888,
  "iat": 1788885288,
  "iss": "https://okta.com/oauth2/default"
}
```

| Standard Claim | Meaning |
|---|---|
| `sub` | Subject (user identifier) |
| `iss` | Issuer (authorization server) |
| `exp` | Expiration time (Unix timestamp) |
| `iat` | Issued at (Unix timestamp) |
| `aud` | Audience (intended recipient) |

**Critical security rule**: JWT payloads are Base64-encoded, not encrypted. Never store passwords, credit cards, or secrets in a JWT payload.

### Signature

Proves the token was created by a trusted issuer and was not tampered with:

```
Signature = Sign(Header + Payload, Private Key)
```

## Asymmetric Key Cryptography for JWT

- **Private key**: Kept secret by the authorization server (e.g., Okta). Used to sign JWTs.
- **Public key**: Shared with resource servers (e.g., Spring Boot API). Used to verify JWT signatures.

```
Okta (Private Key) → Signs JWT
Spring Boot (Public Key) → Verifies JWT
```

## JWT Validation Process

When a client sends a request with `Authorization: Bearer JWT_TOKEN`:

1. **Signature validation**: Verify the token was signed by the trusted issuer using the public key
2. **Expiration check**: Ensure `exp` claim is in the future
3. **Claims validation**: Check roles, scopes, or other claims for authorization decisions

## Token Lifecycle: Access and Refresh Tokens

Short-lived access tokens reduce the window of exposure if compromised:

| Token Type | Lifetime | Purpose |
|---|---|---|
| Access Token | 5–60 minutes | API authentication |
| Refresh Token | Days/weeks | Obtain new access tokens |

**Flow when access token expires:**
```
Access Token expires → Use Refresh Token → Authorization Server → New Access Token
```

## OAuth2 and JWT Relationship

OAuth2 defines **how to get access** (the authorization flow). JWT defines **how to represent the token** (the token format). They work together but are independent standards.

### OAuth2 Components

| Component | Role | Example |
|---|---|---|
| Resource Owner | The user | Human user |
| Client | Application requesting access | Angular SPA, mobile app |
| Authorization Server | Issues tokens | Okta, Auth0, Azure AD, Google |
| Resource Server | Protects API resources | Spring Boot REST API |

## Production OAuth2 Flow with Angular + Spring Boot + Okta

### Phase 1: Backend Startup

Spring Boot auto-configures from the issuer URI:

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: https://okta.com/oauth2/default
```

Spring fetches `/.well-known/openid-configuration` to learn:
- Authorization endpoint
- Token endpoint
- JWKS URI (public keys for verification)

### Phase 2–3: User Login and Authentication

1. Angular app detects no valid token → redirects to Okta login
2. User enters credentials on Okta (password never touches your servers)
3. Okta authenticates the user

### Phase 4: Authorization Code Grant

Okta returns an authorization code to the redirect URI:

```
https://myapp.com/callback?code=abc123
```

### Phase 5: Token Exchange

Angular exchanges the authorization code directly with Okta's token endpoint for access and ID tokens.

### Phase 6: API Access

Angular sends JWT in `Authorization: Bearer` header to Spring Boot API. Spring validates the signature and claims.

## PKCE (Proof Key for Code Exchange)

PKCE prevents authorization code interception attacks, critical for SPAs and mobile apps where the client secret cannot be kept confidential.

### How PKCE Works

1. **Client generates a code verifier** (random string, 43–128 characters)
2. **Client computes code challenge** = `BASE64URL(SHA256(code_verifier))`
3. **Authorization request includes code challenge** (not the verifier)
4. **After receiving authorization code**, client sends the original code verifier with the token request
5. **Authorization server verifies** that the code verifier produces the same challenge

```
Client: Generate verifier → Compute challenge → Send challenge to auth server
Auth Server: Receive code + verifier → Recompute challenge → Match? Issue tokens
```

**PKCE is mandatory for public clients** (SPAs, mobile apps) and recommended for all OAuth2 flows.

### Storage Strategies for Tokens in SPAs

| Storage Method | XSS Risk | CSRF Risk | Recommendation |
|---|---|---|---|
| `localStorage` | High | None | Avoid for tokens |
| `sessionStorage` | High | None | Better than localStorage |
| `HttpOnly cookies` | Low | High (mitigate with SameSite) | Preferred for refresh tokens |

**Best practice**: Store access tokens in memory (JavaScript variable) and refresh tokens in `HttpOnly`, `Secure`, `SameSite=Strict` cookies.

## Key Security Takeaways

1. **Use short-lived access tokens** (5–15 minutes) with refresh token rotation
2. **Always use PKCE** for SPA and mobile application flows
3. **Validate JWT signatures** using the authorization server's public key from JWKS
4. **Never store sensitive data** in JWT payloads (they are not encrypted)
5. **Use `HttpOnly` cookies** for token storage when possible
6. **Implement token revocation** mechanisms for compromised sessions
7. **Always enforce HTTPS** to protect tokens in transit

## References

- [Original DEV.to Article](https://dev.to/newavtar/jwt-oauth2-oidc-pkce-complete-small-guide-4j91)
- [OAuth 2.0 Specification (RFC 6749)](https://datatracker.ietf.org/doc/html/rfc6749)
- [PKCE Specification (RFC 7636)](https://datatracker.ietf.org/doc/html/rfc7636)
- [JWT Specification (RFC 7519)](https://datatracker.ietf.org/doc/html/rfc7519)
- [Okta Developer Documentation](https://developer.okta.com/)
