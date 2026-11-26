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

**Authors:** Keyan Guo, Rupam Patir, Haipeng Cai, Hongxin Hu

## Overview

Recette d'auto-amélioration sécurité pour agents de code, fondée sur un diagnostic précis : les agents **savent** produire du code sûr quand la preuve d'échec est devant eux, mais ne le **retiennent pas** — et les correctifs persistés ne changent rien. PRECEPT construit une **bibliothèque de principes de code sûr qui évolue**, calibrée sur les échecs *du propre agent*, et ne conserve une révision que si des exécutions fraîches le justifient.

## Problem Statement

Sur des séquences de **14 tâches**, les agents **Codex, Claude Code et Qwen Code corrigent la vulnérabilité dans 85,7 % des cas** quand on leur montre le test de sécurité en échec — mais **réintroduisent la même classe de vulnérabilité dans 26,7 % des cas** quand la même tâche est refaite dans une session propre, contre **27,5 % pour un agent naïf**. Autrement dit : la capacité existe, la rétention manque ; enregistrer les correctifs dans un contexte persistant ne comble pas l'écart, et les principes de code sûr publiés sont **trop généraux** pour déclencher une implémentation fiable par l'agent lui-même.

## Procedure (PRECEPT)

1. **Partir de principes de code sûr faisant autorité** (source normative externe, pas de règles inventées).
2. **Faire tourner l'agent** sur des tâches réelles et **collecter ses échecs de sécurité** (les vulnérabilités que ses correctifs réintroduisent).
3. **Réviser les principes contre ces échecs** : chaque révision rend le principe déclenchable sur *le code de cet agent* — c'est la calibration par l'expérience propre qui manque aux principes génériques.
4. **Porter une révision uniquement si des exécutions fraîches** montrent une amélioration de la sécurité, tout en maintenant le succès fonctionnel dans une **petite plage de tolérance** (gate empirique anti-régression).
5. **Itérer** : les gains continuent de croître au fil des pas d'évolution — ils ne saturent pas après la première boucle d'évolution.

## Results

- Sur des familles de tâches **jamais vues pendant l'évolution**, l'agent **le plus faible avec PRECEPT atteint 97,1 % de code fonctionnel sûr** — au-dessus du meilleur agent sans aide (**81,9 %**) et du meilleur baseline (**87,7 %**).
- Le mécanisme clé est le couplage « principes autoritatifs + révision sur échecs propres + gate sur exécutions fraîches » : ni la mémoire de correctifs, ni les principes publiés seuls n'obtiennent ce résultat.

## Relevance to Our Domain

Transposable à nos pipelines d'agents de code : brancher la boucle d'auto-amélioration sur les **échecs de sécurité observés en propre** (tests de sécurité en échec, pas des scans génériques), versionner la bibliothèque de principes, et n'accepter une révision qu'après runs frais avec garde-fou fonctionnel. À relier à nos notes over-editing et ShellBench du même topic.

## References

- Paper: https://arxiv.org/abs/2611.33519
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.33519
- Related: [[explanation-coding-agent-over-editing-delta-residue-attribution]], [[reference-shellbench-model-vs-harness-benchmark]]
