---
title: 'Building Reliable Agentic AI Systems: The PRINCE Case Study'
diataxis: Explanation
domain: AI-Infrastructure
topic: AI-Engineering
source: Martin Fowler / Thoughtworks
source_url: https://martinfowler.com/articles/reliable-llm-bayer.html
date: 2026-06-21
keywords:
- knowledge-base
- AI-Engineering
- AI-Infrastructure
- explanations
---
# Building Reliable Agentic AI Systems: The PRINCE Case Study

## Overview

This note documents the architecture and engineering decisions behind PRINCE (Preclinical Information Center), a production-ready agentic AI system developed by Bayer AG with Thoughtworks. The system demonstrates how to build reliable, multi-agent RAG systems for regulated environments where trust, traceability, and recovery matter.

**Key insight**: Production-ready agentic AI is not just about better models or better prompts. Reliability comes from engineering both the **context** the model sees and the **harness** within which the model acts.

## The Two Engineering Lenses

### Context Engineering
Shaped what information each model received, what it did not receive, and how context moved between specialized steps (research, reflection, writing).

### Harness Engineering
Shaped the scaffolding around the models: orchestration, tool boundaries, state persistence, retries, fallbacks, validation, reflection loops, observability, and human review.

## System Evolution: Search → Ask → Do

| Phase | Capability | Technology |
|-------|-----------|------------|
| **Search** | Unified gateway to study reports via structured metadata | Filter-based search |
| **Ask** | Natural language Q&A over unstructured PDF reports | RAG with vector search |
| **Do** | Active research assistant for complex tasks | Multi-agent orchestration |

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PRINCE System Architecture                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐    ┌──────────────────┐    ┌─────────────────┐   │
│  │ Conversational│    │  LangGraph       │    │  Data Stores    │   │
│  │ UI (React)   │───▶│  Orchestration   │───▶│  OpenSearch     │   │
│  └──────────────┘    │  Layer (FastAPI) │    │  (Vector DB)    │   │
│                      └────────┬─────────┘    └────────┬────────┘   │
│                               │                       │            │
│                      ┌────────▼─────────┐    ┌────────▼────────┐   │
│                      │  Agent Workflow   │    │  Athena         │   │
│                      │  (LangGraph)     │    │  (Structured    │   │
│                      └────────┬─────────┘    │   Data)         │   │
│                               │              └─────────────────┘   │
│                      ┌────────▼─────────┐    ┌─────────────────┐   │
│                      │  State Mgmt      │    │  LLM Platform   │   │
│                      │  PostgreSQL +    │    │  (OpenAI/       │   │
│                      │  DynamoDB        │    │   Anthropic/    │   │
│                      └──────────────────┘    │   Google/ OSS)  │   │
│                                              └─────────────────┘   │
│                                                                     │
│  Observability: Langfuse (traces) + CloudWatch (metrics)           │
│  Evaluation: RAGAS framework (daily live traffic + dataset eval)  │
└─────────────────────────────────────────────────────────────────────┘
```

## The Agentic RAG Workflow

### Five-Stage Pipeline

1. **Clarify User Intent** — Proactively asks clarifying questions to pinpoint domain/data type before any retrieval
2. **Think & Plan** — Process reflection: evaluates whether the agent is on the right trajectory
3. **Research** — Hybrid retrieval (RAG + Text-to-SQL) via domain-specific sub-agents
4. **Reflection** — Data validation: checks whether gathered evidence is sufficient
5. **Writer** — Answer synthesis with citation constraints

### Three Complementary Reflection Loops

| Reflection Type | Agent | Checks For |
|----------------|-------|-----------|
| **Process Reflection** | Think & Plan | Bad trajectory, wrong tool choice, poor sequencing |
| **Data Reflection** | Reflection Agent | Thin evidence, missing context, gaps in coverage |
| **Draft Reflection** | Writer Agent | Missing sections, incomplete tables, synthesis gaps |

## Context Discipline Pattern

The system does NOT treat the prompt as one large container for all available information. Instead:

```
┌─────────────────────────────────────────────────────────────┐
│                    Context Routing Strategy                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Think & Plan  ──▶ Planning Context (workflow state, tools)  │
│  Researcher    ──▶ Retrieval Context (query, schema subset)  │
│  Reflection    ──▶ Evidence Context (original Q + data)      │
│  Writer        ──▶ Synthesis Context (curated chunks + Q)    │
│                                                             │
│  Key: Each agent sees ONLY what it needs, reducing           │
│  context pollution and making evaluation/debugging easier   │
└─────────────────────────────────────────────────────────────┘
```

## Hybrid Retrieval Architecture

### RAG Pipeline (Unstructured Data)

```
User Query
    │
    ├─▶ Keyword Extraction (LLM) ──▶ Keywords
    ├─▶ Metadata Filter Generation (LLM) ──▶ eq(study_id, T123456-2)
    └─▶ Query Expansion (smaller model) ──▶ 5 semantically similar queries
            │
            ▼
    Hybrid Search (OpenSearch): 0.7 semantic + 0.3 keyword
            │
            ▼
    ~20 chunks retrieved
            │
            ▼
    Reranker (bge-reranker-large cross-encoder)
            │
            ▼
    Top 7 chunks → Final LLM Prompt → Response with Citations
