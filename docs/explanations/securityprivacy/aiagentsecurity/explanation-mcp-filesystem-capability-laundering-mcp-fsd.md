---
title: 'MCP-FSD: Detecting Filesystem Capability Laundering in MCP Servers at Scale'
diataxis: Explanation
domain: security-privacy
topic: ai-agent-security
source: 'arXiv: MCP-FSD: Detecting Filesystem Capability Laundering in MCP Servers
  at Scale (arXiv:2610.22301)'
source_url: https://arxiv.org/abs/2610.22301
date: 2026-10-18
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- explanations
---
# MCP-FSD: Filesystem Capability Laundering in MCP Servers

## Overview

This paper (cs.CR, 2026) introduces **MCP-FSD**, the first large-scale study of *filesystem capability laundering* in Model Context Protocol (MCP) servers. The core idea: an MCP server that exposes filesystem tooling effectively "launders" broad host-filesystem access through the agent's tool interface — a sandbox or permission model that looks reasonable at the server level can still let a compromised or malicious server reach files it was never meant to touch. The authors analyzed **21,097 MCP servers** — to our knowledge the largest corpus of MCP servers ever studied — and built a detection framework that flags servers whose declared capabilities do not match their actual filesystem reach.

## Problem Statement

MCP has become the de facto way AI agents call external tools. Security guidance for MCP tends to focus on individual server bugs (the January 2026 disclosure of three flaws in Anthropic's Git MCP server, and sandbox-escape flaws in the Filesystem MCP server, are representative). But there is no systematic answer to a simpler question: **what fraction of the MCP ecosystem actually grants filesystem capability, and which of those servers expose it in ways that bypass intended access restrictions?** Without that baseline, operators cannot know whether their MCP fleet is merely *large* or actively *laundering* host access.

## Key Contribution

- **A vulnerability class definition**: filesystem capability laundering — the systematic gap between a server's declared tool surface and its effective filesystem reach.
- **The MCP-FSD detection framework**: combines server manifest analysis with behavior classification to separate benign filesystem tooling from capability-laundering configurations.
- **An ecosystem-wide baseline**: of 4,806 triaged servers, **787 (16.4%) expose filesystem capabilities**; the framework identifies **150 vulnerable instances**.
- **13 security advisories** produced as a direct output, including **2 CVEs in Anthropic's Git MCP Server**.

## Technical Approach

MCP-FSD operates at three levels: (1) a large-scale crawl of public MCP server registries (21,097 servers) to measure capability prevalence; (2) static + configuration analysis of each filesystem-capable server to classify how files are reached (direct path tools, sandboxed roots, git-hook side channels, etc.); and (3) a triage pipeline that converts candidate findings into reviewable advisories, distinguishing true capability laundering from legitimate read-only or root-scoped tooling. The 16.4% prevalence figure comes from the triage of the 4,806 servers that passed the initial filtering.

## Results

| Metric | Value |
|--------|-------|
| Servers analyzed | 21,097 |
| Servers triaged in depth | 4,806 |
| Servers exposing filesystem capabilities | 787 (16.4%) |
| Vulnerable instances identified | 150 |
| Advisories issued | 13 (including 2 CVEs in Anthropic's Git MCP Server) |

## Relevance to Our Domain

MCP is now the standard integration surface for AI agents (see the [MCP](../../../how-to/developertoolspractices/mcp) notes in this KB). This paper shifts the MCP security question from "which servers have bugs" to "what does the ecosystem structurally allow." For anyone running an MCP fleet, the practical takeaway is that a **declared tool surface is not a security boundary**: filesystem-capable servers need root scoping, egress controls, and — for git-backed servers — filter/hook inspection, because a clean-looking `.git/config` can carry a sandbox escape. The prevalence numbers (16.4% filesystem-capable, 150 vulnerable) give a concrete prior for MCP fleet risk assessments.

## References

- Paper: https://arxiv.org/abs/2610.22301
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2610.22301
- Context: Anthropic MCP Git Server flaws (The Hacker News, 2026-01) — three flaws enabling file access and code execution
- Context: Filesystem MCP server sandbox-escape vulnerabilities (Red Hat MCP security overview; CyberSecurityNews)
