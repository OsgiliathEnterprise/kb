---
title: 'PRINCE (Bayer): Context and Harness Engineering in a Production Agentic RAG
  System'
diataxis: Explanation
domain: ai-machine-learning
topic: agent-architecture
source: MartinFowler
source_url: https://martinfowler.com/articles/reliable-llm-bayer.html
date: 2026-09-03
keywords:
- knowledge-base
- agent-architecture
- ai-machine-learning
- explanations
---
# PRINCE (Bayer): Context and Harness Engineering in a Production Agentic RAG System

A case study from Bayer AG + Thoughtworks on **PRINCE** (Preclinical Information Center), a cloud-hosted platform that answers complex questions over decades of preclinical safety-study data — unstructured PDF reports plus structured metadata. The durable lesson: production reliability comes less from better models and more from engineering two things explicitly — the **context** each model sees, and the **harness** (orchestration, recovery, observability) around it.

## Evolution: Search → Ask → Do

1. **Search:** unified gateway over thousands of nonclinical study reports; consolidated silos into searchable structured metadata with advanced filters.
2. **Ask:** RAG-based natural-language question answering over unstructured data (including scanned PDFs).
3. **Do:** multi-agent research assistant that orchestrates workflows and drafts regulatory documents — all outputs remain for expert review; final submissions are authored/approved by qualified personnel.

## Architecture at a glance

- **UI:** React conversational front-end showing intermediate steps, tool calls, and source links (transparency by design).
- **Orchestration:** LangGraph workflow engine served via FastAPI: Clarify Intent → Think & Plan → Researcher → Reflection → Writer, with deliberate pause points and feedback loops.
- **Data layer:** OpenSearch vector store for study-report embeddings; Amazon Athena for curated structured data (Text-to-SQL); PostgreSQL via a LangGraph checkpointer persisting state after every node execution; DynamoDB for application-level state.
- **Models:** internal GenAI platform hosting OpenAI/Anthropic/Google/open-source models behind one OpenAI-compatible endpoint — trivial model swapping per task, with rate limits and control-plane safeguards.
- **Resilience:** retries at both the LLM-call level and the logical-node level; automatic fallback to an alternative model/platform on failure; error context is fed back to agents so they can replan.
- **Observability/eval:** CloudWatch for system health; Langfuse traces all production traffic and hosts evaluation datasets; RAGAS metrics (Faithfulness, Answer Relevancy, Context Relevancy, Accuracy, Semantic Similarity) — daily batch eval on live traffic, dataset evals whenever workflow/prompts/models change.

