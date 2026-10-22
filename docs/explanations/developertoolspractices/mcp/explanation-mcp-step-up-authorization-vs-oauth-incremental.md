---
title: MCP Step-Up Authorization vs OAuth Incremental Authorization — What Actually
  Changes (Measured on Cloudflare)
diataxis: Explanation
domain: developer-tools-practices
topic: mcp
source: DEV.to Tech News
source_url: https://dev.to/tanahiro2010/mcp-step-up-authorization-vs-oauth-incremental-authorization-what-actually-changes-2a3j
date: 2026-10-22
keywords:
- knowledge-base
- mcp
- developer-tools-practices
- explanations
---
# MCP Step-Up Authorization vs OAuth Incremental Authorization — What Actually Changes (Measured on Cloudflare)

MCP's step-up authorization flow and Google OAuth's incremental authorization look almost identical on paper — "client has some scopes, needs more, gets them without re-consent" — but they differ in three concrete ways: **who notices** (the app vs the resource server), **how it's communicated** (not at all vs `WWW-Authenticate`), and **who remembers** (`include_granted_scopes=true` server-side vs the client building the scope union).

Cloudflare rolled out MCP step-up across three waves: **Aug 22, 2026** (optional scopes in the Wrangler MCP config), **Oct 1, 2026** (`insufficientScope()` in `workers-oauth-provider` v1), and **Oct 19, 2026** (step-up in the API MCP server itself). Measuring live requests against Cloudflare's API MCP Server (128 requests) makes the differences concrete.

## The three ways they differ

| Dimension | Google incremental authorization | MCP step-up |
|---|---|---|
| Who notices the gap | The app (it knows what it asked for) | The resource server (only it knows the token is missing a scope) |
| How the gap is communicated | Not at all — the app just re-authenticates | `WWW-Authenticate: Bearer error="insufficient_scope", scope="..."` (RFC 6750 §3.1, a 2012 error code repurposed by MCP) |
| Who carries forward the old scopes | The authorization server (`include_granted_scopes=true` on the auth request) | The client — it computes the union of its current scopes and the challenge's scopes |

The third row is the load-bearing one, and it changed mid-stream.

## The spec history (two revisions, one broken one)

