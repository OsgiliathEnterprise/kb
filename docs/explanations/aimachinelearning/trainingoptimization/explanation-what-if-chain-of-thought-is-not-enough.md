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

## Voir aussi

- [[explanation-reasoning-models-sequential-rl-scaling]] (pour comparaison — le CoT internalisé par RL)

---
*Référence : arXiv:2611.26282 (cs.CL) — What If Chain-of-Thought Is Not Enough?, M. Jansen (nov. 2026). Abstract vérifié contre arxiv_meta.xml le 2026-11-22 ; claims audités contre arxiv.org/html/2611.26282v1.*

*Statut sémantique : arXiv (3 jours) → non citable, S2 non vérifié (rate-limit) ; contenu = abstract + structure HTML.*