## The agentic workflow: three distinct reflection loops

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {"id": "p1", "type": "rectangle", "x": 40, "y": 80, "width": 200, "height": 90, "strokeColor": "#1e1e1e", "backgroundColor": "#a5d8ff", "fillStyle": "solid", "strokeWidth": 2, "text": {"content": "Clarify Intent\nask clarifying questions,\nAI-suggested sources,\ndomain pre-filtering", "fontSize": 14, "fontFamily": 1}},
    {"id": "p2", "type": "rectangle", "x": 300, "y": 80, "width": 200, "height": 90, "strokeColor": "#1e1e1e", "backgroundColor": "#fff3bf", "fillStyle": "solid", "strokeWidth": 2, "text": {"content": "Think & Plan\nPROCESS reflection:\nright trajectory?\ncorrect tool choice?", "fontSize": 14, "fontFamily": 1}},
    {"id": "p3", "type": "rectangle", "x": 560, "y": 80, "width": 200, "height": 90, "strokeColor": "#1e1e1e", "backgroundColor": "#d9ccff", "fillStyle": "solid", "strokeWidth": 2, "text": {"content": "Researcher\nRAG (OpenSearch) +\nText-to-SQL (Athena),\ndomain sub-agents", "fontSize": 14, "fontFamily": 1}},
    {"id": "p4", "type": "rectangle", "x": 300, "y": 260, "width": 200, "height": 90, "strokeColor": "#1e1e1e", "backgroundColor": "#ffe8cc", "fillStyle": "solid", "strokeWidth": 2, "text": {"content": "Reflection Agent\nDATA reflection:\nis evidence sufficient?\ngenerate follow-ups", "fontSize": 14, "fontFamily": 1}},
    {"id": "p5", "type": "rectangle", "x": 560, "y": 260, "width": 200, "height": 90, "strokeColor": "#1e1e1e", "backgroundColor": "#b2f2bb", "fillStyle": "solid", "strokeWidth": 2, "text": {"content": "Writer Agent\nDRAFT reflection:\nsynthesize + cite,\nformatting rules,\ninternal review loop", "fontSize": 14, "fontFamily": 1}},
    {"id": "a1", "type": "arrow", "x": 240, "y": 125, "width": 60, "height": 0, "strokeColor": "#1e1e1e", "backgroundColor": "transparent", "fillStyle": "solid", "strokeWidth": 2, "points": [[0, 0], [60, 0]]},
    {"id": "a2", "type": "arrow", "x": 500, "y": 125, "width": 60, "height": 0, "strokeColor": "#1e1e1e", "backgroundColor": "transparent", "fillStyle": "solid", "strokeWidth": 2, "points": [[0, 0], [60, 0]]},
    {"id": "a3", "type": "arrow", "x": 400, "y": 170, "width": 0, "height": 90, "strokeColor": "#1e1e1e", "backgroundColor": "transparent", "fillStyle": "solid", "strokeWidth": 2, "points": [[0, 0], [0, 90]]},
    {"id": "a4", "type": "arrow", "x": 560, "y": 305, "width": -60, "height": 0, "strokeColor": "#1e1e1e", "backgroundColor": "transparent", "fillStyle": "solid", "strokeWidth": 2, "points": [[0, 0], [-60, 0]]},
    {"id": "a5", "type": "arrow", "x": 400, "y": 355, "width": -100, "height": -180, "strokeColor": "#e03131", "backgroundColor": "transparent", "fillStyle": "solid", "strokeWidth": 2, "points": [[0, 0], [-100, -180]]}
  ]
}
```

The three loops check different things and must not be conflated:

- **Process reflection (Think & Plan):** is the *workflow* on track? A dedicated thinking step (inspired by Anthropic's Think tool) reasons about tool selection when many overlapping tools exist, and sequences multi-step plans. This single change dramatically improved tool-selection accuracy as the toolset grew from 2 to many.
- **Data reflection (Reflection Agent):** is the *evidence* sufficient? Compares retrieved context against the original query; if gaps remain it generates specific follow-up questions that feed back into Think & Plan for further retrieval.
- **Draft reflection (Writer internal loop):** is the *output* complete? Draft → review step checks missing sections/inconsistent tables → targeted revision instructions.

## Context discipline: route, don't dump

Bigger context windows did not remove the need to be selective — early iterations that stuffed everything into one prompt became harder to steer and evaluate. PRINCE instead routes **different context to different stages**: planning context for Think & Plan, retrieval context for Researcher, evidence-only context (original question + collected evidence, *not* full workflow history) for Reflection, curated chunks with citation constraints for Writer. Each agent becomes independently evaluable, debuggable, and improvable.

## Query-time RAG pipeline (concrete numbers)

For a query like *"Were any of the following clinical findings observed in study T123456-2: piloerection, ataxia, eyes partially closed, loose faeces?"*:

1. **Keyword extraction** — LLM extracts search keywords ("piloerection", "ataxia", …).
2. **Metadata filter generation** — concurrently, few-shot-prompted LLM emits a structured filter like `eq(study_id, T123456-2)`, pre-filtering millions of vectors down to tens/hundreds.
3. **Query expansion** — smaller fast model generates n=5 semantically similar rephrasings (multi-query).
4. **Parallel hybrid search** — each expanded query runs one OpenSearch hybrid query (kNN + keyword), weighted **0.7 semantic / 0.3 keyword** (tuned experimentally); results aggregated, best score per unique chunk kept → k≈20 candidates.
5. **Rerank** — cross-encoder `bge-reranker-large` selects top **k=7**.
6. **Final prompt + cited response** — reasoning model answers with citations to chunks/study IDs (hover any sentence → source page and exact quote).

Ingestion side: PDFs (decades old, often scanned) → S3 data lake → extraction pipeline tuned for the corpus → normalized JSON → chunking that preserves scientific context → each chunk enriched with study/section metadata from Athena (study ID, compound, species, route, page, parent section) → embedded into OpenSearch.

## Text-to-SQL details worth stealing

- **Dynamic schema injection:** only query-relevant schema components enter the prompt — not the full database.
- **Semantic layer of examples:** hand-picked NL→Athena-SQL example pairs stored in a vector collection; relevant ones retrieved by similarity and injected as dynamic few-shot prompts; new examples added continuously from encountered failures.
- **Validation over LLM review:** generated SQL is validated against allowed operations (SELECT only; INSERT/UPDATE/DELETE blocked). An earlier *LLM-review* step was removed — the reviewer LLM flagged valid queries as erroneous, costing efficiency without accuracy gains.
- **Always include identifying columns** (study ID, title) so downstream synthesis can map rows correctly.
- **Result cap:** max 50 records per execution to prevent data flooding.
- **Error-driven retry loop:** on failure, the DB error + generated query + context go back to the same model; up to 3 attempts before reporting failure.

## Trust mechanisms for a regulated domain

- Intermediate steps (queries formulated, tools used) and shortlisted chunks are displayed to users with links to sources — verifiability is a feature, not an afterthought.
- Granular citations: sentence → source document + page number + exact supporting quote.
- Evaluation as a testing pyramid: stage-level metrics in addition to end-to-end; daily live-traffic evals catch production hallucinations without reference answers (Faithfulness/Answer Relevancy still computable).

## What transfers beyond pharma

1. **State persistence per node** (checkpointer) makes long agentic workflows resumable and debuggable — treat workflow state as a first-class data store, not in-memory scratch.
2. **Two-level retries + model fallback** is the difference between "demo" and "service".
3. **Domain sub-agents over one monolithic researcher:** each domain owns its toolset, schema knowledge, and prompt conventions; the top-level agent routes. Keeps cross-domain leakage down and makes per-domain testing tractable.
4. **Fail-fast clarification** beats expensive trial-and-error across all data sources when queries are ambiguous.

## References

- [MartinFowler.com: Building Reliable Agentic AI Systems (Bayer/Thoughtworks case study)](https://martinfowler.com/articles/reliable-llm-bayer.html)
- [Frontiers in Artificial Intelligence paper on PRINCE's product evolution and business impact](https://www.frontiersin.org/journals/artificial-intelligence/articles/10.3389/frai.2025.1636809/full)
