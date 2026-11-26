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

**Authors:** Kaidi Fu, Xu-Hao Lu, Pingwei Sun, Jianchao Tan, Yuchen Xie, Xunliang Cai

## Overview

Recette d'ordonnancement pour servir des MoE en parallélisme d'experts (EP) dans une architecture disagrégée Prefill/Decode : la latence MoE est dictée par le rang EP le plus chargé, et la source dominante de charge **diffère selon la phase** (prefill = calcul borne, piloté par le max de tokens par rang ; decode = mémoire bornée, pilotée par le max d'experts actifs par rang à batch modéré). RankCast ramène les deux maximums au lieu de traiter les deux phases de la même façon.

## Problem Statement

Dans le serving MoE disagrégé (phases Prefill et Decode séparées) avec Expert Parallelism, chaque couche doit attendre le rang EP le plus occupé : le déséquilibre de charge ralentit l'inférence. Or les recettes uniformes échouent parce que le facteur de latence n'est pas le même en prefill (nombre maximal de tokens sur un rang) qu'en decode (nombre maximal d'experts actifs sur un rang).

## Procedure (RankCast)

1. **Cadre unifié par token** : pour chaque token, préserver les experts Top-p prédits et choisir les `k−p` experts restants parmi les candidats Top-L (`L > k`) — c'est cette flexibilité que l'ordonnanceur exploite.
2. **Prefill — pilotage par prix** : calculer un *price per rank* qui oriente les assignations flexibles (les `k−p` libres) vers les rangs les moins chargés, pour abaisser le max de tokens par rang.
3. **Decode — fermeture d'experts** : fermer des experts sur les rangs les plus chargés tout en respectant les contraintes de chaque token, pour abaisser le max d'experts actifs.
4. **Implémenter dans les frameworks de production** : les deux chemins sont implémentés et testés dans SGLang et DeepEP.
5. **Masquer le surcoût** : chevaucher les noyaux RankCast avec l'exécution du modèle et réutiliser le canal de communication DeepEP existant pour transmettre les métadonnées (pas de communication supplémentaire).

## Results

- Évaluation sur **Qwen3-235B-A22B (EP=8)** et **Qwen3.5-397B-A17B (EP=16)**.
- RankCast **supprime plus de 75 % de la charge excédentaire prefill** du rang le plus occupé.
- **Jusqu'à +19 % de débit d'entrée prefill** et **jusqu'à −10 % de temps de décodage par token de sortie**.
- Coût qualité **inférieur à un point de pourcentage**.

## Relevance to Our Domain

Pour nos serveurs MoE disagrégés : le signal clé est que l'équilibrage doit être **phase-aware** — un même ordonnanceur ne peut pas optimiser le max-de-tokens (prefill, compute-bound) et le max-d'experts-actifs (decode, memory-bound). Le couplage « Top-p figé + Top-L flexible + prix par rang » est une recette réutilisable sans toucher au placement physique des experts. À croiser avec nos notes PipeAxes et CoordRoute du même topic.

## References

- Paper: https://arxiv.org/abs/2611.33542
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.33542
- Related: [[how-to-pipeaxes-pipeline-parallel-pcie-serving]], [[explanation-coordroute-budget-coordinated-model-routing]]
