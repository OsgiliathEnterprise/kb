---
title: 'Two-Stage RAG: Semantic Discovery Followed by Entity Validation'
diataxis: Explanation
domain: ai-machine-learning
topic: rag
source: DZone AI/ML
source_url: https://dzone.com/articles/two-stage-rag-java
date: 2026-11-27
keywords:
- knowledge-base
- rag
- ai-machine-learning
- explanations
---
# Two-Stage RAG: Semantic Discovery Followed by Entity Validation

## The core problem: relevance is not correctness

Standard RAG retrieves the *most semantically similar* passages and hands them to the LLM. But in enterprise settings the closest document is often the wrong one: policies evolve (revisions with effective dates), contracts expire, permissions differ per customer. A technically correct answer built from the *wrong revision* is still an inappropriate answer. Semantic similarity carries no notion of **policy authority or business applicability**.

The two-stage pattern splits retrieval into:

1. **Stage 1 — Semantic discovery:** embed the question, vector-search a store (e.g. Qdrant), and keep only the *candidate IDs* — not the payload text.
2. **Stage 2 — Entity retrieval + business validation:** load the authoritative domain entities behind those IDs (typed Java records), apply domain rules (e.g. effective-date checks), and only then convert surviving entities into LLM context.

```
Question ──embed──▶ Vector search (Qdrant) ──candidate UUIDs──▶ Load typed entities (JNoSQL)
                                                                        │
                                              Domain rules applied here ▼
                                              (appliesOn(date), state, permissions)
                                                                        │
                                              validated evidence only ▼──▶ LLM generation
```

(See the companion diagram: [explanation-two-stage-rag-semantic-discovery-entity-validation.excalidraw](explanation-two-stage-rag-semantic-discovery-entity-validation.svg))

> **Note on terminology:** in IR literature "two-stage retrieval" usually means retrieve-then-**rerank**. This pattern is different: the second stage re-fetches *entities* and enforces rules. Re-ranking alone cannot fix business-term or entity ambiguity — it can only reorder what retrieval already surfaced.

## Why reranking is not enough

A reranker reorders candidates by query-aware relevance; it still answers "what text is closest to the question?". The validation stage answers a different question: "which *enterprise object* is authoritative for this request at this business date?". Conflating the two leaves relevance to be mistaken for correctness when a search result is accepted as final evidence.

## Worked example: the right policy at the right time

A card-dispute policy allows reporting unauthorized transactions within **30 days**; a revision effective **2026-07-01** extends the window to **60 days**. Both revisions are textually near-identical, so a plain vector search may return either. A 45-day report requires the *old* rule if the business event predates July 1 and the *new* rule otherwise. Key design decisions:

- Each revision has a unique `UUID` (immutable fact); a stable `policyCode` identifies the policy across revisions.
- `effectiveFrom` is inclusive, `effectiveUntil` exclusive (null = open-ended).
- The **application** supplies a trusted `LocalDate` for the business event. Choosing which date governs (transaction date vs. report date) is a domain requirement, *not* something the LLM can infer from free text.

## Java implementation highlights (LangChain4j + Eclipse JNoSQL 1.2.0 + Qdrant)

The domain entity is an immutable Java record that owns its applicability rule:

```java
@Entity("policies")
public record Policy(
        @Id UUID id,
        @Column String policyCode,
        @Column String title,
        @Column String content,
        @Column String department,
        @Column String version,
        @Column LocalDate effectiveFrom,
        @Column @Convert(OpenEndedDateConverter.class)
        LocalDate effectiveUntil,
        @Column Vector embedding) {

    public boolean appliesOn(LocalDate date) {
        return !date.isBefore(effectiveFrom)
                && (effectiveUntil == null || date.isBefore(effectiveUntil));
    }
}
```

**Ingestion contract:** produce the embedding, associate it with a business entity, persist a stable revision. Only `title + content` are embedded (for discovery); dates and version stay as *typed fields for validation*. Embeddings capture semantic relationships but do not replace exact dates, identity, or permissions. A local `AllMiniLmL6V2` model produces 384-dimensional vectors; existing `UUID`s are never overwritten (revision immutability).

**Stage 1** returns candidate IDs only:

```java
private List<UUID> semanticCandidates(Query query) {
    var embedding = embeddingModel.embed(query.text()).content();
    var request = EmbeddingSearchRequest.builder()
            .queryEmbedding(embedding)
            .maxResults(maxResults)
            .build();
    return embeddingStore.search(request).matches().stream()
            .map(EmbeddingMatch::embeddingId)
            .map(UUID::fromString)
            .toList();
}
```

**Stage 2** crosses the architectural boundary: JNoSQL's `VectorTemplate` loads each `Policy`, drops missing records, invokes `appliesOn(trustedDate)`, and converts only applicable entities to LangChain4j content. Vector store and entity store share a **single Qdrant collection** — the two stages are distinct *responsibilities*, not separate databases.

## Ownership boundaries (the real payoff)

- Search engines → find likely matches
- Domain entities and application services → enforce business constraints
- LLMs → generate explanations/recommendations **from provided evidence only**

This division makes decisions testable: for the same question type, changing the trusted business date must select a different revision, and an unrelated question must not create a new policy.

## Honest costs and limits

- Extra database round-trips and latency per query.
- If authorization is checked only *after* vector discovery, sensitive data can still leak through retrieval metadata, logs, or generated context.
- Concurrent policy changes create consistency windows between the vector index and authoritative records.
- Observable systems should log which revision IDs were selected/rejected and what evidence reached the model — without indiscriminate logging of sensitive data.
- The pattern is not unique to this stack (plain RAG can add metadata filters too), and "two-stage" does not inherently improve factual accuracy. It provides a **defined place** to enforce business applicability; evaluations must show whether that pays off.

## Related

- Existing note on citation faithfulness: [Cited but Unused: Parametric Provenance in RAG](explanation-cited-but-unused-attribution-gaps-rag.md) — same theme: retrieval relevance ≠ evidential causation.
- Hybrid search retrieval stage: [Hybrid Search: BM25 + RRF](../../../how-to/aimachinelearning/rag/howto-hybrid-search-bm25-rrf.md) — composes as a *pre-stage* to this validation stage.

## References

- [DZone: Beyond Semantic Similarity: Designing Two-Stage RAG With Java](https://dzone.com/articles/two-stage-rag-java) — original article
- [Runnable example on GitHub (jnosql-langchain4j-rag-se)](https://github.com/otaviojava/jnosql-langchain4j-rag-se) — complete Maven project with local Qdrant setup
- [Eclipse JNoSQL](https://www.jnosql.org/), [Jakarta NoSQL spec](https://jakarta.ee/specifications/nosql/), [Jakarta Data](https://jakarta.ee/specifications/data/)
- [LangChain4j documentation](https://docs.langchain4j.dev/) and [Qdrant documentation](https://qdrant.tech/documentation/)
- Cross-check (2026-11-27): rerankers cannot resolve business-term/entity ambiguity — confirmed by multiple 2026 enterprise-RAG architecture write-ups that add entity binding and policy validation as distinct pipeline stages.
