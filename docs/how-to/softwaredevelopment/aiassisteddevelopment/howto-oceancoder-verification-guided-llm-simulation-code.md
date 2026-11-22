---
title: 'OceanCoder: A Verification-Guided Large Language Model for Automated Simulation
  Modelling in Ocean Engineering'
diataxis: How-to Guide
domain: software-development
topic: ai-assisted-development
source: arxiv
source_url: https://arxiv.org/abs/2611.26333
date: 2026-11-22
keywords:
- knowledge-base
- ai-assisted-development
- software-development
- how-to
---
# OceanCoder: Training a Verification-Guided LLM for Simulation Code Generation (Ocean Engineering)

*OceanCoder* (Can Xue, Changhong He, Ziyi Sun, Anliang Ge, Shimin Yu, Bingchen Liang — arXiv 2611.26333, November 2026) présente un LLM **basé sur Qwen3-8B** pour la génération automatisée de modèles de simulation numérique en ingénierie océanique, où la syntaxe et l'exécution correctes ne suffisent pas à valider le résultat d'ingénierie.

## Inputs / Outputs de l'approche

- **Entrée** : cahier des charges d'une tâche de simulation océanique (paramètres physiques, contraintes d'ingénierie).
- **Sortie** : code de simulation exécutable + résultats évalués contre la plausibilité d'ingénierie.

## Procédure (pipeline complet vérifié depuis l'abstract)

1. **Pipeline de données extensible** → **12 000 exemples SFT vérifiés** couvrant **12 catégories de tâches d'ingénierie** (la rareté des données d'entraînement spécialisées est le problème n°1).
2. **Framework de vérification à trois couches** :
   a. vérification des **entrées du modèle** contre les paramètres d'ingénierie et les contraintes de la tâche ;
   b. vérification que les **analyses de simulation requises** sont bien effectuées ;
   c. évaluation de la **plausibilité d'ingénierie des résultats** calculés.
3. **SFT (stage I)** : fine-tuning supervisé sur le corpus vérifié.
4. **RL en boucle fermée (stage II)** : les outcomes des trois couches fournissent des **récompenses graduées pour GRPO** (Group Relative Policy Optimization), guidant le modèle vers l'accomplissement effectif des tâches d'ingénierie.
5. **Benchmark dédié** : premier benchmark de modélisation automatisée en ingénierie océanique, incluant tâches out-of-distribution et cas d'ingénierie réels.

## Résultats validés

- **Pass@1 : 0 % (modèle de base) → 46,77 % après SFT → 51,43 % après GRPO** ; OceanCoder dépasse les modèles de base et la comparaison closed-source.
- Ablations confirmant l'apport du pipeline de données, de la vérification et du design de récompense.

## Vérification & erreurs

- Le signal de succès n'est PAS « ça compile » ni « ça tourne » : c'est la validation par les trois couches (paramètres, analyses, plausibilité des sorties).
- ⚠️ Domaine spécifique (ingénierie océanique) ; les 12 catégories de tâches structurent le corpus.

## Voir aussi

- [[howto-verified-code-synthesis-scientific-computing]]

---
*Référence : arXiv:2611.26333 (cs.SE) — OceanCoder, Xue et al. (nov. 2026). Abstract vérifié contre arxiv_meta.xml le 2026-11-22 ; claims audités contre arxiv.org/html/2611.26333v1 (les chiffres 323/1856/Qwen3-Coder-30B/+28.62/+41.09 d'une version antérieure de cette note n'étaient étayés par AUCUNE source et ont été retirés).*

*Statut sémantique : arXiv (3 jours) → non citable, S2 non vérifié (rate-limit) ; contenu = abstract + structure HTML.*