- The step-up flow section exists in the **2025-11-25** MCP spec. It did not exist before **2025-06-18** (the revision that introduced the OAuth 2.1 + Resource Indicators + dynamic client registration base).
- **2025-11-25**: the *server* creates the union, with three options — `Minimum`, `Recommended` (baseline + granted + missing), `Extended`.
- **2026-07-28** ([specification section](https://modelcontextprotocol.io/specification/2026-07-28/authorization)): the *client* creates the union — `scope = union(current scopes, challenge scope)`, re-authenticate with that, retry the failed call. [Issue #2349](https://github.com/modelcontextprotocol/modelcontextprotocol/issues/2349) argued this contradicts the RFCs, is impossible for stateless authorization servers, and creates infinite retry loops; [TypeScript SDK issue #1582](https://github.com/modelcontextprotocol/typescript-sdk/issues/1582) showed the loop in practice.

## Measured behavior on Cloudflare's API MCP Server (128 live requests)

Five findings, from actual traffic (full logs in the [test repository](https://github.com/tanahiro2010/cloudflare-mcp-step-up-auth-test)):

1. **More scopes granted than requested.** Asked for `user:read workers:read`; got 3 scopes including `offline_access`, which the server labels *REQUIRED* ("Background Access").
2. **The challenge scope includes baseline + token scopes**, not just the missing ones — the 2025-11-25 "Recommended" approach. The 2026-07-28 spec removed baseline and granted-scope echoes from the challenge.
3. **The authorization server does not carry over previously granted scopes on its own.** Re-authenticating with `user:read account:read workers-r2.read` (no `workers-d1.read`) returned exactly that union — `d1.read` was gone. The client-side union is the *only* mechanism that preserves granted scopes.
4. **Inconsistent server behavior.** Some operations returned the expected `403 insufficient_scope` challenge; others returned `200` with an empty list instead of a challenge (reported to Cloudflare, fixed the same day).
5. **Older clients keep working by accident.** sdk@1.32.1 overwrites `_scope` with the challenge scope, so the retry request's token scope is just the challenge scope. It still works because the server echoes the full union — a fragile property that a spec-compliant 2026-07-28 server (challenge = missing scopes only) would break.

The baseline scope set is effectively `user:read account:read` plus `offline_access`.

## The two metadata endpoints (and their scope lists)

Two different metadata documents advertise two different scope sets:

```bash
# Protected resource metadata (RFC 9728) — 2 scopes: user:read, account:read
curl https://api.cloudflare.com/client/v4/mcps/_metadata/protected-resource

# Authorization server metadata (RFC 8414) — 384 scopes, the full API catalog
curl https://api.cloudflare.com/client/v4/mcps/_metadata/authorization-server
```

Plus dynamic client registration (public client, no client secret):

```bash
curl -X POST https://api.cloudflare.com/client/v4/mcps/_metadata/registration \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"client_name": "test", "redirect_uris": ["https://example.com/callback"]}'
```

## The step-up flow in practice

```bash
# 1. Normal request → 403 with challenge
curl https://api.cloudflare.com/client/v4/mcps/_metadata/mcp \
  -H "Authorization: Bearer $TOKEN" -X POST \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_r2_buckets"}}'
# → 403, WWW-Authenticate: Bearer error="insufficient_scope",
#    scope="user:read account:read workers-r2:read"

# 2. Re-authenticate with the union of current + challenge scopes
#    (authorization-code flow, no new consent screen needed)

# 3. Retry the original request with the new token → success
```

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "s1",
      "type": "rectangle",
      "x": 40,
      "y": 80,
      "width": 200,
      "height": 70,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#a5d8ff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "seed": 301,
      "versionNonce": 301,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 3},
      "updated": 1760000000000
    },
    {
      "id": "s1t",
      "type": "text",
      "x": 55,
      "y": 97,
      "width": 170,
      "height": 40,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "seed": 302,
      "versionNonce": 302,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "updated": 1760000000000,
      "text": "MCP client\\n(token scope: user:read,\\nworkers:read)",
      "fontSize": 14,
      "fontFamily": 2,
      "textAlign": "left",
      "verticalAlign": "top",
      "baseline": 36,
      "containerId": null,
      "originalText": "MCP client\\n(token scope: user:read,\\nworkers:read)",
      "lineHeight": 1.25
    },
    {
      "id": "s2",
      "type": "rectangle",
      "x": 320,
      "y": 80,
      "width": 200,
      "height": 70,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#ffc9c9",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "seed": 303,
      "versionNonce": 303,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 3},
      "updated": 1760000000000
    },
    {
      "id": "s2t",
      "type": "text",
      "x": 335,
      "y": 97,
      "width": 170,
      "height": 40,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "seed": 304,
      "versionNonce": 304,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "updated": 1760000000000,
      "text": "403 insufficient_scope\\nWWW-Authenticate:\\nscope=baseline+missing",
      "fontSize": 14,
      "fontFamily": 2,
      "textAlign": "left",
      "verticalAlign": "top",
      "baseline": 36,
      "containerId": null,
      "originalText": "403 insufficient_scope\\nWWW-Authenticate:\\nscope=baseline+missing",
      "lineHeight": 1.25
    },
    {
      "id": "s3",
      "type": "rectangle",
      "x": 600,
      "y": 80,
      "width": 200,
      "height": 70,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#ffec99",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "seed": 305,
      "versionNonce": 305,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 3},
      "updated": 1760000000000
    },
    {
      "id": "s3t",
      "type": "text",
      "x": 615,
      "y": 97,
      "width": 170,
      "height": 40,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "seed": 306,
      "versionNonce": 306,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "updated": 1760000000000,
      "text": "Client unions scopes\\n(current ∪ challenge)\\nre-auth via code flow",
      "fontSize": 14,
      "fontFamily": 2,
      "textAlign": "left",
      "verticalAlign": "top",
      "baseline": 36,
      "containerId": null,
      "originalText": "Client unions scopes\\n(current ∪ challenge)\\nre-auth via code flow",
      "lineHeight": 1.25
    },
    {
      "id": "s4",
      "type": "rectangle",
      "x": 320,
      "y": 240,
      "width": 200,
      "height": 70,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#d3f9d8",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "seed": 307,
      "versionNonce": 307,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 3},
      "updated": 1760000000000
    },
    {
      "id": "s4t",
      "type": "text",
      "x": 335,
      "y": 257,
      "width": 170,
      "height": 40,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "seed": 308,
      "versionNonce": 308,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "updated": 1760000000000,
      "text": "Retry original call\\nwith union-scoped token\\n→ 200",
      "fontSize": 14,
      "fontFamily": 2,
      "textAlign": "left",
      "verticalAlign": "top",
      "baseline": 36,
      "containerId": null,
      "originalText": "Retry original call\\nwith union-scoped token\\n→ 200",
      "lineHeight": 1.25
    },
    {
      "id": "sa1",
      "type": "arrow",
      "x": 240,
      "y": 115,
      "width": 80,
      "height": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "seed": 309,
      "versionNonce": 309,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 2},
      "updated": 1760000000000,
      "points": [[0, 0], [80, 0]],
      "lastCommittedPoint": null,
      "startBinding": null,
      "endBinding": null,
      "startArrowhead": null,
      "endArrowhead": "arrow"
    },
    {
      "id": "sa1l",
      "type": "text",
      "x": 245,
      "y": 85,
      "width": 70,
      "height": 16,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "seed": 310,
      "versionNonce": 310,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "updated": 1760000000000,
      "text": "tool call",
      "fontSize": 14,
      "fontFamily": 2,
      "textAlign": "left",
      "verticalAlign": "top",
      "baseline": 36,
      "containerId": null,
      "originalText": "tool call",
      "lineHeight": 1.25
    },
    {
      "id": "sa2",
      "type": "arrow",
      "x": 520,
      "y": 115,
      "width": 80,
      "height": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "seed": 311,
      "versionNonce": 311,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 2},
      "updated": 1760000000000,
      "points": [[0, 0], [80, 0]],
      "lastCommittedPoint": null,
      "startBinding": null,
      "endBinding": null,
      "startArrowhead": null,
      "endArrowhead": "arrow"
    },
    {
      "id": "sa3",
      "type": "arrow",
      "x": 700,
      "y": 150,
      "width": 0,
      "height": 90,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "seed": 312,
      "versionNonce": 312,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 2},
      "updated": 1760000000000,
      "points": [[0, 0], [0, 90]],
      "lastCommittedPoint": null,
      "startBinding": null,
      "endBinding": null,
      "startArrowhead": null,
      "endArrowhead": "arrow"
    },
    {
      "id": "sa4",
      "type": "arrow",
      "x": 320,
      "y": 275,
      "width": -80,
      "height": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "seed": 313,
      "versionNonce": 313,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 2},
      "updated": 1760000000000,
      "points": [[0, 0], [-80, 0]],
      "lastCommittedPoint": null,
      "startBinding": null,
      "endBinding": null,
      "startArrowhead": null,
      "endArrowhead": "arrow"
    },
    {
      "id": "s5",
      "type": "rectangle",
      "x": 40,
      "y": 340,
      "width": 760,
      "height": 90,
      "strokeColor": "#868e96",
      "backgroundColor": "#e9ecef",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "seed": 314,
      "versionNonce": 314,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 3},
      "updated": 1760000000000
    },
    {
      "id": "s5t",
      "type": "text",
      "x": 55,
      "y": 355,
      "width": 730,
      "height": 60,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "seed": 315,
      "versionNonce": 315,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "updated": 1760000000000,
      "text": "Google incremental auth instead: app notices the gap itself (no WWW-Authenticate),\\nre-authenticates with include_granted_scopes=true, the AUTHORIZATION SERVER carries\\nold scopes forward. MCP 2026-07-28: client computes the union — a stateless\\nserver cannot do it (issue #2349).",
      "fontSize": 14,
      "fontFamily": 2,
      "textAlign": "left",
      "verticalAlign": "top",
      "baseline": 36,
      "containerId": null,
      "originalText": "Google incremental auth instead: app notices the gap itself (no WWW-Authenticate),\\nre-authenticates with include_granted_scopes=true, the AUTHORIZATION SERVER carries\\nold scopes forward. MCP 2026-07-28: client computes the union — a stateless\\nserver cannot do it (issue #2349).",
      "lineHeight": 1.25
    }
  ],
  "appState": {
    "gridSize": null
  },
  "files": {}
}
```

## Design implications

- **If you're an MCP client**: implement the 2026-07-28 union behavior (parse `WWW-Authenticate`, merge scopes, re-auth, retry), and make the union computation explicit rather than letting the SDK overwrite your scope list — the Cloudflare server only works with sloppy clients today.
- **If you're an MCP server**: the 2025-11-25 "Recommended" behavior (challenge = baseline + granted + missing) is what real clients tolerate; the 2026-07-28 spec (challenge = missing only) breaks clients that don't remember their own scopes.
- **Consistency matters more than spec purity**: Cloudflare's own server returned `200` with an empty list instead of a `403` challenge on some operations during the rollout window. A missing scope must produce a *challenge*, not a silent empty result.
- **Scope catalogs diverge**: the RFC 9728 metadata advertises 2 scopes; the RFC 8414 metadata advertises 384. Clients planning step-up should read the authorization-server metadata, not the protected-resource one.

## References

- [MCP Step-Up Authorization vs. OAuth Incremental Authorization — What Actually Changes (DEV.to, original source)](https://dev.to/tanahiro2010/mcp-step-up-authorization-vs-oauth-incremental-authorization-what-actually-changes-2a3j)
- [Model Context Protocol Specification 2026-07-28 — Authorization section](https://modelcontextprotocol.io/specification/2026-07-28/authorization)
- [MCP issue #2349 — client-side scope union problems](https://github.com/modelcontextprotocol/modelcontextprotocol/issues/2349)
- [TypeScript SDK issue #1582 — retry loop demonstration](https://github.com/modelcontextprotocol/typescript-sdk/issues/1582)
- [RFC 6750 §3.1 — Bearer Token Usage, `insufficient_scope`](https://datatracker.ietf.org/doc/html/rfc6750)
- [Cloudflare MCP step-up test repository (128-request live measurement logs)](https://github.com/tanahiro2010/cloudflare-mcp-step-up-auth-test)
- Related KB note: [[MCP Protocol Era Downgrades — Why Your Server Silently Serves the Old Spec (2026-07-28)]] — the same spec revision, seen from the server side
