---
title: 'DRBench Pro: A Knowledge-Centric Benchmark for Professional Deep Research
  Agents'
diataxis: Explanation
domain: ai-machine-learning
topic: llm-evaluation
source: arXiv
source_url: https://arxiv.org/abs/2611.34852
date: 2026-11-26
keywords:
- knowledge-base
- llm-evaluation
- ai-machine-learning
- explanations
---
# DRBench Pro: A Knowledge-Centric Benchmark for Professional Deep Research Agents

**Authors:** Han Huang, Yuchen Yan, Xingyu Wu, Yijun Li, Chao Deng, Jie Liu, Jin Ma, Yongliang Shen

## Overview

Référence d'évaluation pour les agents « deep research » : DRBench Pro fait de la **couverture de connaissances structurée** la cible primaire de l'évaluation, là où les benchmarks existants notent la qualité globale du rapport sans mesurer *quelles directions de recherche* sont couvertes ni *à quelle profondeur* elles sont explorées.

## Design (à retenir pour construire nos propres evals)

- Pipeline automatique : construction d'**arbres de connaissances locaux** depuis Wikipedia ; des sous-graphes échantillonnés génèrent les requêtes de recherche et des **rubriques ancrées dans les évidences**.
- Invariant clé : chaque rubrique correspond à une **relation de l'arbre** — la structure de la connaissance évaluée est préservée dans la grille de notation.
- L'agent ne reçoit que la requête de recherche (pas la rubrique).
- Mesures : **breadth** (couverture des grandes directions) × **depth** (exploration le long des chaînes de connaissances), combinés en **moyenne géométrique** pour le score de couverture global.

## Key Numbers

| Paramètre | Valeur |
|---|---|
| Cas | 144 |
| Domaines | 24 |
| Rubriques | 44 102 |
| Agents évalués | 16 agents deep research |
| Meilleur score de couverture global | 57,04 % |
| Validité | jugements de rubriques proches de l'annotation humaine ; classements stables across configurations de métriques |

## Method Details (verified against arXiv v1, 2026-11-26)

- Rubrics are **evidence-grounded** and *hidden* from the agent: the pipeline jointly generates each research query and its hidden rubric set from sampled subgraphs of local Wikipedia knowledge trees.
- Scoring decomposes into **breadth** (coverage of major research directions) and **depth** (exploration along related knowledge chains); the **geometric mean** of the two is the overall coverage score — a deliberate anti-gaming choice, since it punishes lopsided profiles.
- Validation: rubric-level judgments agree closely with human annotation; the 16-agent ranking is **stable across tested metric configurations**.
- arXiv: submitted 2026-11-25, cs.CL (also cs.AI), CC BY 4.0, DOI 10.48550/arXiv.2611.34852.

## Reading the Results

Le plafond à ~57 % révèle que même les meilleurs agents laissent plus de 40 % de la couverture de connaissances sur la table — la moyenne géométrique breadth×depth pénalise les agents qui couvrent large mais superficiellement (ou l'inverse), ce qui différencie réellement les forces des 16 agents testés.

## Relevance to Our Domain

Nos pipelines de veille/génération de notes KB sont des agents deep research — DRBench Pro fournit une méthodologie réutilisable (arbres de connaissance → rubriques par relation) pour évaluer nos propres agents de rédaction documentaire au-delà du « rapport joli ». À coupler avec nos notes AgentEval et l'audit de juges (HUB-J).

## References

- Paper: https://arxiv.org/abs/2611.34852
- Project: https://zjureal.com/DRBenchPro/ — Code: https://github.com/ZJU-REAL/DRBenchPro
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.34852
- Related: [[how-to-hubj-llm-judge-bias-audit-mitigation]], [[explanation-agenteval-eval-harness-structure]]
