---
title: What If Chain-of-Thought Is Not Enough?
diataxis: Explanation
domain: ai-machine-learning
topic: training-optimization
source: arxiv
source_url: https://arxiv.org/abs/2611.26282
date: 2026-11-22
keywords:
- knowledge-base
- training-optimization
- ai-machine-learning
- explanations
---
# What If Chain-of-Thought Is Not Enough?

*What If Chain-of-Thought Is Not Enough?* (Marc Jansen, Computer Science Institute, Ruhr West University of Applied Sciences, Bottrop, Germany — arXiv 2611.26282, November 2026) demande si le **modèle de raisonnement interne** d'un LLM peut être volontairement remplacé, et si un tel remplacement est bénéfique.

## Idée principale

Plutôt que de s'appuyer sur le Chain-of-Thought (issu du prompting), l'auteur **entraîne** les modèles à suivre **QOC (Question–Option–Criteria)** : un processus de décision structuré qui décompose la tâche en questions explicites, options concurrentes et critères d'évaluation. Un pipeline de développement en **trois générations** va d'un noyau de décision QOC basique vers une synthèse de réponse enrichie statistiquement. Les modèles fine-tunés QOC améliorent la qualité des réponses par rapport aux modèles de base non fine-tunés, avec des gains particulièrement forts quand le modèle est assez grand pour exécuter fiablement les calculs QOC sous-jacents.

## Quand l'utiliser / limites

- ✅ Pour explorer la **reprogrammation du processus de raisonnement interne** par fine-tuning plutôt que par prompting.
- ✅ Pertinent si l'on cherche des alternatives structurées au CoT plus fiables, interprétables et adaptées à la tâche (aide à la décision).
- ⚠️ Approche préliminaire — pas de benchmark de référence publié.
- ❌ Non adaptée aux tâches où la trace de raisonnement libre est l'objectif même (maths compétitives, code).

## Contexte et travaux liés

- La méthode **QOC (Question–Option–Criteria)** vient de l'analyse décisionnelle classique (aide à la décision structurée) ; son application aux LLM a été explorée par la même ligne de travail dans *Increasing AI Explainability by LLM Driven Standard Processes* (arXiv:2511.07083), qui intègre les LLM dans des modèles de décision formalisés comme QOC pour l'explicabilité.
- Positionnement : le papier se situe dans la lignée « prompting → internalisation par fine-tuning » du raisonnement (à comparer au CoT internalisé par RL).
- Fiche arXiv confirmée en ligne (2026-11-22) : double catégorie **cs.CL + cs.AI**, soumission v1 du 19 nov. 2026, licence **CC BY 4.0** (réutilisation large autorisée).

## Voir aussi

- [[explanation-reasoning-models-sequential-rl-scaling]] (pour comparaison — le CoT internalisé par RL)
- arXiv:2511.07083 — Increasing AI Explainability by LLM Driven Standard Processes (prédécesseur direct de la méthode QOC-LLM)

---
*Référence : arXiv:2611.26282 (cs.CL, cs.AI) — What If Chain-of-Thought Is Not Enough?, M. Jansen (nov. 2026). Abstract vérifié contre arxiv_meta.xml le 2026-11-22 ; claims audités contre arxiv.org/html/2611.26282v1.*

*Statut sémantique : arXiv (3 jours) → non citable, S2 non vérifié (rate-limit) ; contenu = abstract + structure HTML. Enrichi par KB Zookeeper le 2026-11-22 (abstract re-vérifié en direct sur arxiv.org ; travail lié QOC identifié par recherche web).*
