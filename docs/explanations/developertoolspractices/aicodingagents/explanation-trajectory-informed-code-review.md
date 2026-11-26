---
title: 'Diffs Are Cheap, Show Me the Trajectory: An Empirical Study of Trajectory-Informed
  Code Review'
diataxis: Explanation
domain: developer-tools-practices
topic: ai-coding-agents
source: arXiv
source_url: https://arxiv.org/abs/2611.31316
date: 2026-11-26
keywords:
- knowledge-base
- ai-coding-agents
- developer-tools-practices
- explanations
---
# Diffs Are Cheap, Show Me the Trajectory: An Empirical Study of Trajectory-Informed Code Review

## Overview
Étude empirique (Microsoft Research) sur une question simple : la **trajectoire de développement** d'un agent (décisions intermédiaires, tentatives échouées, évidences de validation) aide-t-elle un agent de review indépendant à trouver les problèmes du code final, au-delà du diff et du dépôt ? Réponse nuancée : oui, mais le gain dépend fortement de la **façon dont la trajectoire est présentée** — donner accès à la trajectoire brute complète n'aide que dans 4 configurations sur 6, tandis que des vues transformées de la trajectoire aident systématiquement.

## Problem Statement
Le code review part du diff final, qui ne dit rien de la genèse du code. Les trajectoires des coding agents contiennent potentiellement l'information qui manque : quelles alternatives ont été essayées et abandonnées, où la validation a échoué, quelles décisions ont produit le code. Mais une trajectoire brute est longue, bruitée et coûteuse en tokens — reste à savoir si et comment elle est exploitable.

## Key Contribution
- **Procédure de génération de commentaires de review** : comparer les versions initiale et fusionnée des PRs pour produire des review comments, évalués contre des commentaires humains withheld (ground truth caché).
- **Dataset** : 339 implémentations de 113 tâches DeepSWE reliées à leurs trajectoires et 882 synthetic reference review comments, avec des implémentations de référence held-out comme cibles de comparaison.
- Comparaison croisée : 3 configurations de coding agents × 2 harnais de review × 6 modalités (diff-only, full-trajectory, 4 présentations alternatives).
- Mesure : **mean reference recall** (part des commentaires humains attendus retrouvés).

## Technical Approach / Results
- Diff-only : 23,03 % de recall de référence. Accès complet à la trajectoire : 25,87 % en moyenne — mais amélioration dans **seulement 4 des 6 configurations** (la trajectoire brute peut nuire).
- Les **4 présentations alternatives** de la trajectoire battent toutes le diff-only : +4,05 à +7,32 points de recall.
- Les gains s'étendent aux commentaires expliquant les échecs du task-verifier (diagnostic post-mortem).
- Coût : un recall plus élevé peut exiger plus de tokens et plus de temps de review ; les vues de trajectoire simples restent compétitives — le rapport gain/coût dépend de la modalité choisie.

## Relevance to Our Domain
Pour nos harnais de review assistée par agents : ne pas brancher « la conversation complète de l'agent » sur le reviewer. Condenser la trajectoire (tentatives échouées + validations + décisions) en vue structurée est le point optimal ; les vues simples sont compétitives en coût. S'articule avec la note RecordRoute (audit de trajectoires pour localiser l'échec) : ici la trajectoire sert d'**amont** (prévention au review) plutôt que d'aval (diagnostic post-mortem).

## References
- Paper: https://arxiv.org/abs/2611.31316
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.31316?fields=citationCount,year
