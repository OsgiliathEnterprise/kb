---
title: How to Map HTTP API Path, Query, Header, and Body Parameters into MCP Tool
  Schemas
diataxis: How-to Guide
domain: developer-tools-practices
topic: mcp
source: DEV.to Tech News
source_url: https://dev.to/bhavyshekhaliya/mapping-api-path-query-header-and-body-parameters-to-mcp-tool-schemas-48k5
date: 2026-08-29
keywords:
- knowledge-base
- mcp
- developer-tools-practices
- how-to
---
# How to Map HTTP API Path, Query, Header, and Body Parameters into MCP Tool Schemas

An API operation receives input from several places — path parameters identify the record, query parameters filter/paginate, headers carry metadata or auth, the body carries structured data. An **MCP tool** should present all of that as *one* clear input schema the AI client can call without hiding the real API contract. This note walks through the mapping with a concrete example: `PATCH /workspaces/{workspace_id}/projects/{project_id}/tasks/{task_id}` (update one task), which takes path params (`workspace_id`, `project_id`, `task_id`), a query param (`notify_assignee`), a JSON body (`title`, `status`, `assignee_id`, `due_date`), Bearer auth, and an optional `Idempotency-Key` header.

## Step 1 — Name the tool from the operation, not the route

Routes are for adapters; they make bad tool names. `"patch_workspaces_projects_tasks"` is weak; `"update_task"` is clear. If your API has several update operations, disambiguate by object + action: `update_task`, `update_task_status`, `assign_task`, `reschedule_task`. The right name depends on what the endpoint actually does — a multi-field endpoint wants `update_task`; a status-only endpoint wants `update_task_status`.

## Step 2 — Bring path parameters into the input schema as required fields

Path params identify the exact resource, so they become **required** properties. Keep them explicit — do not collapse three IDs into one generic `id` field; the AI client should never guess which ID belongs to which level:

```json
{
  "type": "object",
  "properties": {
    "workspace_id": { "type": "string", "description": "The workspace that contains the project." },
    "project_id": { "type": "string", "description": "The project that contains the task." },
    "task_id": { "type": "string", "description": "The task to update." }
  },
  "required": ["workspace_id", "project_id", "task_id"]
}
```

## Step 3 — Map query parameters as filters and options

Query params change behavior (filtering, sorting, pagination, flags) and become **optional** inputs with descriptions and defaults:

```json
{
  "notify_assignee": {
    "type": "boolean",
    "description": "Whether to notify the assigned user after the task is updated.",
    "default": false
  }
}
```

For list operations, query params are often the *main* inputs — expose `status` (enum), `limit` (`minimum: 1`, `maximum: 100`, default 20), and `cursor` as bounded fields. Good query mapping keeps list tools **bounded**: if a search endpoint accepts unlimited free-form parameters, the agent will produce slow, broad, or invalid calls.

## Step 4 — Treat authentication headers separately (never expose credentials)

Auth headers must not become normal tool inputs — exposing an `authorization` property makes the credential **model-visible**. The tool input stays focused on the business operation; the adapter or hosted MCP runtime receives credentials through its own authentication path and forwards them upstream (`Authorization: Bearer <credential>`). The upstream API still enforces identity, tenant, role, record, and action permissions. (0mcp supports API key, Bearer token, and OAuth pass-through — credentials supplied at request time by the MCP client, not stored or schema-exposed.)

## Step 5 — Decide what to do with non-auth headers

Some headers are not secrets but still matter: `Idempotency-Key`, `X-Request-Id`, `Accept-Language`, `If-Match`, `X-Client-Version`. Do **not** automatically expose every header. Expose a header as a tool input only when the caller can safely provide it, it changes behavior usefully, its value is not secret, its format can be validated, and the AI client understands why it exists. Two common treatments:

- `Idempotency-Key`: often better **generated inside the MCP server** than asked of the AI client — reduces friction and avoids duplicate-write bugs.
- `Accept-Language`: expose a business-friendly field instead of the raw header, then map it in the adapter:

```json
{ "language": { "type": "string", "enum": ["en", "es", "fr"], "description": "Preferred language for localized response text." } }
```

The schema should describe product-level inputs; don't force the agent to think in low-level HTTP details when a cleaner field works.

## Step 6 — Map the request body into structured inputs (and validate "at least one")

For create/update operations the body is usually the largest part of the tool schema. Combine path + query + body fields into one `inputSchema`; keep body fields **optional** for patch semantics, but still reject no-op updates with validation logic when the schema format can't express it cleanly:

```js
const updateFields = ["title", "status", "assignee_id", "due_date"];
if (!updateFields.some((field) => input[field] !== undefined)) {
  throw new Error("Provide at least one task field to update.");
}
```

