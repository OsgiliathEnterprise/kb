---
title: 'Example: Agentic Fraud Investigation System — TigerGraph Graph + 11 Specialized
  AI Agents'
diataxis: Example
domain: ai-machine-learning
topic: multi-agent-systems
source: DEV.to Tech News
source_url: https://dev.to/pritha_pal_14bfa4d9871f59/building-an-agentic-fraud-investigation-system-with-tigergraph-and-11-ai-agents-29c7
date: 2026-09-25
keywords:
- knowledge-base
- multi-agent-systems
- ai-machine-learning
- examples
---
# Example: Agentic Fraud Investigation System — TigerGraph Graph + 11 Specialized AI Agents

A concrete reference architecture for moving a fraud analyst from "suspicious transaction" to evidence-backed recommendation in one workflow. The system combines a graph database (TigerGraph), eleven specialized AI agents, and an LLM chat interface.

## Why graph-based instead of per-transaction scoring

Fraud networks are relational: a single transaction connects to a customer, card, device, email domain, billing region, previous cases, and other transactions. A suspicious transaction becomes much more interesting when you discover the same device is tied to multiple customers, several cards share one device, or an account links to previously confirmed fraud. The question shifts from "is this transaction risky?" (a score) to "what is this connected to, and do those connections add evidence?"

## Investigation pipeline

```
Suspicious Transaction
        ↓
Create Investigation Case
        ↓
Collect Relevant Information
        ↓
Explore Graph Relationships
        ↓
Check Previous Cases
        ↓
Identify Fraud Patterns
        ↓
Evaluate Evidence
        ↓
Check if More Evidence is Needed   ← loop back when insufficient
        ↓
Recommend Next Best Action
        ↓
Save Investigation Result
```

The analyst drives the whole thing through a chat interface ("Why was this transaction flagged?") and also gets: active cases, chat history, agent activity log, the TigerGraph evidence graph, recommended actions, and an approve/reject workflow.

## Layered architecture

```
┌──────────────────────────────────────┐
│             React UI                 │  Chat | Cases | Agents | Graph | Actions
└──────────────────┬───────────────────┘
                   ▼
┌──────────────────────────────────────┐
│       Investigation Application      │  Case mgmt, chat processing,
│                                      │  agent coordination, evidence handling
└──────────────────┬───────────────────┘
                   ▼
┌──────────────────────────────────────┐
│          11 AI Agents                │  Coordinator, Graph Analysis,
│                                      │  Transaction/Fraud/Evidence/Case Analysis...
└───────────────┬──────────────┬───────┘
                ▼              ▼
        ┌──────────────┐  ┌──────────────┐
        │   TigerGraph │  │  LLM Runtime │
        └──────────────┘  └──────────────┘
```

- **Frontend** presents the investigation; **agent layer** does reasoning and task execution; **TigerGraph** is the relationship/evidence layer (not just storage); **LLM runtime** provides the natural-language interface and helps agents interpret retrieved data.

## Graph model

Entities: `Customer`, `Card`, `Transaction`, `Device`, `EmailDomain`, `BillingRegion`, `ClosedCase`. Relationships:

```
Customer ──owns──> Card
Customer ──makes──> Transaction
Transaction ──uses──> Device
Customer ──uses──> Device
Customer ──has──> EmailDomain
Customer ──belongs_to──> BillingRegion
Customer ──related_to──> ClosedCase
```

Worked example — transaction `T123` flagged:

```
T123
 ├── Customer C42
 │    ├── Device D17 ── used by Customer C91   ← shared device across customers
 │    └── Card X92
 └── Previous Case #102                          ← linked to confirmed fraud
```

That context is exactly what a single transaction row can't show.

## Design points worth stealing

- **Coordinator + specialist agents** rather than one mega-agent: each agent owns one investigation step (graph exploration, pattern identification, evidence evaluation), coordinated by an Investigation Coordinator.
- **Graph as first-class reasoning substrate**: agents query relationships instead of re-deriving connections from flat tables; the graph doubles as the *evidence* artifact shown to the analyst.
- **Human approval gate** on recommendations — the system recommends a next best action, the analyst approves/rejects.
- **Evidence-sufficiency loop**: "check if more evidence is needed" feeds back into collection/exploration instead of forcing a decision on thin data.

## Graph-native detection patterns this architecture enables

The graph model above isn't just storage — it lets the agents ask questions that row-based systems can't express without expensive joins:

- **Collusion**: groups of accounts transacting in coordinated patterns, often sharing IPs, devices, or referral codes. The shared-device edge (`Customer ──uses──> Device`) is exactly what surfaces this.
- **Synthetic identities**: phone numbers or email domains reused across multiple applications/accounts — the `EmailDomain` and `Device` nodes make cross-application reuse a one-hop query instead of a global scan.
- **Mule networks & circular flows**: layered transaction chains where funds move through intermediate accounts; graph traversal (multi-hop reasoning) detects the cycle, which per-transaction scoring never sees because each hop looks individually normal.
- **Proximity to known risk**: "is this account one hop from a confirmed fraud ring?" — the `Customer ──related_to──> ClosedCase` edge turns historical cases into live context for new transactions.

The key distinction: traditional systems score *rows* (one transaction at a time, threshold-based); graph-native detection reasons about *structure* (who is connected to whom, and what do those connections imply). Modern fraud is designed to look normal event-by-event — the signal lives in the network, not any single row.

## Where this sits in the research landscape

The coordinator + specialist-agent pattern over a graph substrate aligns with an active 2025–2026 research direction: **LLM-enhanced graph fraud detection** (e.g., multi-level LLM-augmented GNN pipelines at ACM MM 2025, LLM-enhanced graph anomaly detection at KDD 2025). The common shape is the same as this example system — a graph model provides relational context, and LLM agents translate that structure into narratives and decisions. A curated paper list tracking this space: [safe-graph/graph-fraud-detection-papers](https://github.com/safe-graph/graph-fraud-detection-papers) (includes an interactive dashboard and a RAG-based chatbot over ~250 papers).

## References

- [DEV.to — Building an Agentic Fraud Investigation System with TigerGraph and 11 AI Agents](https://dev.to/pritha_pal_14bfa4d9871f59/building-an-agentic-fraud-investigation-system-with-tigergraph-and-11-ai-agents-29c7)
- [TigerGraph — Fraud Detection with Graph (glossary)](https://www.tigergraph.com/glossary/fraud-detection-with-graph/)
- [safe-graph/graph-fraud-detection-papers — curated list of graph/LLM fraud detection papers](https://github.com/safe-graph/graph-fraud-detection-papers)
