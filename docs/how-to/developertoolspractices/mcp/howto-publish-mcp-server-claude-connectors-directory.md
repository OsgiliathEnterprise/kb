---
title: How to Publish an MCP Server in the Claude Connectors Directory
diataxis: How-to Guide
domain: developer-tools-practices
topic: mcp
source: DEV.to Tech News
source_url: https://dev.to/dialogbrain/how-to-publish-an-mcp-server-in-the-claude-connectors-directory-2oek
date: 2026-10-15
keywords:
- knowledge-base
- mcp
- developer-tools-practices
- how-to
---
# How to Publish an MCP Server in the Claude Connectors Directory

This how-to follows a real submission (DialogBrain, submitted and live the same day, 30 September 2026) and covers what the Anthropic connectors portal at `claude.ai/directory/manage` asks for, which rules quietly hold a submission, and why **running every one of your own tools before you submit** is the step that actually pays.

## What a listing is — and is not

A **connector listing** puts your *remote* MCP server in the directory people browse inside Claude: one click to add, sign in with your OAuth, and your tools are in the conversation. It is **not a plugin** — a plugin is a bundle of skills and configuration from a GitHub repository and is a separate submission. If you have both, submit both.

A listing is published as a **Community connector** by default. An automated policy scan runs first; some submissions also get a human reviewer. Review can take weeks even when yours takes a day — do not plan a launch around a date.

## Step 1 — Decide which tools you are submitting

This decision comes before the form, and it matters most. **The reviewer reads every tool your listing exposes.** If your full MCP catalogue carries raw SQL, a Python sandbox, a device farm, or browser-session capture — legitimate for engineers who connect it themselves, wrong for a listing anyone can install — split the server:

```python
# One tool set, one path per directory. The resource a client reads back
# must be the URL it registered, so the paths cannot be merged.
PROFILES = {"directory": DIRECTORY_TOOLS}

PROFILE_PATHS = {
    "/mcp/chatgpt": "directory",
    "/mcp/claude-directory": "directory",
}
```

The paths cannot be merged because the **resource value a client reads back from the protected-resource document has to be the URL it registered** — one shared path breaks one of the listings. If your server was built for your own users, assume you will need this split; it is a dozen lines and is the difference between a listing a reviewer can approve and a conversation about why you expose a SQL console.

## Step 2 — Check the four things the portal reads automatically

1. **Remote and reachable over HTTPS.** A local server cannot be submitted on its own; it belongs in a plugin.
2. **OAuth 2.0 with dynamic client registration** — or no authentication at all for public data. The portal detects which you have. Advertise the registration endpoint at `/.well-known/oauth-authorization-server`, and the 401 your server returns without a token must point at the protected-resource document for the exact path being submitted:

```bash
curl -i -X POST https://api.example.com/mcp/claude-directory \
  -H 'Content-Type: application/json' -d '{}'
# HTTP/2 401
# www-authenticate: Bearer error="invalid_token",
#   resource_metadata="https://api.example.com/.well-known/oauth-protected-resource/mcp/claude-directory"
```

3. **Every tool carries a title and the applicable `readOnlyHint` / `destructiveHint`.** The portal flags missing annotations, and a *wrong* label is a common rejection: anything that sends or deletes is destructive; anything that writes is not read-only.
4. **Documentation URL, privacy policy URL, support contact, and icon** — all four are public links a reviewer will open.

## Step 3 — Run every tool before you submit (this is where the bugs are)

The portal asks you to confirm you have run each tool. Do not tick the box because the tools obviously work — actually run them: add the server as a custom connector in Claude, sign in as the reviewer account, and ask Claude to call each tool in turn and report the result. In the reference submission, twenty minutes of this found **three real defects, two of which had been shipped for weeks**:

