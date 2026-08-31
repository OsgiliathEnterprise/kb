---
title: Netflix MAPS — Multimodal Asset Personalization at Scale (CLIP, MediaFM, Embedding
  Store)
diataxis: Explanation
domain: ai-machine-learning
topic: multimodal
source: Netflix TechBlog
source_url: https://netflixtechblog.com/maps-netflixs-multimodal-asset-personalization-at-scale-32f96320785e
date: 2026-08-29
keywords:
- knowledge-base
- multimodal
- ai-machine-learning
- explanations
---
# Netflix MAPS — Multimodal Asset Personalization at Scale (CLIP, MediaFM, Embedding Store)

Netflix's **MAPS** work covers three production systems — artwork personalization, query-aware artwork ranking, and video preview personalization — plus a cheap screening trick for choosing new embeddings. The unifying idea: stop treating each asset (artwork image or video preview) as an opaque ID and let the model *see* it via multimodal embeddings, so personalization kicks in near a title's launch instead of after enough interaction data has piled up (the classic **cold-start** problem).

## Artwork personalization: making the model see the artwork

Each artwork is encoded with **CLIP** (pretrained image-text embedding model) into a 768-dim vector, which is concatenated with the asset's learned ID embedding and passed through an MLP to produce the asset representation `h_a` the model scores against members. Consequences:

