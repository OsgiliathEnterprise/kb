---
title: 'Row-Level Security: Making Authorization a Property of the Data, Not a Habit
  of the Code'
diataxis: Explanation
domain: identity-security
topic: authorization
source: DEV.to Tech News
source_url: https://dev.to/kstriabintang/access-control-belongs-in-the-database-not-the-ui-al3
date: 2026-11-06
keywords:
- knowledge-base
- authorization
- identity-security
- explanations
---
# Row-Level Security: Making Authorization a Property of the Data, Not a Habit of the Code

The most common access-control bug is mundane: the app **hides a button** and
the developer calls it done. The data is still one crafted request away. If
authorization only lives in the UI, it doesn't exist. Pushing enforcement
into the database with Postgres **row-level security (RLS)** flips the model:

> **Authorization becomes a property of the data, not a habit of the code.**

## What RLS actually does

With RLS enabled, a table simply does not return rows the current role/user
isn't allowed to see — *even if the query explicitly asks for them*. The
policy is attached to the table, so it holds no matter which screen,
endpoint, or ad-hoc query does the asking (student sees own grades, lecturer
sees their classes, admin sees the registry). Two consequences:

- **New endpoints inherit the guarantee for free** — enforcement is not a
  `WHERE` clause you must remember in every handler.
- **A forgotten filter cannot leak anything** — the database refuses.

## Two lessons from production use

1. **RLS has a performance cost — design for it.** Policies are evaluated
   *per row*. A real Supabase slowdown traced directly to missing indexes
   combined with per-row policy evaluation; it was fixed with well-chosen
   indexes plus a policy rewrite. Treat the policy like the hot path it is:
   RLS is not free, but it is optimisable.
2. **Roles and regions compose.** Real orgs aren't "admin vs user" — access
   is role **and** scope (region, class, site). Model that composition inside
   the policy rather than in scattered app logic, and it stays consistent as
   the app grows.

## The other half: records that refuse to lie

Access control governs who can read/write; integrity governs whether writes
can be quietly rewritten later. For attendance/approval records the pattern is
an **append-only audit trail enforced at the database level**: Postgres
triggers reject `UPDATE` and `DELETE` on those tables. The application can add
facts; it cannot edit history. When payroll or a dispute depends on the
records, "trust me, nobody changed it" isn't good enough — the database
guarantees it.

## The principle

Hiding a control is UX. Enforcing access in the database is security. Do the
second one, index the policies properly, and back it with records the
application isn't allowed to alter — the guarantee then holds no matter what
the front end does.

Practical sketch (canonical Postgres form):

```sql
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;

CREATE POLICY student_sees_own_grades ON grades
  FOR SELECT
  USING (student_id = current_setting('app.user_id')::uuid);

-- append-only audit trail
CREATE TRIGGER grades_no_mutation
  BEFORE UPDATE OR DELETE ON grades
  FOR EACH ROW EXECUTE FUNCTION reject_mutation();
```

Caveats worth remembering: RLS policies apply to non-superuser roles (BYPASSRLS
roles and table owners bypass them unless `FORCE ROW LEVEL SECURITY`), so the
application must connect as a scoped role, not the owner.

## Related notes

- `explanation-authz-models-ubac-rbac-abac-pbac.md` — RLS policies are
  effectively PBAC/ABAC enforced at the storage layer.
- `../secure-coding/` — the app-side half of defense-in-depth.

## References

- **Access control belongs in the database, not the UI (DEV.to, K. Striabintang)**: [https://dev.to/kstriabintang/access-control-belongs-in-the-database-not-the-ui-al3](https://dev.to/kstriabintang/access-control-belongs-in-the-database-not-the-ui-al3)
- **PostgreSQL Row Security (official docs)**: [https://www.postgresql.org/docs/current/ddl-rowsecurity.html](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
