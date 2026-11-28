---
title: 'Clopper-Pearson in Pure Python: Three Silent Failure Modes and the Numbers
  That Catch Them'
diataxis: Example
domain: data-science
topic: ab-testing
source: DEV.to Tech News
source_url: https://dev.to/howcani_howcani_77e786a89/i-got-clopper-pearson-wrong-three-times-in-one-afternoon-here-are-the-numbers-that-catch-it-1jnj
date: '2026-11-28'
keywords:
- knowledge-base
- ab-testing
- data-science
- examples
---
# Clopper-Pearson in Pure Python: Three Silent Failure Modes and the Numbers That Catch Them

A 95% binomial confidence interval via Clopper-Pearson ("invert the binomial test at each end") is a two-sentence idea that can be implemented wrong in several ways **without raising a single exception** — every wrong version prints plausible percentages. The defense is a handful of hand-checkable known values.

## The version that passes (verified by execution)

```python
from math import comb

def cdf(k, n, p):
    """P(X <= k) for X ~ Binomial(n, p).  DECREASING in p."""
    if p <= 0.0:
        return 1.0
    if p >= 1.0:
        return 0.0 if k < n else 1.0
    return sum(comb(n, i) * p**i * (1 - p)**(n - i) for i in range(k + 1))

def root_decreasing(f, target):
    """f strictly decreasing on [0,1]; return p with f(p) == target."""
    lo, hi = 0.0, 1.0
    for _ in range(300):
        mid = (lo + hi) / 2
        if f(mid) > target:
            lo = mid
        else:
            hi = mid
    return (lo + hi) / 2

def cp(k, n, conf=0.95):
    a = 1 - conf
    lower = 0.0 if k == 0 else root_decreasing(lambda p: cdf(k - 1, n, p), 1 - a / 2)
    upper = 1.0 if k == n else root_decreasing(lambda p: cdf(k,     n, p), a / 2)
    return 100 * lower, 100 * upper
```

Two facts do all the work:

1. **The binomial CDF is decreasing in p.** More success probability means less chance of landing at or below `k`. A bisection with the comparison flipped does not raise — it converges smoothly on the wrong end of the interval.
2. **The two bounds are roots of the same family, shifted by one.** Lower bound solves `P(X ≤ k−1 | p) = 1 − α/2`; upper solves `P(X ≤ k | p) = α/2`. Writing both with `cdf(k, …)` makes the lower bound too high.

Degenerate ends (`k = 0` → lower 0; `k = n` → upper 100) are returned explicitly, never solved.

## The golden numbers to check against

```text
CP( 0, 10) = [  0.00,  30.85]
CP( 5, 10) = [ 18.71,  81.29]
CP(10, 10) = [ 69.15, 100.00]
CP( 2, 54) = [  0.45,  12.75]
CP(13, 18) = [ 46.52,  90.31]
```

All five reproduced exactly by running the code above. The end cases have closed forms computable by hand: for `k = 0` the upper bound is `1 − (α/2)^(1/n) = 1 − 0.025^0.1 = 30.85%`; for `k = n` the lower is `(α/2)^(1/n) = 69.15%`. If your routine disagrees with those two, nothing else it prints is worth reading. For a middle case, pin the bracket directly: `P(X ≤ 2 | n=54, p=0.125) = 0.028008` and at `p=0.1275` it is `0.024967` — the root at 0.025 sits at 12.75%.

## The three silent failure modes

1. **Incomplete beta called with the wrong symmetry argument.** In the upper branch the term is `bt(1−x, b, a)`; passing `bt(x, b, a)` produced CP(0,10) upper = 15.4% (true 30.85%, almost exactly half) and CP(5,10) upper = 75.2% (true 81.29%). The one endpoint that looked right (`k = n`) never reached the solver — pinned by the degenerate branch. Three of eight checked endpoints were wrong, and the code ran to completion.
2. **Monotonicity asserted backwards.** Bisection written as if the CDF increased in `p` returns the corner of the search interval: CP(0,10) → [0.00, 100.00], CP(5,10) → [0.00, 0.00]. A root-finder with the sign flipped returns the corner it was aimed at, and corners are always valid-looking percentages.
3. **Wrong-shift lower bound** (writing both bounds with `cdf(k, …)`), which errs in the opposite direction from bug 2.

## Cost of safety

Fifteen lines of test against fifteen lines of code — the cheapest ratio available for a function whose output nobody re-derives.

**Scale note:** term-by-term CDF evaluation is fine up to `n` of a few hundred. Past that the `comb` calls dominate and you want `scipy.stats.beta.ppf` — not because the arithmetic changes, but because the summation does.

## References

- [I got Clopper-Pearson wrong three times in one afternoon (DEV.to)](https://dev.to/howcani_howcani_77e786a89/i-got-clopper-pearson-wrong-three-times-in-one-afternoon-here-are-the-numbers-that-catch-it-1jnj)
- [Binomial proportion confidence interval (Wikipedia)](https://en.wikipedia.org/wiki/Binomial_proportion_confidence_interval)
