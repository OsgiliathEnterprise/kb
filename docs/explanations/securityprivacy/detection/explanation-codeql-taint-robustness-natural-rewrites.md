---
title: Preserve the Vulnerability, Break the Alert — CodeQL Taint-Tracking Robustness
  Under Natural Rewrites
diataxis: Explanation
domain: security-privacy
topic: detection
source: arXiv
source_url: https://arxiv.org/abs/2611.17123
date: 2026-11-13
keywords:
- knowledge-base
- detection
- security-privacy
- explanations
---
# Preserve the Vulnerability, Break the Alert: Testing the Robustness of CodeQL Taint Tracking with Natural Rewrites

## Overview

When a SAST alert vanishes after a code change, teams almost always read it as "the vulnerability is fixed". This paper (Cao, Ding & Xu) shows that inference is unreliable for CodeQL's JavaScript taint tracking: an LLM, given **only the alert itself** and no knowledge of CodeQL's internals, can produce innocuous-looking refactorings that keep the flaw fully live while silencing the analyzer. Roughly a quarter of real detected vulnerabilities can be made invisible this way — turning alert disappearance into weak evidence of remediation.

## Problem Statement

Taint analyzers are evaluated on detection rate, but they function as *gates* in CI and code review, and a gate is also interpreted in reverse (no alert ⇒ safe). That reverse reading is only sound if the analyzer is **robust**: semantically equivalent, vulnerability-preserving edits must not change its verdict. Robustness had not been systematically measured for production taint trackers.

## Key Contribution

- **An LLM-driven robustness probe**: the model sees only the exposed alert and rewrites one function along the reported data flow as a plausible maintenance change; manual audit + controlled experiments verify the flaw survives and the alert disappears.
- **26.2% of 172 real npm vulnerability flows silenced** with three rewrites each, at ~USD 0.51 per silenced flow. A control condition — asking the same model to *just refactor*, without the alert — silences **zero** flows, proving the silencing is alert-directed, not incidental.
- **Root-cause taxonomy**: every silencing rewrite maps to one of **seven gaps at the library-modeling boundary**; 64 of 70 rewrites cross a gap *inside an API CodeQL already models*. The single largest gap is the WHATWG `URL` constructor, which propagates taint to query components but not to the pathname.
- **Not CodeQL-specific**: 74% of silencing rewrites also defeat an independently built taint analyzer; 53% escape three analyzers combined.

## Technical Approach

The methodology treats the analyzer as a black box: the LLM never sees CodeQL's implementation, only the source/sink/sanitizer information in the alert. Rewrites must pass plausibility review (they look like ordinary maintenance commits) and vulnerability-preservation is confirmed by manual audit and dynamic verification. The measured economics (~$0.51/silenced flow) make this a practical adversary — or a careless developer who pastes an alert into a chatbot — not a theoretical threat.

## Results

| Metric | Value |
|---|---|
| Detected flows tested (real npm CVEs) | 172 |
| Silenced by alert-aware rewrites | 26.2% |
| Silenced by alert-blind refactoring | 0 |
| Root-cause categories | 7 library-modeling gaps |
| Cross-analyzer escape (3 analyzers) | 53% |
| Cost per silenced flow | ~$0.51 |

## Relevance to Our Domain

For DevSecOps pipelines that use CodeQL as a merge gate, the operational lesson is: **treat alert disappearance after a non-remediation-looking change as a red flag, not a success**. Add robustness to natural rewrites as a standing evaluation axis for any taint tool, and review library-model extensions (especially URL handling) for missing taint propagation. This complements LLM-based analysis work in the KB (self-evolving static analysis, PatchBench) by exposing a failure mode *of* the analyzers themselves.

## References

- Paper: https://arxiv.org/abs/2611.17123
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.17123
- CodeQL library-model customization (background): https://codeql.github.com/docs/codeql-language-guides/customizing-library-models-for-java-and-kotlin/
- CodeQL JS TaintTracking standard library (the modeling surface the paper probes): https://codeql.github.com/codeql-standard-libraries/javascript/semmle/javascript/dataflow/TaintTracking.qll/module.TaintTracking$TaintTracking.html
- Related note: `how-to/securityprivacy/detection/` (self-evolving static analysis via LLM pseudo-labeling)
