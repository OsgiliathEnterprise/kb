---
title: 'HoMe: Toward Practical Harness Optimization of Memory Systems for AI Assistants'
diataxis: Explanation
domain: ai-machine-learning
topic: agent-architecture
source: arXiv
source_url: https://arxiv.org/abs/2611.34624
date: 2026-11-26
keywords:
- knowledge-base
- agent-architecture
- ai-machine-learning
- explanations
---
# HoMe: Toward Practical Harness Optimization of Memory Systems for AI Assistants

## Overview
Le comportement d'un système de mémoire pour assistant IA longue durée est gouverné par son **harnais** : le code, les prompts et les configurations qui pilotent la construction, la maintenance, la récupération et la génération de réponse à partir de la mémoire. HoMe est un framework **piloté par l'évaluation** qui optimise ce harnais itérativement : chaque nouveau candidat est dérivé d'un harnais déjà évalué en éditant n'importe quelle partie de celui-ci, avec une boucle évaluation→diagnostic→édition. Validé sur le système open-source ReMe, il améliore la performance de bout en bout **en consommant nettement moins de tokens à la requête**.

## Problem Statement
Optimiser le harnais d'un système de mémoire reste **manuel** : les praticiens ajustent prompts de consolidation, stratégies de rétention, heuristiques de récupération à la main. Pire, « éditer sans contrainte » ne garantit aucune amélioration structurelle — on peut beaucoup éditer sans jamais identifier le mécanisme de défaillance partagé entre les cas d'échec.

## Key Contribution
- Formalisation du problème : la qualité d'un système de mémoire = propriété du **harnais** (construction + maintenance + retrieval + answer generation), optimisable comme artefact.
- **Boucle évaluation-driven** : évaluer des harnais candidats, diagnostiquer, éditer n'importe quelle partie d'un harnais déjà évalué pour produire le successeur.
- **Diagnostic à deux niveaux** : combiner le versioning de mémoire au niveau session avec les traces d'exécution pour (a) identifier des mécanismes d'échec *partagés* entre plusieurs cas, (b) les localiser vers les sessions et composants de harnais responsables.
- **Garde-fous pratiques** : gating des candidats pour encourager l'exploration structurelle précoce ; smoke tests, échantillonnage adaptatif et réutilisation de la mémoire construite pour réduire le coût d'évaluation.

## Technical Approach
À chaque itération, HoMe exécute le benchmark sur le harnais courant, regroupe les échecs par mécanisme commun (grâce aux traces + versions de mémoire par session, il sait quelle écriture/ consolidation/récupération est fautive), puis propose un candidat qui édite le composant incriminé — prompt, code ou config. Le candidate gating évite la convergence prématurée vers des micro-éditions locales ; les smoke tests éliminent les candidats manifestement cassés avant évaluation complète, et la mémoire déjà construite est réutilisée entre candidats quand c'est valide (la construction mémoire est la partie coûteuse).

## Results
- Validation sur **ReMe** (système de mémoire open-source) avec deux benchmarks long-horizon à grande échelle : **LongMemEval-S** et **BEAM**.
- Seulement **6 évaluations formelles de candidats par benchmark** après l'évaluation initiale complète : HoMe découvre des harnais qui dépassent le harnais d'origine (déjà fort) tout en consommant **beaucoup moins de tokens à la requête**.
- Code public : https://github.com/agentscope-ai/ReMe

## Relevance to Our Domain
Prolonge directement la lignée « harness engineering » de la KB (EvoX, Agentic Harness Engineering Beta, harness leverage ladder) en la spécialisant sur les **systèmes de mémoire** — le composant le plus édité à la main et le moins formalisé chez nous. Deux idées transférables à nos stacks mémoire (LEDGER, Leto, STARK) : (1) versionner la mémoire par session + garder les traces pour faire remonter un échec de bout en bout au composant fautif, (2) optimiser conjointement qualité et tokens à la requête, pas la seule accuracy. Le taux d'amélioration en seulement 6 évaluations formelles est l'argument coût qui justifie l'automatisation.

## References
- Paper: https://arxiv.org/abs/2611.34624
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.34624?fields=citationCount,year
- Code: https://github.com/agentscope-ai/ReMe
