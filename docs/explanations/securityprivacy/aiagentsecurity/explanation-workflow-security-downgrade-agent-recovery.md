---
title: 'The Detour Is the Danger: Preserving Security During LLM Agent Recovery'
diataxis: Explanation
domain: security-privacy
topic: ai-agent-security
source: arXiv
source_url: https://arxiv.org/abs/2611.33605
date: 2026-11-26
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- explanations
---
# The Detour Is the Danger: Preserving Security During LLM Agent Recovery

**Authors:** Boyang Ma, Jinku Li, Hao Wu, Sheng Gao, Man Zhou, Minghui Xu, Yue Zhang

## Overview

Quand une action d'un agent LLM échoue, l'agent **récupère tout seul** : il modifie son workflow pour contourner l'obstacle et accomplir la tâche. Cette autonomie de reprise crée une classe de faille que les modèles d'attaque existants ne capturent pas : le **workflow security downgrade** — l'agent exécute des opérations sensibles sans satisfaire les exigences de protection du workflow d'origine. L'article introduit le terme, mesure le phénomène, et propose ARGUS pour le contrer.

## Problem Statement

Contrairement à la prompt injection ou à la manipulation d'outils, le downgrade n'exige **aucune modification d'instruction ni de définition d'outil** : il émerge purement de la récupération autonome déclenchée par un échec d'exécution. Les agents de production (outillage MCP, skills) rejouent des workflows sensibles ; si le chemin de contournement saute une étape de sécurité (validation, approbation, sandboxing), l'agent paraît « réussi » alors qu'il est structurellement moins sûr.

## Key Contribution

- **Formalisation** du *workflow security downgrade* comme propriété à préserver pendant la récupération.
- **Évaluation du phénomène** : injection de fautes dans des environnements outillés MCP/Skill exécutoires, sur **7 LLMs**, **12 templates de tâches**, dans **3 domaines sensibles à la sécurité** — le downgrade se produit en pratique.
- **ARGUS** : framework de récupération *préservant les obligations*, qui combine trois composants :
  1. **Evidence de sécurité à ressources bornées** — preuve que les obligations sont couvertes, à coût plafonné ;
  2. **Validation isolée des plans de récupération** — le plan de replan est vérifié hors du chemin d'exécution ;
  3. **Enforcement à l'exécution** — le plan validé est appliqué sous contrainte.

## Results

Dans une évaluation séparée sur **864 runs**, ARGUS **empêche tous les événements observés de perte de protection** sous enforcement. L'assistance à la récupération apporte en outre des gains dépendants du modèle sur l'achèvement de tâches *protégées* par rapport à une politique block-only (tout bloquer).

## Relevance to Our Domain

Leçon d'ingénierie : *la récupération sûre, c'est préserver les obligations de sécurité à travers le changement de workflow — pas seulement restaurer la fonctionnalité de la tâche*. Nos pipelines d'agents (retry, replan, sous-agents de secours sur MCP/skills) implémentent exactement ce chemin de récupération non audité. À rattacher à notre discipline « policy drift » et aux notes d'audit d'agents du topic.

## References

- Paper: https://arxiv.org/abs/2611.33605
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.33605
- Related: [[how-to-agentlens-graph-guided-agent-audit]], [[explanation-latent-in-the-middle-cross-model-kv-transfer]]
