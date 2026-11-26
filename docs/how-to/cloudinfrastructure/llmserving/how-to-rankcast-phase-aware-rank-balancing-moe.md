---
title: 'RankCast: Phase-Aware Rank Balancing in MoE Serving'
diataxis: How-to Guide
domain: cloud-infrastructure
topic: llm-serving
source: arXiv
source_url: https://arxiv.org/abs/2611.33542
date: 2026-11-26
keywords:
- knowledge-base
- llm-serving
- cloud-infrastructure
- how-to
---
# RankCast: Phase-Aware Rank Balancing in MoE Serving

## Overview

Recette d'ordonnancement pour servir des MoE en parallélisme d'experts (EP) : au lieu de répartir les experts sur les GPUs, RankCast **fixe le placement des experts et équilibre les rangs de communication (EP-ranks)** par réplication sélective, en tirant parti du fait que la composition des experts change avec la phase (prefill/decode) et le batch. Résultat phare : jusqu'à **2,0× de débit** et **4,5× de réduction de la latence moyenne par token** vs l'état de l'art.

## Problem Statement

Le goulot d'étranglement du serving MoE en EP est la **charge déséquilibrée des experts**. Les approches existantes migrent la réplication d'experts *entre GPUs* pour corriger la surcharge des GPUs chauds — mais elles négligent la **nature dynamique** de la charge, qui varie avec la composition du batch et la phase de serving. Résultat : les EP-ranks (rangs de communication) restent déséquilibrés et la latence de communication domine.

## Procedure (RankCast)

1. **Figer le placement des experts** sur les GPUs — ne pas migrer les experts ; mesurer la désynchronisation des rangs de communication.
2. **Estimer la charge par rang** : la distribution des experts activés dépend du batch et de la phase (prefill vs decode) ; instrumenter les deux.
3. **Répliquer sélectivement les experts chauds** — seuls ceux qui déséquilibrent — pour **rééquilibrer les EP-ranks** (et non les GPUs).
4. **Basculer en phase-aware** : changer le schéma de réplication quand la phase de serving change ; le système réagit à la dérive de composition en runtime.
5. **Valider sur 4 modèles × 4 workloads** en comparant débit et latence moyenne par token aux systèmes déplaçant la réplication entre GPUs.

## Results

- Jusqu'à **2,0× de débit** vs l'état de l'art en serving MoE.
- Jusqu'à **4,5× de réduction de la latence moyenne par token**.
- Évaluation : 4 modèles MoE, 4 workloads.
- Code open source : `github.com/CTMS-Research/RankCast`.

## Relevance to Our Domain

Pour l'infrastructure de serving de nos modèles (et les workloads agentiques à longs contextes) : l'insight « les GPUs des experts peuvent rester sous-chargés tant que les EP-ranks sont balancés » inverse l'objectif d'ordonnancement habituel. À croiser avec nos notes PipeAxes et CoordRoute du même topic.

## References

- Paper: https://arxiv.org/abs/2611.33542
- Code: https://github.com/CTMS-Research/RankCast
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.33542
- Related: [[how-to-pipeaxes-pipeline-parallel-pcie-serving]], [[explanation-coordroute-budget-coordinated-model-routing]]
