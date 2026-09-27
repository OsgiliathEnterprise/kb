---
title: How to Catch Silent Table Loss When Restoring Supabase Dumps with pg_restore
diataxis: How-to Guide
domain: programming
topic: databases
source: DEV.to Tech News
source_url: https://dev.to/superlede/pgrestore-finished-fine-one-of-my-tables-wasnt-there-2kaj
date: 2026-09-27
keywords:
- knowledge-base
- databases
- programming
- how-to
---
# How to Catch Silent Table Loss When Restoring Supabase Dumps with pg_restore

`pg_restore` by default **reports errors and carries on**. A dump of a Supabase schema restored into vanilla Postgres can finish "fine" while an entire table is missing: the `CREATE TABLE` for any column defaulting to `auth.uid()` fails (no `auth` schema in plain Postgres), the later `COPY` into that table fails too, and everything else restores normally. The exit code is non-zero either way — including for the harmless role/schema errors every Supabase restore produces — so most people learn to ignore it.

## Goal

Restore a Supabase dump into a throwaway sandbox without silently losing tables, and verify completeness in seconds.

## Steps

### 1. Reproduce the failure (two containers)

```bash
docker run -d --name src -e POSTGRES_PASSWORD=pw postgres:17
docker run -d --name rt  -e POSTGRES_PASSWORD=pw postgres:17
# wait a few seconds for both to start

docker exec -i src psql -U postgres <<'SQL'
create schema auth;
create function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
create table public.notes (id serial primary key, owner uuid default auth.uid(), body text);
insert into public.notes (body) select 'n' || g from generate_series(1, 500) g;
create table public.plain (id int);
insert into public.plain select generate_series(1, 100);
SQL

docker exec src pg_dump -U postgres --format=custom --schema=public -f /tmp/app.dump postgres
docker cp src:/tmp/app.dump . && docker cp app.dump rt:/tmp/app.dump

docker exec rt pg_restore -U postgres --no-owner --no-privileges -d postgres /tmp/app.dump
docker exec rt psql -U postgres -c "select to_regclass('public.notes'), (select count(*) from public.plain)"
```

Result: `plain` restored with all 100 rows; `notes` does not exist. The output contains the errors (`schema "auth" does not exist`, `relation "public.notes" does not exist`) but they are easy to wave through — anyone restoring Supabase dumps has learned to expect complaints about roles and schemas that only exist on Supabase, and the tempting rule "ignore everything mentioning auth" is exactly what hides this failure.

### 2. Stub the missing Supabase objects before restoring

```sql
create role anon;
create role authenticated;
create role service_role;
create schema auth;
create function auth.uid()   returns uuid  language sql stable as 'select null::uuid';
create function auth.role()  returns text  language sql stable as 'select null::text';
create function auth.email() returns text  language sql stable as 'select null::text';
create function auth.jwt()   returns jsonb language sql stable as 'select null::jsonb';
```

Run the same restore again and `notes` comes back with all 500 rows. The same failure mode hits functions whose *parameters* default to `auth.uid()` (e.g. `create function is_admin(p_user_id uuid default auth.uid())`) — that was the original strict-mode failure this came from.

Two details:

- **Do not create `auth.users`.** An empty users table makes every foreign key into it fail in a way that looks like your data is broken, when really the sandbox just lacks your users. Errors about `auth.users` are genuinely sandbox noise.
- **Change what you ignore.** The useful rule: errors about `auth.users` are expected; an error saying a role or an `auth` function doesn't exist means a stub is missing and something didn't restore.

### 3. Verify by counting, not by exit code

After any test restore, compare table counts and row counts of your two or three most important tables against production:

```sql
select count(*) from information_schema.tables where table_schema = 'public';
select count(*) from public.notes;
```

A restore that "worked" but is missing a table fails this check in five seconds. Don't rely on the exit code: `pg_restore` returns non-zero on any error, including the harmless ones every Supabase restore produces.

## References

- [pg_restore finished fine. One of my tables wasn't there (DEV.to)](https://dev.to/superlede/pgrestore-finished-fine-one-of-my-tables-wasnt-there-2kaj)
- [PostgreSQL Documentation: pg_restore](https://www.postgresql.org/docs/current/app-pgrestore.html)
