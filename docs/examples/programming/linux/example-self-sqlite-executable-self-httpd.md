---
title: 'Actually Queryable Executables: SELF Format and the self-httpd Web Server'
diataxis: Example
domain: programming
topic: linux
source: HackerNews
source_url: https://fzakaria.com/2026/08/24/actually-queryable-executables
date: 2026-08-26
keywords:
- knowledge-base
- linux
- programming
- examples
---
# Actually Queryable Executables: SELF Format and self-httpd

Farid Zakaria's **SELF** format makes an executable file a SQLite database.
Linux's `binfmt_misc` matches the file and runs a custom interpreter
(`self-exec`) that maps the rows of a `segments` table into memory, jumps to
the entry point, and then releases its SQLite connection — so the *program*
can open the same file it was launched from and query it. The killer property:
a running program can store its **state inside the file it is running from**,
transactionally. A single file then contains program + content + logs.

## How the process sees itself

When `binfmt_misc` matches, the kernel does not `execve` the file at all; it
execs the interpreter and hands it the path. `self-exec` passes `argv + 1`
through, so the program's `argv[0]` is the path of its own file:

```c
int main(int argc, char **argv) {
    sqlite3 *db;
    /* the file the kernel just executed */
    sqlite3_open(argv[0], &db);
    ...
}
```

(`/proc/self/exe` points at the interpreter while `binfmt_misc` is active, so
`argv[0]` is the handle to use. Recent kernel work on transparent
`binfmt_misc` will eventually make `/proc/self/exe` point at the original
file.)

## self-httpd: a web server that is its own database

The proof of concept is a three-table web server. Tables are created with DDL
against the executable after it is compiled; the site content is `INSERT`ed in:

```sql
CREATE TABLE routes  (path TEXT PRIMARY KEY, mime TEXT, body BLOB);
CREATE TABLE visits  (id INTEGER PRIMARY KEY, at TEXT, ua TEXT, path TEXT);
CREATE TABLE presses (id INTEGER PRIMARY KEY, at TEXT, button TEXT);
```

```bash
# ordinary ELF, then reified into rows
$ cc -O2 server.c -o server.elf $(pkg-config --libs sqlite3)
$ elf2self server.elf server
$ sqlite3 server < site/schema.sql
$ sqlite3 server "INSERT INTO routes VALUES ('/index.html', 'text/html', ...)"

# run it
$ ./server --journal wal 8080
self-httpd: serving 3 routes out of /srv/self/server
```

Visitor state lands in the *same* file:

```bash
$ curl -s -X POST -d press localhost:8080/api/press
{"presses":1,"button":"press"}
$ sqlite3 server 'SELECT id, at, button FROM presses'
1|2026-08-25 03:11:28|press
$ sqlite3 server 'SELECT count(*) AS n, path FROM visits GROUP BY path'
1|/
1|/api/press
```

Handlers are also rows — extending the server is an `INSERT`:

```sql
INSERT INTO handlers VALUES
  ('/api/busiest', 'SELECT path, count(*) FROM visits GROUP BY path
                    ORDER BY 2 DESC LIMIT 5');
```

## Redeploying is a data migration

Because program and data are one file, a redeploy is two `INSERT ... SELECT`
statements that carry the live state into the new build:

```sql
ATTACH '/srv/self/server' AS old;
INSERT INTO visits (at, ua, path) SELECT at, ua, path FROM old.visits;
INSERT INTO presses (at, button) SELECT at, button FROM old.presses;
```

Swap the file, restart, and the visitor log survives the new build. Deployment
becomes `scp` of a single file.

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "b1",
      "type": "rectangle",
      "x": 40,
      "y": 160,
      "width": 200,
      "height": 90,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#d9ccff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "binfmt_misc match\nruns self-exec", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "b2",
      "type": "rectangle",
      "x": 300,
      "y": 160,
      "width": 240,
      "height": 90,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#c4e0f2",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "self-exec maps segments table\njumps to entry point", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "b3",
      "type": "rectangle",
      "x": 600,
      "y": 160,
      "width": 240,
      "height": 90,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#d3f2d3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "program opens its own file\nsqlite3_open(argv[0])", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "b4",
      "type": "rectangle",
      "x": 600,
      "y": 320,
      "width": 240,
      "height": 90,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#f9e0a3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "same SQLite file holds:\nprogram + site + visits + presses", "fontSize": 14, "fontFamily": 1 }
    },
    [
      {
        "id": "a1",
        "type": "arrow",
        "x": 240,
        "y": 205,
        "width": 60,
        "height": 0,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [ [0, 0], [60, 0] ]
      }
    ],
    [
      {
        "id": "a2",
        "type": "arrow",
        "x": 540,
        "y": 205,
        "width": 60,
        "height": 0,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [ [0, 0], [60, 0] ]
      }
    ],
    [
      {
        "id": "a3",
        "type": "arrow",
        "x": 720,
        "y": 250,
        "width": 0,
        "height": 70,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [ [0, 0], [0, 70] ]
      }
    ]
  ],
  "appState": { "viewBackgroundColor": "#ffffff" }
}
```

## Caveats

- The project (`fzakaria/selfdb`) is explicitly half-baked and AI-assisted — a
  research exploration, not production software.
- The author credits Justine Tunney's **redbean** (webserver as a self-extracting
  Actually Portable Executable) as prior art; SELF differs by making the
  database itself the container and the handler layer.

## References

- [Farid Zakaria: Actually Queryable Executables](https://fzakaria.com/2026/08/24/actually-queryable-executables)
- [selfdb repository](https://github.com/fzakaria/selfdb)
- [redbean (prior art)](https://redbean.dev/)
- [Linux binfmt_misc documentation](https://docs.kernel.org/admin-guide/binfmt-misc.html)

## Related
- [[explanation-isolcpus-irq-affinity]]
- [[explanation-bpf-vs-logs-metrics-observability]]
- [[explanation-linux-containers-namespaces-cgroups]]
