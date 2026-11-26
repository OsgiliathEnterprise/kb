---
title: 'LIBRA: Runtime Co-Tuning of Batch Size and Parallelism for Time-Efficient
  LLM Training'
diataxis: Explanation
domain: cloud-infrastructure
topic: distributed-systems
source: arXiv
source_url: https://arxiv.org/abs/2611.32008
date: 2026-11-26
keywords:
- knowledge-base
- distributed-systems
- cloud-infrastructure
- explanations
---
# LIBRA: Runtime Co-Tuning of Batch Size and Parallelism for Time-Efficient LLM Training

## Overview
LIBRA est un framework runtime léger qui **co-optimalise simultanément la taille de batch et la configuration de parallélisme** pour minimiser le temps de bout en bout d'un entraînement LLM. Il traite le throughput et la convergence comme deux objectifs bruités et explore leur espace conjoint par optimisation bayésienne multi-objectifs (qNEHVI parallèle), atteignant en moyenne **−31,1 % de temps-de-convergence** sur des clusters jusqu'à 256 GPU.

## Problem Statement
Les systèmes existants prennent les deux décisions **en isolation** : le parallélisme est tuné pour le throughput, la taille de batch pour la convergence. Or aucun des deux objectifs seuls ne détermine l'efficacité réelle de l'entraînement — un batch optimal pour la convergence peut être un mauvais point de travail pour le régime de communication, et inversement. Le couplage (batch size ↔ régime de parallélisme optimal) est ignoré.

## Key Contribution
- Formalisation du **co-tuning** batch size × configuration de parallélisme comme problème bi-objectif bruité (throughput, convergence) sur l'espace joint.
- **Hierarchical pruning** : élimination des configurations de parallélisme infaisables ou à faible throughput par estimation de performance système, puis réduction des candidats de batch size via un monitoring de convergence conscient du critical batch size.
- **Acquisition-Guided Parallel Evaluation (AGPE)** : évaluation concurrente des candidats survivants sur des groupes de GPU, ordonnée par valeur d'acquisition.
- Amortissement du coût : le tuning runtime ne pèse que 0,3–3,5 % du temps total.

## Technical Approach
Trois étages : (1) estimation système (modèle de performance) qui prune l'espace des configurations de parallélisme — sharding, pipeline, tensor parallel — avant toute mesure coûteuse ; (2) monitoring de convergence guidé par le critical batch size pour écarter les batch sizes sous le seuil utile ; (3) recherche qNEHVI (noisy expected hypervolume improvement) sur l'espace joint restreint, avec AGPE qui alloue les groupes de GPU aux candidats les plus prometteurs en parallèle. L'ensemble s'exécute **pendant** l'entraînement (runtime), pas en amont.

## Results
- Clusters jusqu'à 256 GPU.
- **−31,1 % de temps-de-convergence en moyenne** vs méthodes état de l'art.
- Surcoût de tuning : 0,3–3,5 % du temps global uniquement.

## Relevance to Our Domain
Pour toute plateforme de formation ML sur cluster GPU (Kubernetes/Ray/Volcano), LIBRA montre que le scheduleur doit traiter batch size et plan de parallélisme comme **un seul espace de décision** et que l'optimisation bayésienne multi-objectifs en ligne est assez bon marché pour être intégrée au runtime d'ordonnancement. Le pattern « estimation système pour le pruning → mesures concurrentes pilotées par l'acquisition » est réutilisable pour d'autres tuning conjoints (precision × parallélisme, checkpointing × recompute).

## References
- Paper: https://arxiv.org/abs/2611.32008
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.32008?fields=citationCount,year
