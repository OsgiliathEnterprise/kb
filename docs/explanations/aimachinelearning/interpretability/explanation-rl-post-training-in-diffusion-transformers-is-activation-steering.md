---
title: RL Post-Training in Diffusion Transformers Is Activation Steering
diataxis: Explanation
domain: ai-machine-learning
topic: interpretability
source: arxiv
source_url: https://arxiv.org/abs/2611.26627
date: 2026-11-22
keywords:
- knowledge-base
- interpretability
- ai-machine-learning
- explanations
---
# RL Post-Training in Diffusion Transformers Is Activation Steering

*RL Post-Training in Diffusion Transformers Is Activation Steering* (Tuna Han Salih Meral [Virginia Tech], Kaan Oktay [FAL], Alec Helbling [Georgia Tech / IBM Research], Atakan Kara [FAL], Duen Horng Chau [Georgia Tech], Pinar Yanardag [Virginia Tech] — arXiv 2611.26627, novembre 2026 ; page projet : rl-is-steering.github.io) démontre que la majeure partie du gain du **post-training RL** des diffusion transformers s'explique par un **changement d'activations indépendant de l'entrée**.

## Mécanisme découvert

Les auteurs sondent chaque checkpoint RL-tuned public avec une paramétrisation volontairement simple : un **jeu fixe de vecteurs de steering ajoutés aux sorties des blocs du modèle de base gelé**, ajustés par appariement des prédictions de vélocité (velocity matching), **sans récompense dans l'objectif** :
- Sur **SD3.5-M**, ces vecteurs utilisent **65× moins de paramètres** que la LoRA RL-tuned (0,29 M contre 18,8 M).
- Bien qu'identiques pour chaque prompt, token et graine d'échantillonnage, ils **récupèrent 90,0–96,3 % des gains de récompense** de six modèles image RL-tuned, et 89,8 % / 111,9 % sur deux modèles vidéo RL-tuned.
- Initiés à zéro et entraînés par RL online, les vecteurs seuls **dépassent** les gains du RL pondéré (OCR du rendu de texte, PickScore) sur SD3.5-M.
- Le gain se situe **hors de la direction moyennée** : la composante de s_fit orthogonale à s_mean en conserve ~96 % (0,312 sur 0,325).

Conclusion : sans nouvelles transformations input-dépendantes, le RL post-training « steer » simplement le générateur pré-entraîné vers ce qu'il sait déjà calculer.

## Implications pratiques

- ✅ Interprétabilité du RL post-training — le résultat est vérifiable empiriquement (velocity matching reproductible).
- ✅ Économie de déploiement : un shift additif peut remplacer une LoRA pour servir un modèle RL-tuned.
- ⚠️ Observation sur checkpoints publics RL-tuned — pas une recette d'entraînement RL complète.
- ❌ Ne prétend pas que TOUS les gains sont input-indépendants : « la majeure partie ».

## Contexte et travaux connexes (ajouté par KB Zookeeper, vérifié via recherche web le 2026-11-25)

- Le **steering d'activations** vient de la littérature LLM : ajouter un vecteur fixe aux hidden states, obtenu soit par prompts contrastifs, soit par optimisation directe. Ce papier transpose la technique aux DiT et au régime RL post-training.
- Un résultat voisin dans l'écosystème LLM : des vecteurs de steering entraînés peuvent remplacer une LoRA et servir d'« oracles d'activations » — cohérent avec la thèse « capacité déjà présente, simplement débloquée ».
- Le positionnement des auteurs (section Related Work du papier) ancre explicitement le travail dans ces deux lignées (steering par contrastes vs. optimisé), appliquées aux modèles d'image.
- Point de vigilance pour la reproduction : les vecteurs sont ajustés par **velocity matching** contre des checkpoints RL-tuned **publics** — la méthode dépend donc de la disponibilité de ces checkpoints, pas d'une boucle de récompense.

## Voir aussi

- [[explanation-rlaif-vs-rlhf-preference-mode-collapse]]

---
*Référence : arXiv:2611.26627 (cs.CV) — RL Post-Training in Diffusion Transformers Is Activation Steering, Meral et al. (nov. 2026). Abstract vérifié contre arxiv_meta.xml le 2026-11-22 ; claims audités contre arxiv.org/html/2611.26627v1.*

*Statut sémantique : arXiv (3 jours) → non citable, S2 non vérifié (rate-limit) ; contenu = abstract + structure HTML.*
