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

**Authors:** Hong Liu, Rui Cen, Junhan Shi, Lin Niu, Runzhi Fan, Zhaojing Zhou, Haodi Lei, Jiebin Zhang, Saiyong Yang, Junqiang Zheng, Zhenghai Xue, Guanghua Yu, Jianchen Zhu

## Overview

Les modèles récents (DeepSeek-V4, Hy4) rendent l'attention **nativement creuse** pour éviter le coût quadratique de l'attention dense en long contexte — et le décodage spéculatif tourne désormais dessus. Le problème : le drafter garde son **propre cache KV** (sur tout le prompt ou une fenêtre glissante), ce qui coûte du préfixe, empêche les hits du prefix-cache et bride la concurrence en décodage. DFly2 est un drafter **block-parallèle qui partage la sparsité de la cible** : ni cache propre, ni passe de scoring.

## Problem Statement

Un drafter qui lit le cache de la cible évite d'avoir son propre cache, mais ne tranche que la question *quel cache*, pas *quelles positions* — il lit tout ou une fenêtre récente. Un calcul de sélection par requête dans le drafter coûterait de plus en plus cher à mesure que le contexte croît. Or une cible nativement sparse **a déjà choisi** les positions pour chaque requête, sur un cache qu'elle conserve de toute façon : les deux décisions du drafter (cache + positions) sont déjà prises et payées par la cible.

## Key Insight

La sélection de positions faite **un pas en avance** reste valable : mesurée sur DS-V4.1-Flash, elle couvre près de **neuf dixièmes** de ce que chaque token ultérieur sélectionne. Il suffit donc de réutiliser la sélection de l'indexeur de la cible plutôt que d'en calculer une.

## Technical Approach

Deux partages coordonnés, par couche :

1. **KV sharing** : chaque couche du drafter lit le KV que sa couche cible appariée a mis en cache.
2. **Index sharing** : elle le lit exactement aux positions choisies par l'indexeur de cette couche — un nombre fixe de positions, réparties **n'importe où** dans le contexte.

DFly2 tourne ainsi **sans passe de scoring et sans cache propre**, éliminant les coûts de préfixe, de prefix-cache et de concurrence associés au cache du drafter.

## Results

- Targets de natures différentes — **DS-V4.1-Flash, GLM-5.3-Flash, Hy4~flash** (attention creuse et architectures distinctes) — pour un seul drafter.
- **Accepte plus de tokens par pas** que DFlash et DSpark entraînés avec la même recette, sur benchmarks généraux, long-contexte et agentiques.
- La marge sur le baseline le plus fort **s'élargit de 3,9–10,5 % (général) à 10,0–31,5 % (long-contexte et agentique)**.
- À haute concurrence sur DS-V4.1-Flash, à vitesse de décodage par utilisateur égale : **+62 % et +81 % de débit** sur deux jeux de prompts 64K.
- 13 auteurs (Hong Liu et al.).

## Relevance to Our Domain

Le couplage « le drafter vole le cache ET la sélection de positions de la cible » est la réponse élégante à l'objection classique « le drafter doit lui-même lire le KV » : en long contexte, le drafter ne doit rien calculer ni stocker qui ne le soit déjà. C'est la voie speculative decoding + sparse attention qui tient enfin à haute concurrence sur nos serveurs de longs contextes (repos de code entiers, transcripts d'agents). À relier à nos notes KV-cache du topic.

## References

- Paper: https://arxiv.org/abs/2611.34776
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.34776
- Related: [[explanation-aggron-agentic-kv-cache-compression]], [[explanation-blockjack-kv-cache-translation-fault-attack]]
