---
title: 'fork() for Agents: Agent Kernel for Non-blocking LLM Orchestration'
diataxis: Explanation
domain: ai-infrastructure
topic: agent-infrastructure
source: arXiv
source_url: https://arxiv.org/abs/2611.31727
date: 2026-11-26
keywords:
- knowledge-base
- agent-infrastructure
- ai-infrastructure
- explanations
---
# fork() for Agents: Agent Kernel for Non-blocking LLM Orchestration

## Overview
Agent-Kernel est un runtime d'orchestration de agents LLM **non-bloquant** qui transpose au « plan de contenu » des agents un patron éprouvé des systèmes distribués : la récupération sélective de sous-graphe (re-exécuter uniquement les descendants d'un nœud en échec, en préservant le travail déjà terminé). Son primitive centrale, **Sub-Graph Recovery (SGR)**, se déclenche sur une simple exception — sans vérificateur entraîné ni planificateur — et s'appuie sur un substrat durable avec garantie formelle de préservation d'état.

## Problem Statement
Les agents LLM exécutent leurs appels d'outils de façon synchrone et **jettent le travail accompli quand une exécution échoue**. Les runtimes récents (Sherlock, AgentGit, Atomix) préservent le travail complété, mais au prix de vérificateurs entraînés, de contrôle de version ou de frontières transactionnelles sur les outils — des machinery lourdes et spécifiques. Pendant ce temps, Spark, Erlang/OTP et Dryad font depuis longtemps de la récupération partielle de DAG un mécanisme standard, absent du monde des agents.

## Key Contribution
- **Agent-Kernel** : runtime non-bloquant qui amène la récupération sélective de sous-graphe dans le plan de contenu LLM.
- **Sub-Graph Recovery (SGR)** : primitive qui se déclenche sur une exception brute, réinitialise les descendants transitive du nœud en échec tout en préservant les frères complétés.
- **Context inheritance** : chaque parent compose son texte dans les prompts de ses enfants, afin que la re-exécution des descendants garde le contexte utile.
- Garantie formelle de préservation d'état sur substrat durable ; parallélisme structurel (jusqu'à 12,7× de speedup) quand le graphe le permet.

## Technical Approach
L'analogie revendiquée est `fork()` : au lieu de rejouer toute la trajectoire (whole-trajectory replay), le kernel isole le sous-graphe affecté par l'exception et ne re-exécute que ses descendants. Contrairement aux approches à vérificateur appris (Sherlock) ou à journal transactionnel (Atomix), le déclencheur est l'exception elle-même — zéro modèle supplémentaire, zéro planificateur. La durabilité de l'état (nœuds complétés, textes intermédiaires) repose sur un substrat persistant, ce qui rend la sémantique de récupération vérifiable formellement.

## Results
- 14 434 runs sur tau-bench, Gaia2, AutomationBench, InterruptBench + jeux synthétiques.
- SGR atteint **100 % de récupération complète** (budget=3) là où le replay de trajectoire complète plafonne à 55 % ; environ **10× plus rapide** qu'un rollback façon Sherlock adapté qui récupère aussi.
- Sur charges linéaires, précision égale à ReAct-séquentiel dans la marge de bruit.
- Ablation : retirer SGR effondre le taux de succès à 39,4 % — le gain vient bien de la primitive, pas du non-blocage seul.

## Relevance to Our Domain
C'est le chaînon manquant entre l'ingénierie des systèmes distribués (reprise sur DAG) et l'infrastructure d'agents. Le pattern « exception → reset des descendants → conservation des frères » est directement transposable dans nos harnais d'agents (cf. notes durabilité Temporal/Cloudflare, Mnemosyne, effective-once) sans entraîneur de vérificateur. À croiser avec [[explanation-long-horizon-agents-durable-execution]] et l'audit « Exercised, Rarely Recovered » : ici, la récupération n'est pas décorative, elle est mesurée.

## References
- Paper: https://arxiv.org/abs/2611.31727
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.31727?fields=citationCount,year