```

### Text-to-SQL Pipeline (Structured Data)

```
User Query
    │
    ▼
Query Analysis & Intent Recognition
    │
    ▼
Dynamic Schema Selection (only relevant schema components)
    │
    ▼
Dynamic Few-Shot Prompting (examples from vector DB)
    │
    ▼
SQL Generation → Validation (SELECT only, no DELETE/INSERT/UPDATE)
    │
    ▼
Execution (Athena) → Max 50 records
    │
    ▼
Error? → Retry up to 3 times with error context
```

## Resilience and Error Handling

### Multi-Level Retry Strategy

| Level | Mechanism | Purpose |
|-------|-----------|---------|
| **LLM Call** | Automatic retries with fallback models | Transient API failures |
| **Node Level** | Retry entire workflow step | Step-level failures |
| **User Level** | Manual retry from persisted state | Recovery from user perspective |

### State Persistence

- **Agent State**: PostgreSQL via LangGraph checkpointer (workflow progress)
- **Application State**: DynamoDB (logs, intermediate steps, citations)
- **Benefit**: Resume from failed node, skip successfully completed steps

### LLM Fallback Chain

```
Primary LLM → Retry (3x) → Fallback Model (different provider) → Error
```

## Evaluation Framework

### Dataset Evaluations (Pre-Change)
Triggered by: Workflow changes, prompt updates, model swaps

| Metric | Measures |
|--------|----------|
| **Faithfulness** | Answer supported by context |
| **Answer Relevancy** | Addresses the query |
| **Context Relevancy** | Retrieved chunks are relevant |
| **Answer Accuracy** | Comparison to ground truth |
| **Semantic Similarity** | Match to reference answer |

### Live Traffic Evaluations (Daily)
- Batch job on real user queries
- Metrics: Faithfulness, Answer Relevancy
- Detects: Hallucinations, drift, edge cases

## Key Engineering Decisions and Trade-offs

1. **Removed LLM SQL Review Step**: The reviewing LLM sometimes incorrectly flagged valid queries as erroneous, hindering efficiency without commensurate accuracy gain.

2. **Domain-Specific Sub-Agents**: Instead of one monolithic Researcher agent, evolving to hierarchy of domain agents (toxicology, pharmacology, etc.) to reduce cross-domain leakage.

3. **Cost Optimization After Accuracy**: Prioritized achieving desired accuracy first, only then optimized for cost.

4. **Context Discipline Over Context Size**: Larger context windows did not remove the need for selectivity. Too much context made the system harder to steer and evaluate.

## Lessons for Production Agentic AI

1. **Separation of Concerns**: Different agents for different tasks (research, reflection, writing) enables isolated evaluation and improvement.

2. **Explicit Control Points**: The LangGraph workflow provides clear control points for recovery, inspection, evaluation, and human intervention.

3. **Observability is Non-Negotiable**: Langfuse traces + CloudWatch metrics + daily evaluation = ability to detect and fix issues proactively.

4. **Human-in-the-Loop**: All regulatory outputs require expert review; AI assists but does not replace qualified personnel.

5. **Iterative Development**: Deliver value early, refine continuously based on real-world feedback.

## References

- [Building Reliable Agentic AI Systems (Martin Fowler)](https://martinfowler.com/articles/reliable-llm-bayer.html)
- [PRINCE Paper in Frontiers in AI](https://www.frontiersin.org/) (product evolution and business impact)
- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [RAGAS Evaluation Framework](https://docs.ragas.io/)
- [Langfuse Observability](https://langfuse.com/)
