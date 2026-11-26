---
title: 'MemFolder: Structure-Guided Memory Folding for Efficient Agent Memory Management'
diataxis: How-to Guide
domain: ai-machine-learning
topic: agent-architecture
source: arXiv
source_url: https://arxiv.org/abs/2611.26427
date: 2026-11-19
keywords:
- knowledge-base
- agent-architecture
- ai-machine-learning
- how-to
---
# MemFolder: Structure-Guided Memory Folding for Efficient Agent Memory Management

## Overview
Long-running agents accumulate large external memory stores, and both costs grow with them: more records → slower retrieval, longer retrieved contexts → more prefill compute and decoding-time attention. MemFolder is a **structure-guided memory folding** framework that attacks both coupled factors *sequentially* — first reduce the record count, then shorten the context — using shared memory groups and cross-record structure to guide compression without the losses of pruning or naive consolidation.

## Problem Statement
Existing agent-memory efficiency methods either **prune** (risk discarding useful evidence) or **consolidate** (fewer units, but each becomes longer, so retrieval-context cost stays high). The two coupled costs — record count and retrieved-context length — need a joint strategy that preserves recoverable evidence.

## How to Fold Agent Memory with MemFolder
1. **Group by structure**: organize records into memory groups using cross-record structure (shared entities, semantics, temporal proximity). Both stages below share these groups.
2. **RecordFolder (reduce record count)**:
   a. **Ground entity mentions** across records to establish which records talk about the same entities.
   b. **Select representative yet complementary anchors** progressively — pick records that cover distinct evidence, not near-duplicates.
   c. **Consolidate compatible records** into fewer retrieval units by combining semantic affinity + entity affinity + temporal chaining.
3. **ContextFolder (shorten context)**:
   a. Encode the original records within each group into a **compact text** representation.
   b. **Verify recoverability**: run verification feedback — if key facts cannot be recovered from the compact encoding, revise the encoding until they can.
4. **Evaluate on recall-preserving compression metrics**: measure performance retention (% of original task performance) against record/token reduction, on benchmarks like LoCoMo, PersonaMem, LongMemEval (text) and M3-Bench-web / M3-Bench-robot (multimodal).

## Measured Effectiveness
- On **Mem0**, RecordFolder retains **99.0%** of average performance across three text memory benchmarks with **50% fewer records** — +1.9 points over the strongest baseline's retention.
- Combined with ContextFolder, existing record-compression methods further shorten their output records while retaining most performance (composable with prior approaches).
- Code: https://github.com/xuyang-liu16/MemFolder

## Design Principles Worth Stealing
- **Two-stage ordering**: count reduction before length reduction — consolidation targets are set before encodings are written.
- **Verification-feedback loop** on compression: never trust a summary until a checker confirms key facts survive.
- **Structure, not just semantics**: entity affinity and temporal chaining (not embeddings alone) decide what may be folded together.

## Relevance to Our Domain
Our own agent memory notes ([[explanation-anti-persistence-agent-memory]], [[explanation-coremem-cost-internalizing-repo-memory]], [[reference-ledger-auditable-agent-memory]]) cover what to store and audit; MemFolder is the concrete *compression* procedure — a drop-in recipe for cutting retrieval and prefill cost in long-horizon agent deployments.

## References
- Paper: https://arxiv.org/abs/2611.26427
- Code: https://github.com/xuyang-liu16/MemFolder
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.26427
