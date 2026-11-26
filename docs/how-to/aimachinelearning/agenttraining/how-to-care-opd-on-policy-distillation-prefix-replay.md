---
title: 'Collect for Coverage, Replay with Evidence: Adaptive and Efficient On-Policy
  Distillation for Long-Horizon Agents'
diataxis: How-to Guide
domain: ai-machine-learning
topic: agent-training
source: arXiv
source_url: https://arxiv.org/abs/2611.34756
date: 2026-11-26
keywords:
- knowledge-base
- agent-training
- ai-machine-learning
- how-to
---
# Collect for Coverage, Replay with Evidence: Adaptive and Efficient On-Policy Distillation for Long-Horizon Agents (CARE-OPD)

## Overview

La distillation on-policy entièrement en ligne (OPD) est coûteuse pour les agents à long horizon : chaque mise à jour exige des rollouts frais dans l'environnement. CARE-OPD (« Collect for coverAge, Replay with Evidence ») rend le *prefix replay* efficace en longue trajectoire en corrigeant ses deux angles morts — la couverture des historiques et l'allocation du rejeu — et obtient 59,5 % de réussite sur SWE-bench Verified avec 45 % de temps d'entraînement en moins.

## Problem Statement

Le prefix replay échantillonne les réponses de l'étudiant à partir d'historiques stockés, ce qui réduit le temps mort des rollouts longue traîne et permet de réutiliser chaque trajectoire pour plusieurs mises à jour. Mais l'analyse du pipeline complet révèle deux limites en long-horizon :

1. **Collecte** : les trajectoires purement-enseignant manquent les historiques *induits par l'étudiant* (les états où l'étudiant dérive réellement), et élargir la couverture d'historique dégrade la fiabilité de l'enseignant.
2. **Réutilisation** : les schedulers fixes basés sur la position ne savent pas identifier les décisions critiques, qui peuvent survenir à n'importe quelle profondeur de la trajectoire.

## Procedure (recette CARE-OPD)

1. **Élargir la couverture côté collecte** : compléter les trajectoires de l'enseignant avec des *student-seeded teacher completions* — démarrer des continuations depuis les états de l'étudiant pour que l'enseignant termine des historiques que l'étudiant rencontre vraiment.
2. **Filtrer côté signal** : appliquer un *response-level confidence gating* pour écarter les mises à jour peu fiables quand la couverture d'historique s'élargit (l'enseignant est moins fiable hors de ses propres trajectoires).
3. **Allouer le rejeu par évidence aval** : au lieu d'un scheduling positionnel fixe, utiliser le *hindsight replay allocation* — l'évidence d'exécution en aval (les tours qui ont réellement fait basculer le résultat) sélectionne les tours consécutifs à rejouer.
4. **Itérer** sur les familles de tâches longues (ici Software Engineering et Deep Research) en comparant au moins à l'OPD online asynchrone et aux baselines de prefix replay.

## Results

- SWE-bench Verified : réussite des tâches portée à **59,5 %**.
- **−45 %** de temps d'entraînement end-to-end et **−44 %** d'actions d'environnement vs OPD online asynchrone.
- Surpasse l'OPD online et les baselines prefix replay sur les tâches longues SWE et Deep Research.

## Relevance to Our Domain

Le goulot d'étranglement des agents de code en RL/distillation est le coût des environnements (sandbox, tests, repos). CARE-OPD donne une recette concrète pour entraîner des agents SWE à coût quasi-half : couvrir les états de l'étudiant, filtrer par confiance, rejouer là où l'évidence d'exécution dit que ça compte. Complémentaire de nos notes SWE-growth, ModHarness-RL et JET.

## References

- Paper: https://arxiv.org/abs/2611.34756
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.34756
- Related: [[how-to-swe-growth-teacher-guided-self-play]], [[explanation-modharness-rl-evolving-harness-programs]]
