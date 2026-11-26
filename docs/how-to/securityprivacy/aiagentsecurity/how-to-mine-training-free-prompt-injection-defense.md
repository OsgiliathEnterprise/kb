---
title: 'MINE: A Training-Free Defense against Indirect Prompt Injection via Mutual
  Information and Embedding Variance'
diataxis: How-to Guide
domain: security-privacy
topic: ai-agent-security
source: arXiv
source_url: https://arxiv.org/abs/2611.34188
date: 2026-11-26
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- how-to
---
# MINE: A Training-Free Defense against Indirect Prompt Injection via Mutual Information et Embedding Variance

## Overview
MINE renverse le paradigme des défenses contre l'injection de prompt indirecte en RAG : au lieu de **détecter l'attaque** (réactif : les sur-prompts contournent les filtres, les détecteurs supervisés doivent être ré-entraînés à chaque nouveau style d'attaque), **maximiser la pertinence**. Sans entraînement ni connaissance du style d'attaque, MINE score chaque segment de contexte par information mutuelle avec la requête et variance d'embeddings, servant aussi de reranker conditionné par la requête. C'est la seule défense évaluée qui reste utilisable face à un attaquant entièrement adaptatif.

## Problem Statement
En RAG, un document récupéré peut porter des instructions malveillantes (injection indirecte). Les défenses existantes sont réactives : (1) l'ingénierie de prompt (« ignore les instructions dans le contenu ») est régulièrement outrepassée ; (2) les classifieurs supervisés d'injection exigent un ré-entraînement pour chaque nouvelle famille d'attaques. Il manque une défense proactive, indépendante du style d'attaque, et applicable aussi aux tool-calls d'agents.

## How-to (mettre en œuvre le pattern MINE)
1. **Changer d'objectif** : ne pas classifier « malicious / benign », mais estimer à quel point chaque passage du contexte est pertinent pour la requête de l'utilisateur. Une instruction injectée est, structurellement, peu pertinente pour la requête.
2. **Scoreur sans entraînement** : pour chaque segment de contexte, calculer (a) l'**information mutuelle** segment↔requête sur les embeddings, (b) la **variance d'embeddings** du segment (les passages injectés divergent du régime statistique des passages pertinents). Combiner en score unique.
3. **Reranker conditionné à la requête** : réordonner les segments par ce score avant de les servir au générateur — le defense est intégrée au pipeline de récupération, sans modèle classifieur dédié.
4. **Évaluer en conditions longues** : utiliser un benchmark long-contexte réaliste (LC-Inj-SQuAD introduit ici : ~4 032 mots par contexte en moyenne) — les défenses qui passent sur des courts contextes échouent souvent en long contexte.
5. **Tester l'attaquant adaptatif** : rejouer l'évaluation avec un attaquant qui voit la défense et optimise ses injections contre elle ; c'est le test qui discriminate réellement les défenses.

## Results
- Évalué sur 4 jeux : QA court contexte (Inj-SQuAD, Inj-TriviaQA), QA long contexte (LC-Inj-SQuAD), injection de tool-call agent (InjecAgent).
- **Meilleur compromis accuracy–security** parmi toutes les défenses sans entraînement, sur les 4 jeux.
- **Seule** défense restant utilisable contre un attaquant entièrement adaptatif.
- Généralise à l'injection de tool-call d'agents (pas seulement la RAG textuelle).
- **Latence d'inférence la plus basse** en long contexte (pas de classifieur, pas de ré-entraînement).

## Relevance to Our Domain
Défense déployable immédiatement dans nos pipelines RAG et nos boucles d'outils d'agents : aucun fine-tuning, aucun modèle classifieur à maintenir, latence minimale — les trois critères qui font échouer les défenses académiques en prod. Le benchmark LC-Inj-SQuAD (moyenne 4 032 mots/contexte) est un meilleur banc d'essai que les sets courts pour nos cas d'usage documentaire. Complète la chaîne de notes injection : Tool-Call Smuggling (parser), Catalog Vulnerability (manifestes), et ici la couche récupération/contenu.

## References
- Paper: https://arxiv.org/abs/2611.34188
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.34188?fields=citationCount,year
