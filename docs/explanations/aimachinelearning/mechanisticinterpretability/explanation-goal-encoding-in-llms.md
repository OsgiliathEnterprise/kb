---
title: "Goal Encoding in LLMs — How Transformers Represent and Pursue Goals Without Recurrence"
diataxis: Explanation
domain: AI & Machine Learning
topic: Mechanistic Interpretability
source: "arXiv"
source_url: "https://arxiv.org/abs/2611.17297"
arxiv_id: "2611.17297"
date: 2026-11-13
keywords:
- knowledge-base
- Mechanistic Interpretability
- AI & Machine Learning
- explanations
- goal representations
- attention heads
visibility: public
---
# Goal Encoding in LLMs

## Overview
This paper from the Bau group (Cornell, with collaborators) investigates a question at the heart of agentic reliability: do LLMs actually maintain an internal representation of the *goal* they are pursuing, and if so, where and how? Using a controlled multi-subtask coding environment, the authors localize goal information in a sparse set of attention heads, show that this encoding causally determines the model's next action, and propose a striking account of how a feed-forward transformer sustains goal-directed behavior over long horizons: it doesn't carry state forward — it repeatedly *re-reads* the goal from the prompt.

## Problem Statement
Agency requires a goal representation that (1) precedes and guides action, and (2) is flexible enough to be realized through many different execution paths. Transformers have no explicit goal register, and a non-recurrent architecture cannot carry an internal state forward for more tokens than it has layers left. Yet LLM agents visibly pursue multi-step goals. Understanding this apparent contradiction matters for agent design: if goal pursuit is fragile or context-dependent, agent failures ("going off-plan") may be architectural rather than prompt-level.

## Key Contribution
- **Localization**: an encoding of the *next sub-goal* lives in the outputs of a sparse set of attention heads; the same heads can decode the model's future actions in natural language (e.g., "I'm checking if a word is a palindrome").
- **Causality and plasticity**: interventions verify the encoding is causal for the next action, and it is environment-plastic — transplanting the encoding into a different environment (e.g., another programming language) triggers the same operation with a different token sequence.
- **Non-Recurrent Goal-Seeking (NRGS)**: the puzzle of sustained goal state is resolved by proposing that the LM frequently re-reads the goal from the task specification, compares it against visible progress in the growing context, and pursues what remains — validated with targeted causal interventions.

## Technical Approach
The authors build a coding setting composed of multiple sub-tasks, which makes goal-seeking behavior and sub-goal selection measurable. They combine activation decoding (probing head outputs), causal interventions (activations transplants across environments and contexts), and prediction-testing experiments against the NRGS account. Code, data and a project page are released (goals.baulab.info).

## Results
- Next sub-goal decodable from a sparse set of attention heads; same heads decode future actions as natural-language descriptions.
- Transplanting head activations causes the model to execute the transplanted goal's operation in a different environment — evidence the representation is abstract, not surface-token-bound.
- Predictions of the re-reading (NRGS) account hold under intervention, explaining sustained goal pursuit beyond the layer-count state limit.

## Relevance to Our Domain
For anyone operating LLM agents in production, this work gives a mechanistic explanation for two everyday phenomena: why long-running agents "drift" when the task specification scrolls out of effective attention reach, and why restating the objective in the context (or in a persistent plan file) measurably helps. The NRGS account implies practical agent-harness heuristics: keep the goal specification in view, keep progress signals legible in the transcript, and treat the context window as the agent's working memory rather than trusting hidden state. It also complements our notes on agent memory (anti-persistence, CoReMem) with a from-the-inside view of where "planning" physically lives.

## References
- Paper: https://arxiv.org/abs/2611.17297
- Project page, code and data: https://goals.baulab.info/
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.17297
