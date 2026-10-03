---
title: How to Soak-Test Your MCP Server Before AI Agents Do It for You (mcpload)
diataxis: How-to Guide
domain: developer-tools-practices
topic: mcp
source: DEV.to Tech News
source_url: https://dev.to/atulmishra/how-to-soak-test-your-mcp-server-before-ai-agents-do-it-for-you-2jc3
date: 2026-10-03
keywords:
- knowledge-base
- mcp
- developer-tools-practices
- how-to
---
# How to Soak-Test Your MCP Server Before AI Agents Do It for You (mcpload)

Most MCP servers get tested the same way: connect one client, call a few tools by hand, ship it. Then real agents show up — dozens of sessions at once, three tool calls in parallel, sessions that never get closed. The failures don't look like crashes; they look like memory creeping up for hours, a p95 that slowly doubles, or `Session not found` errors that only appear once you run two replicas behind a load balancer.

This note walks through finding those problems on your own machine in under an hour using [mcpload](https://github.com/atul121001/mcpload), an open-source (Apache-2.0) load and soak tester for MCP servers built on [k6](https://k6.io/).

## What a "soak test" actually checks

A load test asks *how much can it take?* A soak test asks *does it stay healthy over time?* mcpload's soak run has three phases:

1. **Warm-up** — load ramps up; startup growth (caches, connection pools) is allowed here.
2. **Steady load** — a constant stream of agent sessions for 30 minutes.
3. **Cool-down** — no load for 5 minutes; memory should come back down.

A leak is flagged only if memory grows steadily during the load window (slope above a limit, with a good linear fit) **or** doesn't return near baseline during cool-down. "Memory went up" alone is not a leak — most servers grow a bit at startup, and treating that as a leak causes false alarms.

Each simulated agent does what a real one does: `initialize` → `tools/list` → 1–5 rounds of 3 parallel `tools/call` with think time → close the session.

## Step 1 — Install mcpload

Download the release for your platform from [GitHub Releases](https://github.com/atul121001/mcpload/releases/latest). Linux example:

```bash
curl -fL https://github.com/atul121001/mcpload/releases/download/v0.1.2/mcpload_0.1.2_linux_amd64.tar.gz | tar -xz
cd mcpload_0.1.2_linux_amd64
./mcpload version
```

Mac: use `darwin_arm64` (Apple silicon) or `darwin_amd64` (Intel). Windows: download the `.zip`. The folder contains the `mcpload` CLI, a `k6` binary with MCP support built in, and bundled test scenarios.

## Step 2 — Start the server in Docker

Running the server in a container gives it fixed resources and lets mcpload read its memory from Docker:

```bash
docker run -d --name mcp-under-test -p 127.0.0.1:5101:5101 -e PORT=5101 \
  --cpus 2 --memory 1g \
  node:22-slim npx -y @modelcontextprotocol/server-everything@2026.8.31 streamableHttp
```

Wait until `docker logs mcp-under-test` shows `listening on port 5101`. The example uses the official MCP reference server, `server-everything`.

## Step 3 — A one-minute smoke test

```bash
./mcpload run --url http://localhost:5101/mcp --duration 1m \
  --env 'TOOL_MIX={"echo":3,"get-sum":2,"get-tiny-image":1}' \
  --env 'TOOL_ARGS={"echo":{"message":"hello"},"get-sum":{"a":2,"b":3}}'
```

`TOOL_MIX` picks which tools to call and how often. **Only include tools that are safe to call thousands of times** — no tools that send email, write to production, or call paid APIs. Without it, mcpload calls every tool the server lists, with arguments generated from each tool's schema. You should see `mcpload result: PASS`.

## Step 4 — The 38-minute soak

```bash
./mcpload run --url http://localhost:5101/mcp --scenario soak \
  --soak-min 30 --warmup-min 3 --cooldown-min 5 --env RATE=2 \
  --env 'TOOL_MIX={"echo":3,"get-sum":2,"get-tiny-image":1}' \
  --env 'TOOL_ARGS={"echo":{"message":"hello"},"get-sum":{"a":2,"b":3}}' \
  --sampler docker --container mcp-under-test \
  --out soak.json --html soak.html
```

`RATE=2` means two new agent sessions start every second — about 3,600 sessions over the 30 minutes. `--sampler docker` records the container's memory every 10 seconds.

## What was measured (reference server)

On a laptop with the container limited to 2 CPUs and 1 GiB, running `server-everything` 2026.8.31 (TypeScript SDK 1.31):

- **3,780 sessions, 49,227 requests, 0 errors**
- **Memory flat**: ~136 MiB, growing 0.12 MiB/min against a 1 MiB/min limit, and back near baseline after cool-down
- **p95 latency steady at ~21 ms** for all three tools over the full 30 minutes

Stepping load from 5 to 80 concurrent agents (2 minutes each):

| Concurrent agents | Tool calls/s | p95 |
| --- | --- | --- |
| 5 | 40 | 23 ms |
| 10 | 81 | 21 ms |
| 20 | 172 | 22 ms |
| 40 | 333 | 25 ms |
| 80 | 534 | 178 ms |

Throughput scaled linearly up to 40 agents; at 80, latency rose sharply but there were still zero errors. On 2 cores, the knee for this workload lies between 40 and 80 concurrent agents. These are numbers from one laptop run of a demo server with trivial tools — not a benchmark, and they say nothing about production deployments. The point is that you now know *where* your limits are before your users find them.

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "ml1",
      "type": "rectangle",
      "x": 40,
      "y": 60,
      "width": 200,
      "height": 90,
      "strokeColor": "#2980b9",
      "backgroundColor": "#c4e0f2",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "Warm-up (3 min)\nload ramps up\nstartup growth allowed", "fontSize": 13, "fontFamily": 1 }
    },
    {
      "id": "ml2",
      "type": "rectangle",
      "x": 300,
      "y": 60,
      "width": 240,
      "height": 90,
      "strokeColor": "#c0392b",
      "backgroundColor": "#f5b7b1",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "Steady load (30 min)\nRATE=2 sessions/s\n~3600 agent sessions\nmemory sampled /10s", "fontSize": 13, "fontFamily": 1 }
    },
    {
      "id": "ml3",
      "type": "rectangle",
      "x": 600,
      "y": 60,
      "width": 200,
      "height": 90,
      "strokeColor": "#27ae60",
      "backgroundColor": "#d5f5e3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "Cool-down (5 min)\nno load\nmemory must return\nto baseline", "fontSize": 13, "fontFamily": 1 }
    },
    {
      "id": "ml4",
      "type": "rectangle",
      "x": 300,
      "y": 220,
      "width": 500,
      "height": 80,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#f9e0a3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "Leak verdict: steady growth during load (slope > limit,\ngood linear fit) OR no return to baseline in cool-down.\n'Memory went up' alone is NOT a leak.", "fontSize": 13, "fontFamily": 1 }
    },
    {
      "id": "ml5",
      "type": "arrow",
      "x": 240,
      "y": 105,
      "width": 60,
      "height": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "points": [[0, 0], [60, 0]]
    },
    {
      "id": "ml6",
      "type": "arrow",
      "x": 540,
      "y": 105,
      "width": 60,
      "height": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "points": [[0, 0], [60, 0]]
    },
    {
      "id": "ml7",
      "type": "arrow",
      "x": 450,
      "y": 150,
      "width": 0,
      "height": 70,
      "strokeColor": "#c0392b",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "points": [[0, 0], [0, 70]]
    }
  ]
}
```

## Things worth testing on your own server

- **Behind a load balancer.** If your server uses stateful sessions (`Mcp-Session-Id`), run two replicas without sticky sessions and use `--scenario lb-check`. mcpload counts `session_not_found` errors separately.
- **Sessions that never close.** Agents crash and drop connections. If your server keeps per-session state, the soak's cool-down shows whether it's ever freed.
- **Bursts.** `--scenario burst` floods `initialize` and then ramps to 200 agents at once.

A subtle failure mode worth checking (raised in the article's comments): child-process cleanup on agent cancellation. When an agent times out or crashes mid tool-call, the HTTP transport tears down cleanly but the server often leaves underlying workers (ripgrep, shell) running — memory looks stable while file descriptors and zombie slots run out. An explicit process-tree kill on transport disconnect is the fix; mcpload does not catch this today (it tracks container memory, not processes/fds).

## Run it in CI

There's a GitHub Action that runs the test on every pull request and posts a per-tool table as a PR comment:

```yaml
- uses: atul121001/mcpload-action@v1
  with:
    url: http://localhost:8080/mcp
    vus: '10'
    duration: 2m
    p95-ms: '800'
```

## References

- [How to soak-test your MCP server before AI agents do it for you (DEV.to)](https://dev.to/atulmishra/how-to-soak-test-your-mcp-server-before-ai-agents-do-it-for-you-2jc3)
- [mcpload repository](https://github.com/atul121001/mcpload)
- [k6 — load testing platform](https://k6.io/)