- A brand-new artwork arrives *with* its CLIP embedding, so member preferences over visual themes/talent/color palettes apply immediately — those preferences live in image-embedding space, not tied to specific asset IDs, and **transfer across titles** (a member who engages with a comedian's old stand-up artwork gets the new-title asset featuring that comedian prioritized).
- **Model consolidation: five models → one.** Artwork spans five canvases (billboard, vertical-box, horizontal-panel, short-panel, landscape-panel); ID-based models had to be trained per canvas because they cannot relate cropped/resized renderings of the same scene. CLIP embeddings are largely invariant to crop/resize/aspect ratio, so near-identical renderings map to nearly the same vector and one unified model pools interaction signal across all canvases — largest gains on the data-starved canvases.
- **Mixing five canvases of training data** without hand-tuned per-canvas weights: use **reward-based weighting** built on Netflix's long-term reward modeling — each training example is weighted by `ρ(e)`, the long-term reward score of its interaction type `e`. Since interaction types are not evenly distributed across canvases, this rebalances the canvas mixture automatically and optimizes for long-term member satisfaction rather than whichever short-term action is most frequent.

## Offline evaluation done right: IPS on exploration traffic

Judging a new model on logs from the current production policy is biased — logged rewards describe what the *policy* preferred, so a candidate that disagrees with the logging policy looks worse than it is. Netflix handles this with **inverse propensity scoring (IPS)** computed on a dedicated slice of **exploration traffic**: a small fraction of requests is served by a randomized policy sampling among a title's candidate assets from a known distribution, so the propensity of showing each asset in each context is *logged exactly at serving time* rather than estimated after the fact. Reweighting observations by the inverse logged propensity gives an unbiased estimate of what a candidate policy would have earned if deployed. In their experience, propensities that are **known by construction** (not modeled after the fact) is the single biggest reason offline numbers track online outcomes. Candidates must win on IPS ratio vs. production baseline before getting any A/B traffic.

## Ablation: two ideas need each other

- **V1**: five per-canvas models, each augmented with image embeddings.
- **V2**: one unified model over all canvases, ID-only (no content).
- **V3**: unified model + image embeddings.

Offline (IPS), V3 was the clear winner, strongest on data-starved short-panel and landscape-panel canvases; ±1% changes are not significant for this metric. Online (≥4-week A/B across all platforms): **neither V1 nor V2 moved core member metrics — only V3 won a statistically significant lift.** The two ingredients compound rather than add: V1 tells a sparse-canvas model what an asset looks like but has too few examples to learn how to *use* that; V2 supplies data but ID-only, which new assets lack. V3's short-panel lift (5.691%) exceeds V1+V2 combined. Lesson: before concluding content features don't help, look for a second blocking factor.

The real test was Netflix's largest TV home-screen redesign in a decade, making **short-panel** the dominant canvas overnight — exactly the cold-start case this work targets. Shipped ahead of launch and measured with a month-long holdback A/B: V3 absorbed the shift immediately with significant gains on core discovery metric and streaming hours.

## Query-aware artwork ranking (search)

General taste is the right signal when browsing but not when *searching* — searching for an actor should surface artwork featuring that actor even if broader taste says otherwise. Because CLIP projects text and images into one shared embedding space, query alignment is just **cosine similarity between the CLIP text embedding of the query and the CLIP image embedding of the asset**, blended with the personalization score: `score = (1-α)·personalize(member, asset) + α·cos(clip_text(query), clip_image(asset))`, with mixing weight `α` tuned via online A/B. No extra modeling effort — the CLIP embeddings already sit in the asset representation from the artwork work; query-aware ranking is a single similarity term added at scoring time.

## Video previews: SeqCLIP → MediaFM

Video preview appeal comes as much from motion, pacing, dialogue, and soundtrack as any single frame. First content-aware attempt **SeqCLIP** encoded each frame with CLIP and averaged the vectors — captures what a preview *looks* like but misses what it *sounds* like. Netflix's in-house multimodal foundation model **MediaFM** (trained on 80M shots) fuses three signals per shot into one embedding: visual (SeqCLIP), audio (pretrained speech/audio embedding model), and text (captions via a large-scale text model). Integration required no new infrastructure — shot embeddings are folded into the asset representation exactly as CLIP was for artwork. Evaluation order held in both offline IPS and a five-week online A/B across all platforms: **MediaFM > SeqCLIP > ID-only**, with gains largest on TV; MediaFM is now the default video preview embedding on all platforms.

## Choosing embeddings cheaply: the linear-probe gate

End-to-end trials are expensive (data engineering, retraining, weeks of A/B traffic). Netflix gates the funnel with a cheap question: *from the content embedding alone, can you predict which asset wins under a plain unpersonalized policy?* For each title in a fixed set, use exploration data to find the **debiased popularity winner** (highest interaction rate after adjusting for how often it was shown via its propensity score), label it 1 and others 0, then train a **linear probe** on the asset embedding alone (no title/cast/metadata) with binary cross-entropy. Keeping the probe linear and embedding-only isolates how much of an asset's popularity is actually encoded in the embedding; if it isn't, the probe performs at random-guessing baseline. The probe screened a broad candidate set down to two finalists (SeqCLIP, leading MediaFM variant); all three signals — probe accuracy, offline IPS lift, online A/B lift — ranked MediaFM ahead of SeqCLIP, so the linear probe now gates every new MediaFM version before release.

## Netflix Embedding Store: decoupling foundation models from personalization deployments

Every embedding above (CLIP for artwork; SeqCLIP and MediaFM for previews) lives in the **Netflix Embedding Store**, a component of Netflix's AI Platform hosting dense embeddings for titles, games, member profiles, and multimedia assets. A foundation model encodes raw asset content into a vector once; the store serves that vector to every downstream system (artwork model, query-aware ranker, video preview model) through the same interface — **the exact same embeddings at training time and online inference** (no train/serve skew). The key property: it decouples foundation-model updates from personalization-model deployments. A new embedding version can be registered, backfilled across the catalog, and validated entirely on its own; once in the store it becomes available to every ranking/personalization model **through configuration alone** — no downstream code changes, no coordinated release. That is what let them swap CLIP into the artwork model, stand up the query-aware ranker on the same vectors, and roll MediaFM through the video preview model as three independent changes rather than cross-team migrations.

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "mp1",
      "type": "rectangle",
      "x": 60,
      "y": 80,
      "width": 240,
      "height": 110,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#c4e0f2",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "Asset content\nartwork image / video shots",
        "fontSize": 14,
        "fontFamily": 1
      }
    },
    {
      "id": "mp2",
      "type": "rectangle",
      "x": 380,
      "y": 60,
      "width": 260,
      "height": 150,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#d9ccff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "Foundation models\nCLIP (image)\nSeqCLIP (frames)\nMediaFM (visual+audio+text)",
        "fontSize": 14,
        "fontFamily": 1
      }
    },
    {
      "id": "mp3",
      "type": "rectangle",
      "x": 720,
      "y": 60,
      "width": 280,
      "height": 150,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#f9e0a3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "Netflix Embedding Store\nencode once, serve everywhere,\nsame vectors train + serve",
        "fontSize": 14,
        "fontFamily": 1
      }
    },
    {
      "id": "mp4",
      "type": "rectangle",
      "x": 380,
      "y": 290,
      "width": 620,
      "height": 100,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#c9e7c9",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "Downstream consumers (config-only access)\nartwork model | query-aware ranker (+cosine vs CLIP text) | video preview model",
        "fontSize": 14,
        "fontFamily": 1
      }
    },
    [
      {
        "id": "mp5",
        "type": "arrow",
        "x": 300,
        "y": 135,
        "width": 80,
        "height": 0,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [
          [
            0,
            0
          ],
          [
            80,
            0
          ]
        ]
      }
    ],
    [
      {
        "id": "mp6",
        "type": "arrow",
        "x": 640,
        "y": 135,
        "width": 80,
        "height": 0,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [
          [
            0,
            0
          ],
          [
            80,
            0
          ]
        ]
      }
    ],
    [
      {
        "id": "mp7",
        "type": "arrow",
        "x": 690,
        "y": 210,
        "width": 0,
        "height": 80,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [
          [
            0,
            0
          ],
          [
            0,
            80
          ]
        ]
      }
    ]
  ]
}
```

## What we learned (author's summary)

1. Pretrained CLIP embeddings let five artwork models consolidate into one while boosting data-starved canvases — most visible when the redesigned TV home screen made short-panel dominant overnight.
2. Content features and pooled data **compound**: neither alone moved online metrics; together they did.
3. Propensities known by construction (randomized exploration slice) make offline IPS track online A/B outcomes.
4. A linear probe on embeddings is a cheap, reliable gate for screening new embedding versions before expensive end-to-end trials.

## References

- [MAPS: Netflix's Multimodal Asset Personalization at Scale (Netflix TechBlog)](https://netflixtechblog.com/maps-netflixs-multimodal-asset-personalization-at-scale-32f96320785e)
- [CLIP: Learning Transferable Visual Models From Natural Language Supervision](https://arxiv.org/abs/2103.00020)
- [Netflix MediaFM — the multimodal AI foundation for media understanding](https://netflixtechblog.com/mediafm-the-multimodal-ai-foundation-for-media-understanding-at-netflix-e8c28df82e2d)
- [Recommending for long-term member satisfaction at Netflix (reward modeling)](https://netflixtechblog.com/recommending-for-long-term-member-satisfaction-at-netflix-ac15cada49ef)

## Related
- [[explanation-deepseek-vision-lineage]]
- [[tutorial-commit-conversation-voice-turn-context]]
