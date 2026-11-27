---
title: 'Uncertainty in Machine Learning: Where It Comes From and When It Is Faithful'
diataxis: Explanation
domain: ai-machine-learning
topic: uncertainty-quantification
source: HackerNews
source_url: https://chrhenning.com/blog/2026/introduction-to-uncertainty/
date: 2026-11-27
keywords:
- knowledge-base
- uncertainty-quantification
- ai-machine-learning
- explanations
---
# Uncertainty in Machine Learning: Where It Comes From and When It Is Faithful

*"Essentially, all models are wrong, but some are useful."* — George E. P. Box

Every model makes an assumption about uncertainty, often implicitly. Where data is rare, that assumption decides the answer. This note builds the mental model for choosing assumptions that make uncertainty estimates *useful for decision making*.

## Two kinds of uncertainty

- **Epistemic** — comes from what we have not learned yet (e.g. the true input–output relationship). **More data can reduce it.**
- **Aleatoric** — comes from what we cannot observe: the inputs do not determine the outcome. **More data of the same kind will not remove it.**

The line between them depends on what we *measure*: an unmeasured coin flip is 50/50 aleatoric; if we measure the throw physics, it becomes epistemic (learnable with data). Some uncertainty is irreducibly aleatoric no matter what — weather is chaotic, and we cannot observe every butterfly.

(See the companion diagram: [explanation-uncertainty-in-ml-where-it-comes-from.excalidraw](explanation-uncertainty-in-ml-where-it-comes-from.svg))

## Why it matters: five reasons

A prediction is not a decision. A single number hides the distribution of outcomes:

1. **A human decides** — the model does not know what is at stake (20% rain means different things for a wedding vs. a walk).
2. **A point estimate is not enough** — multiple plausible outcomes, and tail risk can matter more than the typical case.
3. **We can choose not to decide yet** — selective automation hands unsure cases to a human; this works *even for aleatoric uncertainty* (a person can turn the part and look again).
4. **We can ask for the right data** — active learning and Bayesian optimization query where uncertainty is highest.
5. **It feeds further computation** — sensor fusion and Kalman filters weigh each input by its uncertainty (camera precise in direction, radar in depth).

## Where uncertainty comes from: the lane-split model problem

Running example: steering-angle prediction from a front camera. At a lane split, drivers in the middle lane go left or right about 50/50 — the true conditional p*(y|x) is **bimodal**.

The learning pipeline makes three separable assumptions, each a source of uncertainty:

| Source | What it is | Can the posterior capture it? |
|---|---|---|
| **Aleatoric** | The truth itself is uncertain (input lacks information to pick a direction) | Yes, if the model family can represent it |
| **Approximation** | With limited data, many hypotheses fit equally well; committing to one ignores this | Yes — Bayesian posterior weighs all of them |
| **Model (misspecification)** | The truth may lie *outside* the model family | **No** — the posterior only weighs hypotheses inside the model |

Key derivations to remember:

- Training minimizes the **negative log-likelihood** (NLL). For a Gaussian with fixed variance, `NLL = MSE / (2σ²) + const` — so *any* MSE-trained network already carries an (implicit, often wrong) uncertainty model: a single Gaussian with one constant band.
- Expected NLL decomposes as `E[NLL] = E_x[KL(p* ‖ pθ)] + E_x[H(p*)]`. The second term is the truth's entropy (aleatoric), independent of the model. Since we never know it, **a low NLL cannot tell us whether the truth lies inside the model** — we are blind to misspecification. And KL is an average: rare but critical inputs (the lane split) can be badly modeled while the average looks fine. Knowing which inputs matter is the modeller's responsibility.
- Fixing the model family to a mixture of two Gaussians captures the bimodality, but with 20 training points it overfits; with 2,000 it comes close to the truth. Richer models capture aleatoric uncertainty **but need data**.
- **Bayesian inference** keeps all hypotheses: the posterior concentrates on hypotheses that explain the data, and hypotheses still *disagree where there is no data* — that disagreement is the epistemic/approximation signal. Bayesian model comparison via the **evidence** (marginal likelihood) can at least rank candidate model families against each other.

## Conformal prediction: a guarantee with fine print

Split conformal prediction, in four steps:

1. Hold out a **calibration set** the model was not trained on.
2. Score each calibration example with the model (e.g. absolute error).
3. Take the quantile q̂ of the scores at the target level (strictly `⌈(n+1)(1−α)⌉/n` for finite n).
4. Predict the set of outcomes within q̂ of the point prediction.

**Guarantee:** if calibration and test data are exchangeable, coverage is at least 1−α — *on average over inputs*, **not for any particular input** (e.g. not specifically at the lane split). Three different conformal sets can all have 90% coverage but differ wildly in usefulness: the score function (absolute error vs. CDF vs. density) determines whether the set includes absurd outcomes like "steer straight into the divider". The guarantee is cheap; a *useful* set needs the same modelling work as before.

## Calibration: "calibrated against whom?"

Cost-threshold decisions (`deploy if p &lt; c`) assume the model is calibrated: of all parts scored 0.1, about 10% should be defective. Two practical caveats from the quality-inspection example:

- Labels come from *one* inspector; the model can only ever be calibrated **against whoever labeled the data**, and inspectors disagree on borderline cases.
- The cost ratio (missed defect vs. false reject) is rarely a known number — so the threshold is a hand-tuned guess, and then only the **order** of scores matters: they should grow with flaw severity. A model that ranks severity correctly is "not faithful, but useful".

A coverage guarantee ("at most 5% of defects escape") also needs care: average coverage is met trivially when defects are rare. Threshold on **defects only** to get class-conditional coverage — and note the price differs enormously by model quality (a good model rejects 3% of good parts at 5% escape rate; a weaker one rejects 56%).

For quantile decisions (e.g. holding reserve for wind shortfall), the optimal reserve is the τ-quantile of the predicted shortfall — and a Gaussian tail will get the rare-event risk badly wrong at 99% levels.

## Takeaways

- Ask *which source* of uncertainty a method addresses: data (aleatoric), posterior spread (approximation), or model-family choice (misspecification — the one nobody's posterior can see).
- Fixed-variance MSE regression ships a silent, wrong uncertainty model. Naming your uncertainty assumptions is better than inheriting them by default.
- Distribution-free guarantees (conformal) buy coverage, not usefulness; the score function and inductive biases do the real work.
- Uncertainty estimates only need to be *faithful where decisions are made* — which inputs matter is a domain-expertise judgment, not a loss function.

## References

- [Original post: An Introduction to Uncertainty in Machine Learning — Christian Henning](https://chrhenning.com/blog/2026/introduction-to-uncertainty/) — basis of this note (talk at University of Alicante; [slides](https://chrhenning.com/assets/pdf/uncertainty_talk_alicante_2026.pdf))
- [Companion post: Uncertainty Is Not Distribution-Free](https://chrhenning.com/blog/2026/conformal-prediction/) — deeper critique of conformal guarantees
- [Kendall & Gal 2017, Aleatoric and epistemic uncertainty in machine learning](https://arxiv.org/abs/1703.04977) — canonical taxonomy paper (cross-checked 2026-11-27; reducible vs. irreducible framing matches this note)
- Angelopoulos & Bates 2023, *Conformal Prediction: A Gentle Introduction* — cited in the source for the conformal recipe
- MacKay 1992, *Bayesian Interpolation* — neural-network posteriors
