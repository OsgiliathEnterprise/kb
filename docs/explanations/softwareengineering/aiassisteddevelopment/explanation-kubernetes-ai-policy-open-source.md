---
title: 'Kubernetes AI Policy: Governance for AI-Assisted Open Source Contributions'
diataxis: Explanation
domain: Software-Engineering
topic: AI-Assisted-Development
source: Kubernetes Blog
source_url: https://kubernetes.io/blog/2026/06/26/open-source-maintainership-in-the-age-of-ai/
date: 2026-07-22
keywords:
- knowledge-base
- AI-Assisted-Development
- Software-Engineering
- explanations
---
# Kubernetes AI Policy: Governance for AI-Assisted Open Source Contributions

## Overview

The Kubernetes community has established a formal AI policy that governs how AI tools can be used in open source contributions. This policy balances innovation with accountability, addressing the core problem that **AI has made generating code fast but there has been very little improvement in maintaining code bases**.

## Core Policy Principles

### 1. Transparency First

Contributors **must disclose** when AI tools have been used to assist with a pull request. A simple statement in the PR description such as *"This PR was written in part with the assistance of generative AI"* is sufficient. This transparency helps reviewers understand the context and apply appropriate scrutiny.

### 2. Human Accountability

While AI tools can assist, the **human contributor remains fully responsible** for every change. The policy explicitly prohibits:

- Listing AI as a co-author on commits
- Using AI co-signing on commits
- Adding trailers like `assisted-by` or `co-developed` that attribute work to AI

**Rationale:** If something breaks, there needs to be a human who understands why and can fix it.

### 3. CLA Enforcement for Co-Authors

