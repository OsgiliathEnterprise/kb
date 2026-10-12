---
title: Why an AI-Written Change Must Wait for Independent CI Evidence (Fail-Closed
  Gates)
diataxis: Explanation
domain: developer-tools-practices
topic: ci-performance
source: DEV.to Tech News
source_url: https://dev.to/aft-group/why-an-ai-written-change-waits-for-ci-evidence-3b4d
date: 2026-10-12
keywords:
- knowledge-base
- ci-performance
- developer-tools-practices
- explanations
---
# Why an AI-Written Change Must Wait for Independent CI Evidence (Fail-Closed Gates)

An AI-authored change can *look* complete long before it is safe to merge: the implementation is coherent, the explanation persuasive, every review comment resolved. None of that shows how the candidate actually behaved in the delivery pipeline. The lesson from running agent-assisted delivery at scale: **treat the merge gate as fail-closed — "not verified" means "not ready".**

## The author can't authorise the work

The authoring agent answers: *does this seem to have been understood and implemented plausibly?* CI answers a different question: *did this candidate pass the repository's configured checks in a controlled environment?*

The authoring agent can inspect its own reasoning, edits, and local tool output. That context helps while *implementing*, but it is **not independent of the artefact being assessed**. Creation and authorisation cannot sit inside the same trust boundary. A successful local command, an expectation that tests will pass, or a prediction by the authoring agent cannot fill a hole in the evidence chain.

For CI evidence to support advancement, it must identify:

- the **candidate** under consideration (bound to a commit, not "the latest"),
- the **pipeline run** that produced it,
- the **result of every required check** (a partial result is not a pass),
- a **verifiable status observed independently** of the author's claim.

A result for a different candidate doesn't verify the current one.

## What the recorded delivery data showed

Across recorded delivery activity: **93.2% of evidence records were verified**, all classified as independent. The source itself flags the limit: the population and the independence test are not defined, so 93.2% is a reported operational rate, not a reproducible measurement. The *policy* is what carries the weight: missing, stale, unattributable, or unverifiable evidence → the candidate waits, full stop.

Repository readiness was uneven, which is exactly why the gate must stay strict:

| Readiness control | Reported result |
| --- | --- |
| Presence of CI | 85.7% |
| Presence of an agent trigger | 85.7% |
| Checks for committed secrets | 28.6% |
| Default-branch protection | 14.3% |

Passing an *observation* assessment does not mean CI existed everywhere; uneven readiness makes evidence *harder* to produce, which is a reason to keep the gate strict, not a reason to loosen it.

## Planning, review, and CI answer different questions

- **Independent review** finds questionable logic and unsafe assumptions — but resolving a finding changes the candidate, which then needs *fresh* CI evidence. (Recorded findings: 57.3% blocking, 29.8% major.)
- **Planning** makes the intended implementation clearer — approved plans covered 48.1% of started changes — but says nothing about execution.
- **A green pipeline** records the outcome of the *configured* checks — but can't show the requested business behaviour is correct beyond those checks.

Repair attempts also need a boundary: 3.8% of changes needed a further pass; the same proportion exhausted the configured repair budget. When the process can't produce acceptable evidence within the limit, **more agent activity doesn't count as more confidence** — the limit stops unresolved candidates from sitting in an indefinite loop of edits and reassessment.

## Why it's worth the paused flow

- A waiting candidate stops **infrastructure faults, stale results, and missing signals from being reported as engineering success**.
- Leaders can distinguish changes that *passed the configured path* from changes *still waiting for evidence* — instead of the assurance level varying silently case by case.
- The cost (a paused merge) is cheap compared to merging on the author's say-so.

## References

- [Why an AI-written change waits for CI evidence (DEV.to, AFT Group)](https://dev.to/aft-group/why-an-ai-written-change-waits-for-ci-evidence-3b4d)
- [Where did the unfinished changes go? (companion post on agent delivery visibility)](https://dev.to/aft-group/where-did-the-unfinished-changes-go-35k2)
