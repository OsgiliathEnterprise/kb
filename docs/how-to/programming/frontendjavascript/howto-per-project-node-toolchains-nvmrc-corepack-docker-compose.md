---
title: 'Per-Project Node Toolchains for Freelancers: .nvmrc, Corepack, and Docker
  Compose'
diataxis: How-to Guide
domain: programming
topic: frontend-javascript
source: DEV.to Tech News
source_url: https://dev.to/abidali671/five-clients-five-node-versions-per-project-toolchains-with-nvmrc-corepack-and-docker-compose-g7n
date: 2026-10-21
keywords:
- knowledge-base
- frontend-javascript
- programming
- how-to
---
# Per-Project Node Toolchains for Freelancers: .nvmrc, Corepack, and Docker Compose

Freelancing means living in several codebases at once, each pinned (or not) to different Node versions, package managers, and databases — all wanting port 5432/3306 on your laptop. The goal: switching between client projects is a `cd` and nothing else — the right Node version, package manager, and database are picked up automatically from files in the repo.

## Rule one: the repo describes its own toolchain

Three small files do most of the work:

```
client-project/
  .nvmrc                 # Node version
  package.json           # "packageManager" and "engines"
  compose.yaml           # local databases and services
```

Nothing about a project lives only in your head or on your machine.

## Pin the Node version with `.nvmrc`

A one-line file that version managers read:

```
20
```

Pin the major version for most client work — specific enough to avoid surprises, loose enough to pick up security patches (pin an exact version like `20.18.1` when a project genuinely needs it).

With **fnm** (fast, auto-switches on directory change) in `~/.zshrc` or `~/.bashrc`:

```bash
eval "$(fnm env --use-on-cd --version-file-strategy=recursive)"
```

Now `cd ~/work/clients/acme/api` switches to whatever that project's `.nvmrc` says; if the version isn't installed, `fnm install` inside the folder reads the same file and fetches it. nvm has an equivalent documented shell hook that calls `nvm use` when a `.nvmrc` is present (slower, same principle).

Also declare the version in `package.json` so tools and CI can see it:

```json
{ "engines": { "node": ">=20 <21" } }
```

By default npm only *warns* on `engines` mismatch. For a hard stop, add `engine-strict=true` to the project's `.npmrc` — the author uses it on older client projects where a newer Node genuinely breaks things, and leaves it off on modern ones.

## Pin the package manager with `packageManager`

```json
{ "packageManager": "pnpm@9.15.0" }
```

**Corepack** reads this field and runs that exact version when you type `pnpm` or `yarn` inside the project. Corepack ships with Node but is disabled by default on most current versions:

```bash
corepack enable
```

Caveat: Corepack's place in Node has changed — the Node.js TSC voted to **stop distributing Corepack with future Node.js releases (25+)**; it remains bundled (experimental) through Node 24. If `corepack` isn't found, `npm install -g corepack` and carry on; the `packageManager` field works either way, but on Node 25+ the global install becomes the default path.

Optional guard against using the wrong tool (only on repos you own or where the client agrees):

```json
{ "scripts": { "preinstall": "npx only-allow pnpm" } }
```

## Databases per project with Docker Compose

Give each project its own Compose **name** and its own ports:

```yaml
# compose.yaml
name: acme-api

services:
  db:
    image: postgres:16
    environment:
      POSTGRES_USER: acme
      POSTGRES_PASSWORD: acme_local_only
      POSTGRES_DB: acme
    ports:
      - "127.0.0.1:54321:5432"
    volumes:
      - db-data:/var/lib/postgresql/data

volumes:
  db-data:
```

Details that make this painless across many clients:

- **`name:` at the top** sets the Compose project name. Without it the name comes from the folder, and two folders called `api` from different clients would share containers and volumes.
- **A unique host port per project** — keep a small table in your notes (`acme 54321`, `northwind 54322`, ...) so two projects can run at once without fighting over 5432.
- **Bind to `127.0.0.1`** — the database is for you, not for everyone on the café Wi-Fi.
- **Obviously-local passwords** (`acme_local_only` can never be mistaken for a real credential); real credentials stay out of the repo entirely.

The project's `.env.example` points at the right port:

```
DATABASE_URL=postgres://acme:***@localhost:54321/acme
```

Starting and stopping is per project:

```bash
docker compose up -d      # start this client's services
docker compose down       # stop them, volumes survive
```

## Result

Switching clients is: `cd` (fnm picks up `.nvmrc`), `pnpm` (Corepack picks up `packageManager`), `docker compose up -d` (named project, unique port). The repo answers "which Node / which package manager / which database" — your head doesn't have to.

## References

- [Five Clients, Five Node Versions: Per-Project Toolchains with .nvmrc, Corepack and Docker Compose (DEV.to)](https://dev.to/abidali671/five-clients-five-node-versions-per-project-toolchains-with-nvmrc-corepack-and-docker-compose-g7n)
- [fnm (Rust-based Node version manager)](https://github.com/Schniz/fnm)
- [Corepack](https://nodejs.org/api/corepack.html)
- [Node.js TSC votes to stop distributing Corepack (Socket.dev) — removal from Node 25+, `npm i -g corepack` becomes the default install path](https://socket.dev/blog/node-js-tsc-votes-to-stop-distributing-corepack)