The CNCF provides a [CLA verification tool](https://github.com/cncf/cla) for checking contributor license agreements on each pull request. AI agents cannot solve these CLAs, so Kubernetes **enabled the CLA check for co-authors**. This provides a flag to reviewers that the PR is not ready to merge if an AI agent is listed as a co-author.

### 4. Human Engagement Required

Reviewers expect to engage with **humans, not AI**. Contributors cannot rely on AI to respond to review comments. If you cannot personally explain changes that AI helped generate, your PR will be closed. This ensures knowledge transfer happens and contributors genuinely understand the code they're submitting.

### 5. Verification Obligations

Contributors must verify AI-generated changes through:

- Code review
- Testing
- Personal understanding

It's not enough for the code to work — you need to know **why** it works and be able to maintain it.

## Automated AI Review Tools

The Kubernetes community has documented a [formal evaluation process](https://github.com/kubernetes/community/blob/main/github-management/ai-code-review-tools.md) for introducing new AI review tools. Key evaluation criteria include finding maintainers willing to test-drive tools in `kubernetes-sigs` repositories.

### Tools in Use

| Tool | Status | Notes |
|------|--------|-------|
| **GitHub Copilot** | Available for maintainers | CNCF provides [access for maintainers](https://contribute.cncf.io/blog/2025/12/16/github-copilot-enterprise-for-maintainers/). Blocker: relies on contributors having a Copilot license. |
| **CodeRabbit** | Rolled out to select projects (mid-2026) | Positive feedback. Used as a quality gate — contributors get quick spot-check reviews without waiting for a maintainer. Agent-sandbox added labels on PRs to track unresolved AI comments. |

Projects experimenting with AI review tools: **Kueue**, **JobSet**, and **Agent-Sandbox**.

## Key Takeaways for Open Source Projects

1. **AI is a tool, not a contributor** — Human accountability is non-negotiable
2. **Transparency enables trust** — Disclose AI usage in PR descriptions
3. **CLA enforcement catches AI co-authors** — A simple technical guardrail
4. **Automated reviews are quality gates, not replacements** — They spot-check, humans decide
5. **Knowledge transfer matters** — Contributors must understand the code they submit

## Future Directions

The Kubernetes community is exploring:

- AI skills to reduce maintainer burnout
- AI-assisted triage of failing tests
- Skills to aid operational aspects of Kubernetes
- Evaluating emerging technologies in the AI space

## Excalidraw Diagram

```excalidraw
* Excalidraw below
* You can draw in the message, and call draw_excalidraw to update the drawing
* When you send messages, include the drawing in the response to me so that I can see your drawings
* I can edit settings with Excalidraw+ settings, or draw text by starting lines with '> '

{"type":"default","values":{"appScale":1.0,"pageId":"p1","pages":{"p1":{"id":"p1","type":"tumbleweed","name":"Page 1","width":2200,"height":2200,"gridSize":20,"backgroundImageSrc":null,"backgroundImageSelectedZoomLevel":0,"isEmpty":false},"page2":{"id":"page2","type":"tumbleweed","name":"Page 2","width":2200,"height":2200,"gridSize":20,"backgroundImageSrc":null,"backgroundImageSelectedZoomLevel":0,"isEmpty":true}},"exportPadding":120,"toView":null,"gridSettings":{"customSize":20,"circular":false,"type":"square","dashed":true},"viewBackgroundColor":"#FFFFFF","theme":"dark","strokeColor":"#e6422c","backgroundColor":"#FFFFFF","fontSize":20,"font":"Cascadia","strokeWidth":2,"roughness":0,"seed":117588423,"view":null,"gridMode":false,"gridModeEnabled":false,"gridStep":5,"gridCounter":3}}
text {"id":"1","x":400.0,"y":100.0,"text":"Kubernetes AI Policy Framework","fontSize":24,"fontFamily":1,"type":"text","strokeColor":"#e6422c","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"aV","seed":149553083,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"2","x":100.0,"y":250.0,"text":"Transparency","fontSize":20,"fontFamily":1,"type":"text","strokeColor":"#457b9d","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"aW","seed":154724707,"groupIds":["aQ"],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"3","x":100.0,"y":290.0,"text":"Disclose AI usage","fontSize":14,"fontFamily":1,"type":"text","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"aX","seed":134999955,"groupIds":["aQ"],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"4","x":100.0,"y":315.0,"text":"in PR description","fontSize":14,"fontFamily":1,"type":"text","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"aY","seed":150582691,"groupIds":["aQ"],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"5","x":400.0,"y":250.0,"text":"Human Accountability","fontSize":20,"fontFamily":1,"type":"text","strokeColor":"#457b9d","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"aZ","seed":277501699,"groupIds":["aR"],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"6","x":400.0,"y":290.0,"text":"No AI co-authors","fontSize":14,"fontFamily":1,"type":"text","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"ba","seed":163038403,"groupIds":["aR"],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"7","x":400.0,"y":315.0,"text":"Human explains changes","fontSize":14,"fontFamily":1,"type":"text","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bb","seed":163038404,"groupIds":["aR"],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"8","x":700.0,"y":250.0,"text":"CLA Enforcement","fontSize":20,"fontFamily":1,"type":"text","strokeColor":"#457b9d","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bc","seed":163038405,"groupIds":["aS"],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"9","x":700.0,"y":290.0,"text":"AI cannot sign CLA","fontSize":14,"fontFamily":1,"type":"text","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bd","seed":163038406,"groupIds":["aS"],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"10","x":700.0,"y":315.0,"text":"Flags AI co-authors","fontSize":14,"fontFamily":1,"type":"text","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"be","seed":163038407,"groupIds":["aS"],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"11","x":1000.0,"y":250.0,"text":"Automated Reviews","fontSize":20,"fontFamily":1,"type":"text","strokeColor":"#457b9d","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bf","seed":163038408,"groupIds":["aT"],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"12","x":1000.0,"y":290.0,"text":"CodeRabbit / Copilot","fontSize":14,"fontFamily":1,"type":"text","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bg","seed":163038409,"groupIds":["aT"],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"13","x":1000.0,"y":315.0,"text":"Quality gate only","fontSize":14,"fontFamily":1,"type":"text","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bh","seed":163038410,"groupIds":["aT"],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"14","x":400.0,"y":420.0,"text":"Core Principle: AI is a tool, not a contributor","fontSize":18,"fontFamily":1,"type":"text","strokeColor":"#e6422c","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bi","seed":163038411,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"15","x":400.0,"y":460.0,"text":"Human must understand, verify,","fontSize":16,"fontFamily":1,"type":"text","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bj","seed":163038412,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"16","x":400.0,"y":485.0,"text":"and maintain every change","fontSize":16,"fontFamily":1,"type":"text","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bk","seed":163038413,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
arrow {"id":"17","x":350.0,"y":280.0,"binding":{"elementID":"aQ","focus":0.5,"gap":50,"startHeadId":null},"lastPos":{"x":350.0,"y":280.0},"points":"[0,0],[1,0]","startArrowSharpness":0.25,"endArrowSharpness":0.25,"startPoints":[[0,0],[1,0]],"endPoints":[[0,0],[1,0]],"startBinding":null,"endBinding":null,"startArrowhead":null,"endArrowhead":"arrow","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bl","seed":163038414,"groupIds":[],"roundness":{"type":2},"status":"active","strokeSharpness":"sharp","optionsId":"default"}
arrow {"id":"18","x":650.0,"y":280.0,"binding":{"elementID":"aR","focus":0.5,"gap":50,"startHeadId":null},"lastPos":{"x":650.0,"y":280.0},"points":"[0,0],[1,0]","startArrowSharpness":0.25,"endArrowSharpness":0.25,"startPoints":[[0,0],[1,0]],"endPoints":[[0,0],[1,0]],"startBinding":null,"endBinding":null,"startArrowhead":null,"endArrowhead":"arrow","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bm","seed":163038415,"groupIds":[],"roundness":{"type":2},"status":"active","strokeSharpness":"sharp","optionsId":"default"}
arrow {"id":"19","x":950.0,"y":280.0,"binding":{"elementID":"aS","focus":0.5,"gap":50,"startHeadId":null},"lastPos":{"x":950.0,"y":280.0},"points":"[0,0],[1,0]","startArrowSharpness":0.25,"endArrowSharpness":0.25,"startPoints":[[0,0],[1,0]],"endPoints":[[0,0],[1,0]],"startBinding":null,"endBinding":null,"startArrowhead":null,"endArrowhead":"arrow","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bn","seed":163038416,"groupIds":[],"roundness":{"type":2},"status":"active","strokeSharpness":"sharp","optionsId":"default"}
```

## References

- [Original Article: Open source maintainership in the age of AI](https://kubernetes.io/blog/2026/06/26/open-source-maintainership-in-the-age-of-ai/)
- [Kubernetes AI Guidance for Pull Requests](https://www.kubernetes.dev/docs/guide/pull-requests/#ai-guidance)
- [CNCF CLA Tool](https://github.com/cncf/cla)
- [Kubernetes AI Code Review Tools Process](https://github.com/kubernetes/community/blob/main/github-management/ai-code-review-tools.md)
- [CNCF GitHub Copilot for Maintainers](https://contribute.cncf.io/blog/2025/12/16/github-copilot-enterprise-for-maintainers/)
