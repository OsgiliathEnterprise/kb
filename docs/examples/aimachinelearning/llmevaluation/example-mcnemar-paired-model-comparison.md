---
title: McNemar's Test for Model Comparison on a Fixed Eval Set (Exact p-value in 15
  Lines)
diataxis: Example
domain: ai-machine-learning
topic: llm-evaluation
source: DEV.to Tech News
source_url: https://dev.to/academicquant/is-the-new-model-really-better-mcnemars-test-on-a-200-example-eval-set-3cg
date: '2026-11-28'
keywords:
- knowledge-base
- llm-evaluation
- ai-machine-learning
- examples
---
# McNemar's Test for Model Comparison on a Fixed Eval Set (Exact p-value in 15 Lines)

When old and new models answer the **same** eval set, comparing accuracies as independent samples is the wrong test. Examples where both models agree (both right or both wrong) carry no information about which model is better — only the **disagreements** count.

## Setup

Let `n_ab` = examples the old model got right and the new one wrong; `n_ba` = the reverse. If the models are equally good, each disagreement is a coin flip, so `n_ab ~ Binomial(n, 1/2)` with `n = n_ab + n_ba`. McNemar's exact test asks how likely a split at least that lopsided is.

```python
from math import comb

def mcnemar_p_value(y, a, b):
    n_ab = n_ba = 0
    for t, p, q in zip(y, a, b):
        if p == t and q != t:
            n_ab += 1
        elif q == t and p != t:
            n_ba += 1
    n = n_ab + n_ba
    if n == 0:
        return 1.0
    k = min(n_ab, n_ba)
    tail = sum(comb(n, j) for j in range(k + 1))
    return min(1.0, 2 * tail / 2 ** n)
```

Exact, a few lines, and Python's arbitrary-precision integers mean no rounding until the last division. (Numbers below re-verified by running this code.)

## Same headline gain, different significance

- New model wins 14 disagreements, loses 4 → net +10/200 (+5 pts), **p ≈ 0.031**.
- Wins 18, loses 8 → same net +10, same +5 pts, **p ≈ 0.076**.

Always log the won/lost disagreement counts next to the accuracy — the accuracy delta alone hides this distinction.

## Power: how big must the eval set be?

Simulation (old right/new wrong 3%, new right/old wrong 8%, so true accuracies 80% vs 85%; both tests at the 5% level):

| Scenario | McNemar (paired) | Two-proportion z test (unpaired) |
| --- | --- | --- |
| New model really 5 pts better, n=200 (10,000 runs) | caught 49.5% | caught 14.8% |
| Models equally good (5.5% each way) | false alarm 3.1% | false alarm 0.08% |
| n=400 (3,000 runs) | caught 84% | caught 43% |
| n=600 (3,000 runs) | caught 96% | caught 70% |

The paired test finds a real gain >3x as often — the unpaired test treats model agreement as noise. Still, **200 examples is too few to reliably detect a 5-point gain** (~50% power).

## Practical rules

- **Keep the eval set fixed and versioned.** Swapping examples between runs breaks the pairing and forces you back to the weak unpaired test.
- **Multi-class:** both models can be wrong in different ways and that still counts as "both wrong" — compare each prediction against the label, never against each other.
- **Chi-squared vs exact:** the chi-squared approximation is fine with many disagreements; below ~25, use the exact binomial sum (it costs nothing).
- **Multiple comparisons:** comparing 5 models pairwise = 10 tests; one p &lt; 0.05 in ten tests means little on its own.

## References

- [Is the new model really better? McNemar's test on a 200-example eval set (DEV.to)](https://dev.to/academicquant/is-the-new-model-really-better-mcnemars-test-on-a-200-example-eval-set-3cg)
- [Practice problem with browser checks (AcademicQuant)](https://academicquant.co.uk/ml-mcnemar-test)