1. A read tool that answered `agent_id is required. Pass it as a parameter when calling from MCP.` — a person asking "what reminders are set?" has no agent id and cannot get one, so the tool could not answer *anyone* connecting over MCP.
2. A tool whose error message pointed at another tool the listing did not expose — the advice led nowhere and a customer's photo could not be opened.
3. A tool that reported `success: true` for work it had not done — removing a tag that was never on the conversation was indistinguishable from a real removal.

None of these would be caught by a reviewer in the first five minutes; all three would be found by a user in the first week. A prompt that works well for this step:

```
Call each of these tools exactly once, in order, and do not ask me
anything in between: workspace_current, channels_list, search_threads,
contacts_find, messages_read_history, tasks_create, tasks_update,
notes_save, reminder_set, reminder_list, reminder_cancel, files_read.
Then print one line per tool: the name, OK or FAILED, and for a failure
the exact error text.
```

## Step 4 — The ten steps, and what each one actually wants

1. **Connection** — paste the URL and authorise. The portal reads your tool list live. If your server hides tools for channels a workspace has not connected, the count shown is what *that account* can see, not your full set — say so in the notes rather than letting a reviewer wonder.
2. **Tools** — synced from the live connection, with annotations. Anything flagged here is fixed **on your server**, not in the form.
3. **Listing** — name, slug, one-liner (≤200 chars), description (≤2,000), categories, documentation, privacy, support, icon. **The slug is permanent once published** — the one field you cannot take back.
4. **Use cases** — three things people will do, each with an example prompt, what they need before connecting, and whether the connector reads, writes, or both.
5. **Company, Authentication, Data handling** — a contact a reviewer can reach; the authentication mode (detected); whether the API is your own, whether personal health data is involved, whether any content is sponsored.
6. **Test & launch** — access instructions detailed enough for a reviewer to connect and run the tools: the URL, real credentials for a populated account, and what to try. Say plainly which tools reach real people (e.g., "read and not send").
7. **Compliance** — seven acknowledgements, including prompt injection and conversation-data collection. If your product stores other people's private messages, say so in the notes instead of hoping the checkbox covers it.
8. **Review and submit** — summary and the button.

## Two traps worth knowing

- **Reconnecting the server resets fields you already filled.** Reconnecting on the Connection step to pick up newly added tools silently put the listing name and slug back to the auto-derived values. **Check the Listing step again after any reconnect.**
- **A draft lives in the browser tab.** The form says "Draft saved in this tab." Leave that tab and the draft is not in your submissions list; come back to the same tab and it is still there, on the step you left. Do not close it.

## After it is live

- The listing appears in the directory within about an hour, with Community and New badges; health, rank, and usage start about a day after the first calls.
- **Edits after publishing go through review before they replace what is live**, so the listing you publish is the one people see for a while.
- Edits *before* publishing send the submission back to draft for another review — if you are staring at an approved submission and a small copy change, **publish first and edit after**.

## Key takeaways

- The tool surface you expose is the submission: **curate a directory-facing profile** on its own path before you open the portal.
- OAuth metadata is machine-checked: registration endpoint, 401 → protected-resource document for the *exact* submitted path, tool annotations (`readOnlyHint`/`destructiveHint`).
- **Run every tool as the reviewer will** — a 20-minute scripted pass beats a ticked checkbox and finds shipped defects.
- The slug is permanent; the draft is per-tab; post-publish edits need review. Plan around all three.

## Related notes

- `developer-tools-practices/mcp/explanation-tool-descriptions-are-the-contract.md`
- `developer-tools-practices/mcp/howto-soak-test-mcp-server-with-mcpload.md`
- `developer-tools-practices/mcp/howto-azure-mcp-server-scoped-agent-access.md`
- `developer-tools-practices/mcp/explanation-mcp-discovery-storms-sep-2549-caching.md`

## References

- [How to publish an MCP server in the Claude connectors directory (DEV.to, DialogBrain)](https://dev.to/dialogbrain/how-to-publish-an-mcp-server-in-the-claude-connectors-directory-2oek)
- [Claude connectors directory portal](https://claude.ai/directory/manage)
