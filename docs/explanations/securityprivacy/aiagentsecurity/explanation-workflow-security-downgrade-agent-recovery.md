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

## Overview

Quand un agent LLM échoue (étape bloquée, politique non contraignante, objectif inachevé), il **dévie** : il repart sur une trajectoire alternative pour récupérer. L'article montre que ce chemin de récupération est une surface d'attaque à part entière — un adversaire peut injecter un artefact à une étape précoce, provoquer l'échec, puis laisser la déviation exploiter l'artefact. L'agent reste « performant » (il finit la tâche) tout en étant compromis.

## Problem Statement

La sécurité des agents est aujourd'hui traitée en **détection** : reconnaître les entrées, politiques ou trajectoires malveillantes, puis filtrer ou bloquer. Ce cadre a deux angles morts structurels :

1. Il considère la trajectoire *comme planifiée*, pas la trajectoire *révisée après échec*.
2. Un filtrage block-or-allow est grossier : il bloque aussi les comportements sûrs et laisse passer des compromis nuisibles.

## Key Contribution

- **Formalisation de la sécurité de reprise** (*recovery security*) : la propriété à préserver est que la déviation de récupération ne dégrade pas la posture de sécurité initiale.
- **ARGUS** : un cadre d'inspection qui, au moment de la déviation, *compare* les trajectoires candidates à la politique d'origine et **recale les trajectoires** candidates pour les ramener dans le périmètre autorisé — plutôt que de les accepter ou rejeter en bloc.
- Validation sur **cinq environnements** avec des adversaires adaptatifs.

## Technical Approach

Le raisonnement central : le danger n'est pas l'échec mais le *détour*. ARGUS opère comme un contrôle de cohérence politique au point de bifurcation : chaque trajectoire de repli est évaluée par rapport à la politique du plan initial ; les écarts sont corrigés par reclassement (re-baselining) des trajectoires candidates. L'attaque type modélisée est en deux temps — artefact injecté tôt (apparemment inoffensif), puis activation par la récupération — ce que la détection d'intrusion classique rate car chaque étape individuellement semble légitime.

## Results

Sur les cinq environnements testés face à des adversaires adaptatifs : réduction des vulnérabilités de récupération, tout en conservant l'utilité (les agents continuent d'achever leurs tâches) et l'efficacité de reprise.

## Relevance to Our Domain

Nos agents de production (pipeline KB, CI agentique) reposent beaucoup sur la récupération automatique — retry, replan, sous-agents de secours. Ce travail dit : *trackez la déviation, pas seulement l'entrée*. À rattacher à nos notes AgentLens, Latent-in-the-Middle et à la discipline « policy drift » de l'agent governance.

## References

- Paper: https://arxiv.org/abs/2611.33605
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.33605
- Related: [[how-to-agentlens-graph-guided-agent-audit]], [[explanation-latent-in-the-middle-cross-model-kv-transfer]]
