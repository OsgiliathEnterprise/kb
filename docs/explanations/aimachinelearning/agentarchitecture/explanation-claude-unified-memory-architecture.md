---
title: 'Claude''s Unified Memory Across Chat and Cowork: Architecture and Sensitive-Data
  Exclusions'
diataxis: Explanation
domain: ai-machine-learning
topic: agent-architecture
source: TheNewStack
source_url: https://thenewstack.io/claude-memory-chat-cowork/
date: 2026-08-26
keywords:
- knowledge-base
- agent-architecture
- ai-machine-learning
- explanations
---
# Claude's Unified Memory Across Chat and Cowork

On 2026-08-25 Anthropic merged Claude's memory across **chat** and **Cowork**
into a single memory that bridges both surfaces. Previously Cowork's memory
was bound to individual projects and was independent of what Claude knew from
chat. Architecturally, the update changes three things:

## What changed

1. **Scope: per-project → account-wide.** Context built over months of
   conversations (e.g. Q3 priorities, project status) is available the moment
   you hand Cowork a task, and what happens in Cowork carries back to chat.
2. **Update timing: end-of-session → live.** Memory was previously only
   updated after a chat ended; now it updates while you work. This matters
   because Cowork sessions run for hours or days.
3. **Storage model: topic files.** Memory is stored as **small files
   organized by topic**. Users can delete them but not edit them directly;
   changes are made by chatting with Claude from the settings menu.

## Sensitive-data handling

By default Claude does **not** store information it considers sensitive —
health data, religious beliefs, race, ethnicity, gender identity. There is a
settings option to include sensitive topics, but it is currently all-or-nothing
(no per-topic tuning). Some categories never enter memory regardless of
settings: sensitive identification numbers (SSN, government ID numbers),
criminal history, immigration status, and anything violating Anthropic's
Acceptable Use Policy.

## Defaults by plan

- **Free / Pro / Max**: unified memory **on by default** across web, desktop,
  and mobile.
- **Enterprise / Teams**: all memory features **off by default**.
- Anthropic states memory is not used for ad targeting (Claude is ad-free).

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
      "y": 140,
      "width": 200,
      "height": 80,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#d9ccff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "Chat\n(web, desktop, mobile)", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "b2",
      "type": "rectangle",
      "x": 40,
      "y": 320,
      "width": 200,
      "height": 80,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#d9ccff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "Cowork\n(hours-to-days sessions)", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "b3",
      "type": "rectangle",
      "x": 340,
      "y": 230,
      "width": 260,
      "height": 110,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#c4e0f2",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "Unified memory\nsmall topic-organized files\nupdated live during work\ndeletable, chat-edited only", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "b4",
      "type": "rectangle",
      "x": 680,
      "y": 230,
      "width": 260,
      "height": 110,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#f9d3d3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "Never stored:\nSSN / gov IDs, criminal history,\nimmigration status, AUP violations\nSensitive topics excluded by default", "fontSize": 14, "fontFamily": 1 }
    },
    [
      {
        "id": "a1",
        "type": "arrow",
        "x": 240,
        "y": 180,
        "width": 100,
        "height": 70,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [ [0, 0], [100, 70] ]
      }
    ],
    [
      {
        "id": "a2",
        "type": "arrow",
        "x": 240,
        "y": 360,
        "width": 100,
        "height": 70,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [ [0, 0], [100, -70] ]
      }
    ],
    [
      {
        "id": "a3",
        "type": "arrow",
        "x": 600,
        "y": 285,
        "width": 80,
        "height": 0,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [ [0, 0], [80, 0] ]
      }
    ]
  ],
  "appState": { "viewBackgroundColor": "#ffffff" }
}
```

## Takeaways for agent architects

- **Shared memory scope is a product decision with a privacy surface.** The
  all-or-nothing sensitive-topic toggle is a coarse control; per-topic
  granularity is the obvious next step.
- **Live memory updates** change the consistency model: the memory an agent
  relies on mid-session can change during that session.
- The **topic-file storage model** (readable, deletable, not directly editable)
  is a practical pattern worth copying for agent memory stores: it gives users
  auditability without a low-level edit API that would risk corrupting the
  memory format.

## References

- [The New Stack: Anthropic gives chat and Cowork one memory](https://thenewstack.io/claude-memory-chat-cowork/)
- [TechCrunch: Claude Cowork finally remembers what you told the app in chat](https://techcrunch.com/2026/08/25/claude-cowork-finally-remembers-what-you-told-the-app-in-chat/)
- [Anthropic Help Center: Claude Cowork architecture overview](https://support.claude.com/en/articles/14479288-claude-cowork-architecture-overview)

## Related
- [[explanation-lemmalog-datalog-memory-for-llm-agents]]
- [[explanation-agent-guardrail-stack]]
- [[howto-agentic-rag-pipeline-with-real-time-web-search]]
