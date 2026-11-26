---
title: 'DFly2: Turbocharging Long-Context Speculative Decoding by Sharing the Target''s
  Sparsity'
diataxis: Explanation
domain: cloud-infrastructure
topic: llm-serving
source: arXiv
source_url: https://arxiv.org/abs/2611.34776
date: 2026-11-26
keywords:
- knowledge-base
- llm-serving
- cloud-infrastructure
- explanations
---
# DFly2: Turbocharging Long-Context Speculative Decoding by Sharing the Target's Sparsity

## Overview

DFly2 est un décodeur spéculatif **haute concurrence** pour longs contextes, construit sur un drafter diffusion semi-autorégressif. Son innovation : le drafter **partage les indices de sélection d'attention du modèle cible** pour lire un cache KV en attention creuse, et un pipeline en deux phases découple l'arborescence coûteuse (dans le drafter) du traitement des trees par la cible (attention creuse + noyaux optimisés). Sur DeepSeek-V4-Flash, jusqu'à **7,03× de vitesse de décodage par utilisateur**.

## Problem Statement

La décodage spéculatif bute sur la limite de bande passante du **décodage préfixe dense** quand le contexte s'allonge. Les approches qui l'attaquent — attention creuse ou drafter diffusion — fonctionnent en batch=1 mais **ne tiennent pas à haute concurrence**. Le problème ouvert était de combiner drafter diffusion + attention creuse + batching chargé.

## Technical Approach

Trois mécaniques coordonnées :

1. **Partage de la creusité** : le drafter diffusion semi-autorégressif réutilise les *indices de sélection d'attention* calculés par la cible, puis accède au cache KV en attention creuse — le coût de lecture croît sub-linéairement avec la longueur de contexte.
2. **Découplage en deux phases** : construire l'arbre par DFS dans le drafter (opération lourde côté drafter) pendant que la cible traite les trees en attention creuse, avec des noyaux kernels optimisés — ainsi aucune des deux phases ne bloque l'autre.
3. **Validation à haute concurrence** sur serving complet (DeepSeek-V4-Flash), y compris l'activation du **MTP** (multi-token prediction) de la cible.

## Results

- DeepSeek-V4-Flash : jusqu'à **7,03×** de vitesse de décodage par utilisateur (vs décodage standard), avec MTP cible activé.
- À débit de sortie par utilisateur égal sur deux jeux de prompts 64K, DFly2 bat la speculative decoding de l'état de l'art de **+62 %** et **+81 %** de débit.
- 20 pages, 8 figures ; équipe de 13 auteurs (Hong Liu et al.).

## Relevance to Our Domain

Le couplage « drafter qui vole les indices de sparsity de la cible » est l'answer élégante à l'objection classique « le drafter doit lui-même lire tout le KV ». Pour nos serveurs de longs contextes (repos de code entiers, transcripts d'agents), c'est la voie speculative decoding + sparse attention qui tient enfin en batch chargé. À relier à nos notes KV-cache du topic.

## References

- Paper: https://arxiv.org/abs/2611.34776
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.34776
- Related: [[explanation-aggron-agentic-kv-cache-compression]], [[explanation-blockjack-kv-cache-translation-fault-attack]]
