---
title: 'TASK Memory: Beyond Text-Only Memory with Activation Steering and Knowledge
  Editing against Memory Hallucination'
diataxis: Explanation
domain: ai-machine-learning
topic: agent-architecture
source: arXiv
source_url: https://arxiv.org/abs/2611.34762
date: 2026-11-26
keywords:
- knowledge-base
- agent-architecture
- ai-machine-learning
- explanations
---
# TASK Memory: Beyond Text-Only Memory with Activation Steering and Knowledge Editing against Memory Hallucination

**Authors:** Jinkun Zhao, Wenjun Wu

## Overview

Les agents LLM s'appuient de plus en plus sur une mémoire externe, mais ils hallucinent aussi sur *ce dont ils se souviennent*. Pire : même quand la bonne mémoire est récupérée et placée dans le prompt, la réponse la contredit ou l'applique au mauvais objet. L'article nomme ce phénomène les **hallucinations de mémoire à l'usage** (*use-time memory hallucinations*) et propose TASK, une mémoire à trois couches qui combine texte, *activation steering* et édition de connaissances partageant une même adresse interne au modèle.

## Problem Statement

Le conflit entre connaissances paramétriques (poids) et mémoire externe produit trois modes de défaillance, mesurés sur cinq modèles ouverts :

- **Memory-ignoring** — le modèle retombe sur un fait périmé stocké dans ses poids : jusqu'à 46 % des requêtes.
- **Memory-misapplying** — la mémoire est attribuée à des entités non concernées : jusqu'à 24 %, et 49 % quand la retrieval est combinée à une édition de poids.
- **Version confusion** — pour un fait révisé dont les deux versions restent stockées, 53 % des réponses affirment la valeur dépassée.

Une mémoire purement textuelle (RAG classique) ne résout pas ces modes, car le problème n'est pas l'accès au contenu mais la *décision d'utiliser* le contenu récupéré.

## Key Contribution

- Taxonomie empirique des hallucinations de mémoire à l'usage (trois formes, taux quantifiés sur 5 modèles).
- **TASK memory** : une entrée de mémoire = un **T**exte (le contenu) + un **A**ctivation-steering pair de vecteurs + un **K**nowledge edit (un édit de connaissance supprimable qui fournit l'adresse via sa clé de sujet et permet la composition multi-saut).
- La paire de vecteurs de steering ne stocke aucun contenu : elle décide, requête par requête, si le modèle adopte la mémoire externe ou garde sa propre réponse.
- Protocole pré-enregistré *test-once* sur modèles gelés — rigueur méthodologique notable.

## Technical Approach

L'idée centrale est la **séparation contenu / adressage / arbitrage** : le texte porte le fait, l'édit de connaissance donne une adresse in-model commune (le sujet de l'édit sert de clé, ce qui permet d'enchaîner les sauts pour le multi-hop), et les vecteurs de steering agissent comme un interrupteur d'adoption au moment du décodage. Comme les vecteurs sont supprimables et stockent zéro contenu, la mémoire reste auditable et réversible — cohérent avec les exigences d'effacement (cf. notes « Forget the Lineage », « LEDGER » du même topic).

## Results

- Hallucinations de type memory-ignoring ramenées à ≤ 1,5 % dans les 10 cellules modèle-dataset.
- Mauvaise application aux entités voisines : 39,2 % → 7,5 % (+10,8 pp de score composite sur CounterFact).
- +16,4 pp vs BM25 RAG sur une bibliothèque de 300 mémoires (avantage maintenu à 3 000 mémoires).
- Révocations de faits résolues sans identifiants de faits ; +7,5 pp de précision multi-hop sur MQuAKE.
- 21/23 comparaisons cross-modèles (8B–27B, quatre familles) significatives ; TASK bat trois méthodes récentes de context-steering dans 9/10 cellules.

## Relevance to Our Domain

C'est une pièce maîtresse pour la fiabilité de la mémoire agent : elle montre que la retrieval pure atteignait un plafond (le modèle *ignore* le contexte récupéré) et fournit un mécanisme d'arbitrage paramétrique léger et réversible. À croiser avec nos notes sur l'anti-persistence, la mémoire auditable et la sélection adaptative de mémoire.

## References

- Paper: https://arxiv.org/abs/2611.34762
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.34762
- Related: [[explanation-leto-utility-centric-agent-memory]], [[reference-ledger-auditable-agent-memory]], [[explanation-anti-persistence-agent-memory]]
