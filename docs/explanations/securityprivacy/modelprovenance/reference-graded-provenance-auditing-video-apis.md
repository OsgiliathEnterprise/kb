---
title: Visual Attribution Limits and Graded Provenance Auditing in Commercial Video-Generation
  APIs
diataxis: Explanation
domain: security-privacy
topic: model-provenance
source: arxiv
source_url: https://arxiv.org/abs/2611.26508
date: 2026-11-22
keywords:
- knowledge-base
- model-provenance
- security-privacy
- explanations
---
# Visual Attribution Limits and Graded Provenance Auditing in Commercial Video-Generation APIs

*Visual Attribution Limits and Graded Provenance Auditing in Commercial Video-Generation APIs* (Haocheng Mei, Yuchuan Tian, Yingte Shu, Chao Xu, Kai Han, Hanting Chen, Yunhe Wang — arXiv 2611.26508, November 2026) : sur **19 endpoints commerciaux de génération vidéo**, l'**attribution visuelle est non fiable** ; l'audit passe par des **strates de provenance graduées**.

## Constats chiffrés (vérifiés depuis l'abstract)

- **Attaque de substitution de modèle** (l'intermédiaire rend un modèle/tier inférieur ou un clip cache pour un meilleur facturé, en conservant les métadonnées d'origine) : l'exactitude container/bitstream d'un ensemble de six modèles tombe de **83,9 % (brut) à 45,3 % après simple remux/re-encode**.
- **Les détecteurs forensiques ne ferment pas la brèche** : l'AUC du meilleur est déjà faible en brut et **se dégrade après le même re-encode non destructif en contenu** (détecteur D3 : AUROC 0,845 → 0,988 en passant de 24 à 3 fps).
- **Provenance graduée en trois strates** :
  1. **Métadonnées authentifiées** : les signataires C2PA (modèle revendiqué, prompts, horodatages) et les champs obligatoires du standard chinois **GB 45438-2025** sont vérifiables par certificat — là où un tiers de confiance possède la clé privée (ex. BytePlus authentifie le tier revendiqué : **187/187 à travers 3 tiers Seedance**).
  2. **Fingerprinting** : le swap de tier d'un même modèle est **détecté à 100/100 sur 720p brut signé, zéro faux positif** sur un pool honnête.
  3. **Métadonnées non signées** : purement déclaratives — l'attribution visuelle échoue sous re-encode.
- Implication : dans les scénarios d'audit où l'opérateur est partial, c'est la **stratégie de stratification de la preuve**, pas le choix du détecteur, qui détermine si le remplacement est découvrable.

## Implications pratiques

- ✅ Audit de SLA d'API vidéo : exiger des métadonnées signées par clé détenue par un tiers, vérifier les certificats, comparer aux fingerprints de tier.
- ⚠️ Les tableaux par-API d'une version antérieure de cette note (modèles tiers nommés, 0.084–0.588, 49,6×) n'étaient étayés par aucune source et ont été retirés.

## Voir aussi

- [[explanation-open-weight-provenance-vs-closed-alignment]]

---
*Référence : arXiv:2611.26508 (cs.CR) — Visual Attribution Limits and Graded Provenance Auditing, Mei et al. (nov. 2026). Abstract vérifié contre arxiv_meta.xml le 2026-11-22 ; claims audités contre arxiv.org/html/2611.26508v1.*

*Statut sémantique : arXiv (3 jours) → non citable, S2 non vérifié (rate-limit) ; contenu = abstract + structure HTML.*
