---
title: 'Question, Then Affirm: Restoring Commitment Does Not Restore Refusal'
diataxis: Explanation
domain: security-privacy
topic: ai-agent-security
source: arXiv
source_url: https://arxiv.org/abs/2611.25929
date: '2026-11-21'
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- explanations
---
# Question, Then Affirm: Restoring Commitment Does Not Restore Refusal

## Overview
Xu, Wang and Zhu (arXiv:2611.25929, submitted 2026-11-19) demonstrate a simple, semantics-preserving bypass of image-generation safeguards: a sign in a scene that **states** a harmful proposition is blocked, but the *same proposition* rendered as a **question followed by a checkmark** gets generated. The paper names the underlying failure **Deferred Semantic Commitment (DSC)** and argues that safeguards evaluate message elements in isolation instead of the completed message.

## Problem Statement
Text-to-image safety filters must judge whether an image *endorses* a proposition. When commitment to the proposition is split across two visual elements — the interrogative form withdraws commitment, a separate element (checkmark, tick) restores it — the pipeline appears to follow only the withdrawal and never re-attaches the commitment. Meaning is unchanged for a human reader; the safeguard's decision is not.

## Key Contribution
- Identifies and names **Deferred Semantic Commitment (DSC)**: commitment withdrawn at the proposition's location and restored elsewhere in the prompt.
- Shows that **preserving the proposition while removing commitment is the exploitable lever** — the safeguard keys on surface commitment, not the communicated endorsement.
- Establishes an evaluation principle: safeguards must assess **completed messages**, not isolated elements.

## Measured Results
On a 300-case challenge set:
| Prompt form | gpt-image-2 generates | Endorses the proposition |
|---|---|---|
| Direct statement (sign states proposition) | 16.3% | 15.3% |
| Question + affirmation (proposition as question + checkmark) | **43.3%** | **41.3%** |

Roughly a **2.7× increase** in both generation and endorsement rates at identical meaning. An open-weight language-model study probing refusal-related internal changes finds that **re-affirmation does not fully reverse the effect of being asked** — consistent with the safeguard having "already decided" at the question stage.

## Relevance to Our Domain
- For anyone building guardrail layers around multimodal generation: element-wise screening (per-segment classification) is structurally bypassable; add a final pass that judges the **assembled artifact**.
- This is the multimodal mirror of prompt-level jailbreaks where harmful content is fragmented across turns or fields — the same "commitment restoration" pattern applies to agent pipelines that concatenate or template user content before filtering.
- Concrete red-team test to add to any image-guardrail suite: statement vs question+affirmation pairs at matched semantics.

## References
- Paper: https://arxiv.org/abs/2611.25929
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.25929
- Related: [[explanation-jailbreak-classification-attack-surface]], [[explanation-structural-optimization-black-box-jailbreak]], [[reference-llm-guard-aws-guardrails-integration-patterns]]
