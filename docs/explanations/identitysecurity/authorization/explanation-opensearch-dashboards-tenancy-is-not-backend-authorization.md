---
title: OpenSearch Dashboards Tenancy Is a Presentation Boundary, Not Backend Authorization
diataxis: Explanation
domain: identity-security
topic: authorization
source: DEV.to Tech News
source_url: https://dev.to/bianliang/opensearch-dashboards-tenancy-is-not-backend-authorization-1ip
date: 2026-11-21
keywords:
- knowledge-base
- authorization
- identity-security
- explanations
---
# OpenSearch Dashboards Tenancy Is a Presentation Boundary, Not Backend Authorization

Multi-tenancy in OpenSearch Dashboards *looks* like a security boundary: users see saved objects
only in the global tenant, their private tenant, or custom tenants assigned through roles. The
mental model that breaks deployments is treating that UI separation as the security model. It is
not. **Every saved object and every query still travels through the Dashboards server identity to
the OpenSearch cluster** — the tenant only organizes saved work; the cluster's role model decides
what data can actually be read.

## The two controls, separated

| Control | Where it lives | What it governs |
| --- | --- | --- |
| Tenancy (`securitytenant` header, tenant selector) | Dashboards front end | Visibility of saved objects (dashboards, index patterns) |
| Roles, DLS, FLS | OpenSearch cluster backend | Which indices/documents/fields a user identity may read |

The `securitytenant` header is *context information*, not an authorization grant. Dashboards must be
configured to forward it to OpenSearch alongside the standard `Authorization` header — but even a
correctly forwarded tenant header does not replace a role mapping that allows reading the underlying
index. Tenant names also appear in URLs, which invites exactly the wrong test: "change the tenant
parameter and see what leaks". The backend must reject that request even when the caller knows the
target tenant's name.

## The over-privileged Dashboards server account

The second classic mistake: the Dashboards **server user** needs enough access to write saved
objects and perform routine discovery. If that same account can also **read every index and change
security configuration**, then any front-end flaw or proxy trust mistake silently becomes
cluster-wide access. The control is simple to state and rarely enforced: **keep the server identity
narrow, keep human identities separate**.

## Verifying the boundary independently

The article's core operational advice is to test each layer with the credentials real users get,
never assuming the outer login is sufficient:

1. Call the **security account information endpoint** with a test user — confirm effective roles.
2. Read a tenant assigned to the user, then attempt a tenant **not** assigned — the backend must
   reject it.
3. **Query each protected index directly** via the REST API with the same backend credentials —
   an analyst who cannot see an index pattern in a tenant may still reach it via the REST API,
   a client certificate, or another proxy path.
4. Repeat every check through **each public ingress path**. If a dashboard is embedded in another
   portal, test the identity that portal forwards — the outer SSO login says nothing about what
   the cluster sees.
5. Review **document-level security (DLS)** and **field-level security (FLS)** separately from
   tenant access: a user with access to a custom tenant must not automatically gain access to
   every index referenced by a dashboard saved there.

## Hygiene for the default tenant

If `global` is the default and broadly available, teams publish dashboards and index patterns there
without understanding the audience. Set the default deliberately, disable ownerless tenants, and
make custom tenants part of the periodic access review — the same process that reviews role
grants.

## Takeaway

Tenant selector and cluster roles are **related controls, neither a substitute for the other**.
Design rule: treat multi-tenancy as a presentation and collaboration boundary, and make every
authorization decision (index, document, field, tenant membership) in the backend role model, then
verify it out-of-band at the API edge.

## References

- [Original article (dev.to, bianliang)](https://dev.to/bianliang/opensearch-dashboards-tenancy-is-not-backend-authorization-1ip)
- [OpenSearch Dashboards multi-tenancy](https://docs.opensearch.org/latest/security/multi-tenancy/)
- [OpenSearch multi-tenancy configuration](https://docs.opensearch.org/latest/security/multi-tenancy/multi-tenancy-config/)
- [OpenSearch Dashboards information API](https://docs.opensearch.org/latest/security/api/dashboards-info/)
- [OpenSearch security best practices](https://docs.opensearch.org/latest/security/configuration/best-practices/)
