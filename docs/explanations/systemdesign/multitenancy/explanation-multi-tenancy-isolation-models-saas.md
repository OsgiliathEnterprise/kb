---
title: 'Multi-Tenancy in SaaS: Choosing Between Row-Level, Schema-per-Tenant, and
  Database-per-Tenant Isolation'
diataxis: Explanation
domain: system-design
topic: Multi-Tenancy
source: DEV.to Tech News
source_url: https://dev.to/macrogenltd/multi-tenancy-in-saas-the-architecture-decision-you-cant-undo-later-4l8c
date: 2026-09-25
keywords:
- knowledge-base
- Multi-Tenancy
- system-design
- explanations
---
# Multi-Tenancy in SaaS: Choosing Between Row-Level, Schema-per-Tenant, and Database-per-Tenant Isolation

Most early SaaS architecture decisions are reversible — wrong framework? Migrate. Wrong hosting? Move. The multi-tenancy model is the exception: once real customers and data sit in production, changing how tenant data is isolated becomes a genuinely expensive migration. If you haven't decided explicitly, you've already decided by default — usually the easiest thing to type, not what scales best.

## Option 1: Shared database, shared schema (row-level isolation)

All tenants in the same tables, distinguished by `tenant_id`:

```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  amount NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_invoices_tenant ON invoices(tenant_id);
```

- **Pros**: cheapest to run; one schema means simple migrations; cross-tenant analytics is a plain query.
- **Cons**: one missing `WHERE tenant_id = ?` is a headline-worthy data leak, not a minor bug.

The fix that makes this model safe: enforce isolation at the database level with Postgres **Row-Level Security** instead of trusting every developer to remember the filter:

```sql
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON invoices
  USING (tenant_id = current_setting('app.current_tenant')::uuid);
```

Set `app.current_tenant` from the authenticated session at request start. RLS is the difference between "safe shared-schema multi-tenancy" and "one code-review miss away from a very bad day."

## Option 2: Shared database, schema-per-tenant

Each tenant gets its own Postgres schema in one physical database (`CREATE SCHEMA tenant_acme;`).

- **Pros**: stronger isolation than row-level at similar cost; cleaner per-tenant backups and data export.
- **Cons**: migrations become a loop over every tenant schema (slow, error-prone past a few hundred tenants); connection pooling gets trickier with per-request schema switching.

Right call for B2B SaaS with tens to low-hundreds of larger customers — especially when compliance questionnaires ask about isolation: "each tenant has its own schema" is easier to explain than "we use a WHERE clause."

## Option 3: Database-per-tenant

Fully separate database (sometimes instance) per tenant.

- **Pros**: strongest short-of-infrastructure isolation; easiest for regulated industries; tenant deletion is one `DROP DATABASE` instead of a targeted deletion job you have to trust.
- **Cons**: expensive and operationally heavy — connections, monitoring, backups multiply per tenant; cross-tenant analytics needs a separate pipeline.

Common hybrid: standard tiers on shared-schema, enterprise/regulated tenants on database-per-tenant.

## Where MongoDB fits

For document-shaped high-volume data (activity feeds, config objects, event logs), pair Postgres (core transactional data) with Mongo using the same three patterns — `tenantId` field + index for shared collections, or separate collections/databases per tenant:

```js
db.events.createIndex({ tenantId: 1, createdAt: -1 });
db.events.find({ tenantId: currentTenant, createdAt: { $gte: startOfMonth } });
```

Same rule as Postgres: never trust application code alone to filter by tenant — build the check into a repository/query-builder layer that injects the tenant filter automatically.

## File storage is part of the decision too

If tenants upload files, namespace every object from day one:

```
s3://your-app-uploads/{tenant_id}/{resource_type}/{file_id}.pdf
```

Combine with per-tenant scoped IAM policies or server-side-generated presigned URLs (never client-side) so a tenant can only sign URLs under its own prefix. Retrofitting this after tenants have thousands of files in a flat structure is a painful migration — get it right before the first real customer uploads anything.

## Decision rules

- **MVP, unknown customer profile** → shared schema + RLS: cheapest, fast to build, and RLS closes off the scariest failure mode. Migrating specific large/compliance-sensitive tenants out later is far easier than switching the whole model after the fact.
- **Enterprise/regulated from day one** → design for schema-per-tenant or database-per-tenant from the start; retrofitting isolation with production data in place is a significantly bigger project.
- Regardless of model: put the safety net at the data layer (RLS / injected filters), namespace file storage by tenant, and revisit the decision explicitly when your customer base or compliance requirements change — not after an incident forces the conversation.

## References

- [DEV.to — Multi-Tenancy in SaaS: The Architecture Decision You Can't Undo Later](https://dev.to/macrogenltd/multi-tenancy-in-saas-the-architecture-decision-you-cant-undo-later-4l8c)
- [PostgreSQL — Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
