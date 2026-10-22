---
title: How to Coordinate Multi-Agent AI Swarms Without Cloud Deadlocks — a Distributed
  Task Board MCP Server (AgentMesh)
diataxis: How-to Guide
domain: developer-tools-practices
topic: mcp
source: DEV.to Tech News
source_url: https://dev.to/johann_schiffer/how-to-coordinate-multi-agent-ai-swarms-without-cloud-deadlocks-a-distributed-task-board-mcp-server-djb
date: 2026-10-22
keywords:
- knowledge-base
- mcp
- developer-tools-practices
- how-to
---
# How to Coordinate Multi-Agent AI Swarms Without Cloud Deadlocks — a Distributed Task Board MCP Server (AgentMesh)

Running 20 AI coding agents on a shared repo fails in predictable ways: two agents claim the same issue, a crashed agent leaves a task locked forever, and adding a cloud queue (Redis, Postgres, a workflow service) for coordination adds more infrastructure than the work itself justifies. [AgentMesh](https://github.com/johannschiffer/agentmesh-mcp) solves the coordination problem with **one MCP server and a single SQLite file in WAL mode** — no cloud dependency, no message broker, no distributed lock service.

The core idea: the coordination state is just a small SQLite database, and SQLite's WAL + immediate transactions give you atomic task claiming for free.

## The four failure modes and their fixes

| Failure mode | Fix in AgentMesh |
|---|---|
| Two agents claim the same task | `BEGIN IMMEDIATE` + conditional update in one atomic transaction — exactly one writer wins |
| Crashed agent leaves zombie lock | Leased claims with heartbeat; `lease_timeout_sec` (default 60s) lets a reaper reclaim stuck tasks |
| Task depends on unfinished work | `depends_on` JSON array; task stays `blocked` until all deps are `done`, then auto-promotes to `pending` |
| Agents poll forever / busy-wait | Claim is atomic; agents that lose the race move on to the next task instead of waiting |

## Step 1 — Wire the MCP server into the agent

Claude Code (and any MCP host) configuration:

```json
{
  "mcpServers": {
    "agentmesh": {
      "command": "agentmesh",
      "args": ["--db", "/shared/agentmesh.db"]
    }
  }
}
```

All agents point at the **same database file** (shared volume for Docker agents, shared FS for local processes). That file is the entire coordination state.

## Step 2 — The atomic claim (the part that matters)

The whole concurrency story is this transaction:

```python
def claim_task(conn, task_id, agent_id):
    """Atomic claim: BEGIN IMMEDIATE + conditional update.
    Only one agent can win; losers see rowcount == 0 and move on."""
    with conn:  # WAL mode + BEGIN IMMEDIATE
        cur = conn.execute(
            """UPDATE tasks
               SET status = 'claimed', claimant = ?, claimed_at = now(),
                   lease_expires = now() + ?
               WHERE id = ? AND status IN ('pending', 'zombie')""",
            (agent_id, LEASE_TIMEOUT_SEC, task_id),
        )
        return cur.rowcount == 1  # False → someone else got it
```

Two properties make this correct without any external lock:

1. **`BEGIN IMMEDIATE`** takes the write lock up front, so two concurrent claims serialize instead of both seeing `pending`.
2. **The conditional `WHERE`** makes the claim idempotent and race-free: the second writer's update matches zero rows and learns it lost.

## Step 3 — DAG dependencies without a workflow engine

Tasks carry a `depends_on` JSON array of task IDs. On every state change the server checks the DAG:

```python
def promote_blocked(conn):
    """Promote blocked tasks whose deps are all done."""
    for row in conn.execute("SELECT id, depends_on FROM tasks WHERE status = 'blocked'"):
        deps = json.loads(row["depends_on"])
        open_deps = conn.execute(
            """SELECT count(*) FROM tasks
               WHERE id IN (?) AND status NOT IN ('done')""", deps,
        ).fetchone()[0]
        if open_deps == 0:
            conn.execute("UPDATE tasks SET status = 'pending' WHERE id = ?", (row["id"],))
```

This gives you parallelizable fan-out: the board only exposes `pending` tasks, so agents naturally work on the frontier of the DAG.

## Step 4 — Zombie reclamation

A claim is a **lease**, not a lock. Agents heartbeat while working; the server (or any agent, on claim attempt) runs a reaper:

```python
def reap_zombies(conn):
    """Claims older than the lease timeout become claimable again."""
    conn.execute(
        """UPDATE tasks SET status = 'pending', claimant = NULL
           WHERE status = 'claimed' AND lease_expires < now()"""
    )
```

A crashed agent can never wedge the swarm: worst case, its tasks become claimable after 60 seconds.

## Step 5 — The agent-side loop

Each agent runs the same loop until the board is empty:

```python
while True:
    task = mcp.claim_task(agent_id)   # atomic; None when board is empty
    if task is None:
        break
    result = do_work(task)            # edit code, run tests, whatever
    mcp.complete_task(task.id, result)
```

Because claiming is atomic and the board is the single source of truth, you can run agents as local processes, Docker containers, or on different machines with a shared volume — no orchestration service in the middle.

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "a1",
      "type": "rectangle",
      "x": 40,
      "y": 60,
      "width": 180,
      "height": 70,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#a5d8ff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "seed": 401,
      "versionNonce": 401,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 3},
      "updated": 1760000000000
    },
    {
      "id": "a1t",
      "type": "text",
      "x": 55,
      "y": 77,
      "width": 150,
      "height": 40,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "seed": 402,
      "versionNonce": 402,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "updated": 1760000000000,
      "text": "Orchestrator\\nspawns N agents\\n(Docker / local)",
      "fontSize": 14,
      "fontFamily": 2,
      "textAlign": "left",
      "verticalAlign": "top",
      "baseline": 36,
      "containerId": null,
      "originalText": "Orchestrator\\nspawns N agents\\n(Docker / local)",
      "lineHeight": 1.25
    },
    {
      "id": "a2",
      "type": "rectangle",
      "x": 300,
      "y": 60,
      "width": 200,
      "height": 70,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#ffec99",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "seed": 403,
      "versionNonce": 403,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 3},
      "updated": 1760000000000
    },
    {
      "id": "a2t",
      "type": "text",
      "x": 315,
      "y": 77,
      "width": 170,
      "height": 40,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "seed": 404,
      "versionNonce": 404,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "updated": 1760000000000,
      "text": "AgentMesh MCP server\\n(create / claim /\\ncomplete task)",
      "fontSize": 14,
      "fontFamily": 2,
      "textAlign": "left",
      "verticalAlign": "top",
      "baseline": 36,
      "containerId": null,
      "originalText": "AgentMesh MCP server\\n(create / claim /\\ncomplete task)",
      "lineHeight": 1.25
    },
    {
      "id": "a3",
      "type": "rectangle",
      "x": 580,
      "y": 60,
      "width": 220,
      "height": 70,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#d3f9d8",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "seed": 405,
      "versionNonce": 405,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 3},
      "updated": 1760000000000
    },
    {
      "id": "a3t",
      "type": "text",
      "x": 595,
      "y": 77,
      "width": 190,
      "height": 40,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "seed": 406,
      "versionNonce": 406,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "updated": 1760000000000,
      "text": "agentmesh.db (WAL)\\nBEGIN IMMEDIATE claims\\nDAG promotion, leases",
      "fontSize": 14,
      "fontFamily": 2,
      "textAlign": "left",
      "verticalAlign": "top",
      "baseline": 36,
      "containerId": null,
      "originalText": "agentmesh.db (WAL)\\nBEGIN IMMEDIATE claims\\nDAG promotion, leases",
      "lineHeight": 1.25
    },
    {
      "id": "a4",
      "type": "rectangle",
      "x": 300,
      "y": 220,
      "width": 500,
      "height": 80,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#ffc9c9",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "seed": 407,
      "versionNonce": 407,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 3},
      "updated": 1760000000000
    },
    {
      "id": "a4t",
      "type": "text",
      "x": 315,
      "y": 235,
      "width": 470,
      "height": 50,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "seed": 408,
      "versionNonce": 408,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "updated": 1760000000000,
      "text": "Failure modes covered: double-claim (atomic txn), zombie lock\\n(60s lease reaper), blocked work (depends_on DAG auto-promotion),\\nbusy-wait (loser of claim race moves to next task)",
      "fontSize": 14,
      "fontFamily": 2,
      "textAlign": "left",
      "verticalAlign": "top",
      "baseline": 36,
      "containerId": null,
      "originalText": "Failure modes covered: double-claim (atomic txn), zombie lock\\n(60s lease reaper), blocked work (depends_on DAG auto-promotion),\\nbusy-wait (loser of claim race moves to next task)",
      "lineHeight": 1.25
    },
    {
      "id": "aa1",
      "type": "arrow",
      "x": 220,
      "y": 95,
      "width": 80,
      "height": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "seed": 409,
      "versionNonce": 409,
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
      "id": "aa2",
      "type": "arrow",
      "x": 500,
      "y": 95,
      "width": 80,
      "height": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "seed": 410,
      "versionNonce": 410,
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
      "id": "aa3",
      "type": "arrow",
      "x": 550,
      "y": 130,
      "width": 0,
      "height": 90,
      "strokeColor": "#868e96",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "seed": 411,
      "versionNonce": 411,
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
      "id": "aa3l",
      "type": "text",
      "x": 560,
      "y": 155,
      "width": 120,
      "height": 36,
      "strokeColor": "#868e96",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "seed": 412,
      "versionNonce": 412,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "updated": 1760000000000,
      "text": "shared volume\\n= shared state",
      "fontSize": 14,
      "fontFamily": 2,
      "textAlign": "left",
      "verticalAlign": "top",
      "baseline": 36,
      "containerId": null,
      "originalText": "shared volume\\n= shared state",
      "lineHeight": 1.25
    }
  ],
  "appState": {
    "gridSize": null
  },
  "files": {}
}
```

## When this pattern works (and when it doesn't)

**Works well:**
- Dozens of agents, same repo, one machine or a shared volume — the SQLite file *is* the coordination plane.
- Crash-tolerant by construction: restart an agent and it just keeps claiming; state survives in the file.
- Debuggable: `sqlite3 agentmesh.db "select * from tasks"` is the entire observability story.

**Breaks down:**
- **Many writers on a network filesystem** — SQLite over NFS/SMB is not safe; use a real queue (Redis Streams, Postgres `FOR UPDATE SKIP LOCKED`) once the board outgrows one machine.
- **Long-running tasks with coarse heartbeats** — a 60s lease is tight for tasks that take 10 minutes; scale `lease_timeout_sec` to your work or rely on heartbeats.
- **Cross-machine agents with no shared volume** — the design assumes the DB file is reachable by every agent; that's the one place "distributed" is doing heavy lifting.

## References

- [How to Coordinate Multi-Agent AI Swarms Without Cloud Deadlocks — a Distributed Task Board MCP Server (DEV.to, original source)](https://dev.to/johann_schiffer/how-to-coordinate-multi-agent-ai-swarms-without-cloud-deadlocks-a-distributed-task-board-mcp-server-djb)
- [johannschiffer/agentmesh-mcp on GitHub](https://github.com/johannschiffer/agentmesh-mcp)
- Related KB notes: [[MCP Protocol Era Downgrades — Why Your Server Silently Serves the Old Spec (2026-07-28)]] (protocol behavior when scaling MCP servers), [[How to Soak-Test Your MCP Server Before AI Agents Do It for You (mcpload)]] (load-testing the server side)