The tool should guide the model toward valid updates without making every field required.

## Step 7 — Handle naming conflicts deliberately

Combining path/query/header/body inputs into one schema produces collisions: a body `id` (external/imported ID) vs. a path `id` (the resource being addressed); `user_id` in both path and body; `status` in query and body; `version` in header and body; nested `id` fields. Never expose two different things as the same name — rename by role:

```json
{ "project_id": "prj_123", "external_project_id": "ext_999", "name": "New project name" }
```

When in doubt, name the field by its **role in the operation**: selecting a resource, filtering a result, updating a value, or controlling request behavior.

## Step 8 — Build the API request from the tool input

The adapter reassembles the HTTP request: path params fill the route template, query params become the query string, mapped headers are set, body fields form the JSON payload, and credentials come from the runtime's auth path — not the model. The MCP schema is a *projection* of the API contract; the adapter owns everything the model should never see.

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "mc1",
      "type": "rectangle",
      "x": 60,
      "y": 40,
      "width": 240,
      "height": 80,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#c4e0f2",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "path params\n(required resource IDs)",
        "fontSize": 14,
        "fontFamily": 1
      }
    },
    {
      "id": "mc2",
      "type": "rectangle",
      "x": 60,
      "y": 150,
      "width": 240,
      "height": 80,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#c4e0f2",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "query params\n(filters, options)",
        "fontSize": 14,
        "fontFamily": 1
      }
    },
    {
      "id": "mc3",
      "type": "rectangle",
      "x": 60,
      "y": 260,
      "width": 240,
      "height": 80,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#c4e0f2",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "body fields\n(structured data)",
        "fontSize": 14,
        "fontFamily": 1
      }
    },
    {
      "id": "mc4",
      "type": "rectangle",
      "x": 60,
      "y": 370,
      "width": 240,
      "height": 80,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#f5c6c6",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "auth headers\nNEVER in tool schema\n(runtime injects)",
        "fontSize": 14,
        "fontFamily": 1
      }
    },
    {
      "id": "mc5",
      "type": "rectangle",
      "x": 420,
      "y": 150,
      "width": 300,
      "height": 190,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#d9ccff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "MCP tool inputSchema\none flat object:\nresource IDs + options + body fields\n(conflicts renamed by role)",
        "fontSize": 14,
        "fontFamily": 1
      }
    },
    {
      "id": "mc6",
      "type": "rectangle",
      "x": 820,
      "y": 150,
      "width": 300,
      "height": 190,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#c9e7c9",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "Adapter\nrebuilds HTTP request:\nroute + query + headers + body\n+ credentials from auth path",
        "fontSize": 14,
        "fontFamily": 1
      }
    },
    [
      {
        "id": "mc7",
        "type": "arrow",
        "x": 300,
        "y": 80,
        "width": 120,
        "height": 90,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [
          [
            0,
            0
          ],
          [
            120,
            90
          ]
        ]
      }
    ],
    [
      {
        "id": "mc8",
        "type": "arrow",
        "x": 300,
        "y": 190,
        "width": 120,
        "height": 0,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [
          [
            0,
            0
          ],
          [
            120,
            0
          ]
        ]
      }
    ],
    [
      {
        "id": "mc9",
        "type": "arrow",
        "x": 300,
        "y": 300,
        "width": 120,
        "height": -90,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [
          [
            0,
            0
          ],
          [
            120,
            -90
          ]
        ]
      }
    ],
    [
      {
        "id": "mc10",
        "type": "arrow",
        "x": 720,
        "y": 245,
        "width": 100,
        "height": 0,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [
          [
            0,
            0
          ],
          [
            100,
            0
          ]
        ]
      }
    ]
  ]
}
```

## Checklist before shipping a tool schema

- Tool name describes the **operation**, not the route.
- Path params are required and individually named (no generic `id`).
- Query params bounded with enums/minimums/maximums where possible.
- No credential anywhere in the schema; auth handled by the runtime.
- Non-auth headers either mapped to business-friendly fields or generated server-side.
- Body fields optional for patches, with "at least one field" validation.
- All name collisions resolved by role-based renaming.

## References

- [Mapping API Path, Query, Header, and Body Parameters to MCP Tool Schemas (dev.to)](https://dev.to/bhavyshekhaliya/mapping-api-path-query-header-and-body-parameters-to-mcp-tool-schemas-48k5)
- [Model Context Protocol specification](https://modelcontextprotocol.io/)

## Related
- [[howto-mcp-security-hardening]]
- [[howto-agentic-rag-pipeline-with-real-time-web-search]]
