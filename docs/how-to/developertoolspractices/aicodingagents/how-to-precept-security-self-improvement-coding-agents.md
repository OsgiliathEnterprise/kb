---
title: 'PRECEPT: Security Self-Improvement of Coding Agents via Evolving Principles'
diataxis: How-to Guide
domain: developer-tools-practices
topic: ai-coding-agents
source: arXiv
source_url: https://arxiv.org/abs/2611.33519
date: 2026-11-26
keywords:
- knowledge-base
- ai-coding-agents
- developer-tools-practices
- how-to
---
# PRECEPT: Security Self-Improvement of Coding Agents via Evolving Principles

## Overview

Recette d'auto-amélioration **security-first** pour agents de code : PRECEPT ne cherche pas à faire mieux passer les benchmarks fonctionnels, mais à réduire les vulnérabilités *gérées* par les correctifs de l'agent, en apprenant à partir du retour des outils d'analyse de sécurité du cycle de développement (SAST, scanners de dépendances, etc.).

## Problem Statement

Les agents de code actuels ne s'auto-améliorent que sur des métriques fonctionnelles (tests qui passent, problèmes résolus). Cette boucle ne filtre pas la sécurité, voire la dégrade : un agent qui optimise le pass-rate peut introduire des failles. Les approches existantes d'auto-amélioration orientée sécurité restent faibles, et **aucune** n'utilise le retour des outils de sécurité du SDLC comme source d'apprentissage.

## Procedure (PRECEPT)

1. **Exécuter l'agent de code** sur des dépôts réels (ici SWE-Bench Pro) ; laisser le candidat correctif passer dans le pipeline de sécurité existant.
2. **Interroger les outils de sécurité du SDLC** sur les correctifs produits (analyse statique, scanners de dépendances) et garder le retour structuré — c'est le signal d'entraînement, pas les tests unitaires.
3. **Distiller le retour en principes évolutifs** : des règles réutilisables (« principes ») inférées des vulnérabilités détectées, révisées à chaque itération (la bibliothèque de principes *évolue*).
4. **Injecter les principes** dans le contexte/prompt de l'agent à l'itération suivante.
5. **Itérer** en mesurant les vulnérabilités *gérées* (vulns effectivement évitées/corrigées) plutôt que le seul pass-rate fonctionnel.

## Results

- Évalué sur des dépôts **SWE-Bench Pro**.
- **−52 %** de vulnérabilités gérées vs la base de référence *sans retour de sécurité*.

## Relevance to Our Domain

C'est l'angle DevSecOps de l'agentique de code : plutôt qu'un garde-fou externe, la boucle d'amélioration elle-même consomme le feedback SAST. Directement applicable à nos pipelines d'agents de code (ajouter les scanners à la boucle de feedback des agents, formaliser des principes versionnés). À relier à nos notes over-editing et ShellBench.

## References

- Paper: https://arxiv.org/abs/2611.33519
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.33519
- Related: [[explanation-coding-agent-over-editing-delta-residue-attribution]], [[reference-shellbench-model-vs-harness-benchmark]]
