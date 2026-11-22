---
title: 'Twice-Told Critiques: Claim-Level Homogenization of Peer Review in the LLM
  Era'
diataxis: Explanation
domain: ai-machine-learning
topic: llm-evaluation
source: arxiv
source_url: https://arxiv.org/abs/2611.26286
date: 2026-11-22
keywords:
- knowledge-base
- llm-evaluation
- ai-machine-learning
- explanations
---
# Twice-Told Critiques: Claim-Level Homogenization of Peer Review in the LLM Era

*Twice-Told Critiques: Claim-Level Homogenization of Peer Review in the LLM Era* (Ilya Gusev, Keenable/Amsterdam — auteur unique ; arXiv 2611.26286, November 2026) mesure si les critiques des pairs **convergent au niveau des claims**, ce qui réduirait la valeur épistémique de la revue multiple.

## Résultats chiffrés (vérifiés depuis l'abstract)

- À **ICLR**, le recouvrement de critiques mesuré est passé de **12,0 % (2026) à 21,3 % (2027)**, sur des revues du même stade du processus ; hausses année sur année à **NeurIPS, ICML et dans les journaux F1000 et PLOS**.
- Une troisième revue ICLR d'un article n'a ajouté que **5,46 nouveaux problèmes** aux deux autres en 2027, contre **6,12 en 2026**.
- Détection par **MELD** (détecteur de texte généré par LLM) appliquée à toutes les revues : au sein d'un même article, deux revues signalées par MELD se recouvrent plus que deux revues non signalées — **+3,0 points** (ICLR 2024-2025), **+4,5 points** (2026-2027), **+5,4 points** sur cinq sources de journaux.
- Conclusion : les revues signalées LLM d'un même article sont moins distinctes entre elles ; la diversité des critiques baisse.

## Implications pratiques

- ✅ Avertissement pour les comités : un 3e reviewer LLM-assisté apporte moins de problèmes nouveaux.
- ✅ Ouvre une piste de recherche : mesurer le recouvrement sémantique des critiques et non leur similarité de surface.
- ⚠️ Méthode dépendante de MELD (faux positifs possibles sur textes très structurés).
- ❌ Ne conclut pas formellement à la causalité LLM → homogénéisation (corrélation avec le flag MELD).

Code et jeux de données revues publiés sous github.com/ilyagusev/twicetold et Hugging Face (ilyagusev).

## Contexte et travaux liés

- Fiche arXiv confirmée en ligne (2026-11-22) : triple catégorie **cs.CL + cs.AI + cs.DL** (Digital Libraries — ancrage dans la recherche sur les systèmes de revue), classes ACM I.2.7 / H.3.7 / J.4, soumission v1 du 19 nov. 2026, licence **CC0 (domaine public)** — données et textes de revues réutilisables sans restriction.
- Le papier s'appuie sur **MELD** (classeur de texte généré par LLM) comme instrument de mesure ; la validité des flags MELD (faux positifs sur textes formels/structurés) est le principal risque méthodologique, reconnu par l'auteur lui-même dans les limites.
- Piste ouverte par l'auteur : distinguer recouvrement sémantique des claims vs similarité de surface — la mesure retenue ici porte bien sur les claims (« problems » distincts), pas sur le texte.

## Voir aussi

- [[explanation-automated-weak-to-strong-supervision]]

---
*Référence : arXiv:2611.26286 (cs.CL, cs.AI, cs.DL) — Twice-Told Critiques, I. Gusev (nov. 2026). Abstract vérifié contre arxiv_meta.xml le 2026-11-22 ; claims audités contre arxiv.org/html/2611.26286v1.*

*Statut sémantique : arXiv (3 jours) → non citable, S2 non vérifié (rate-limit) ; contenu = abstract + structure HTML. Enrichi par KB Zookeeper le 2026-11-22 (abstract et tous les chiffres 12,0 %/21,3 %, 5,46/6,12, +3,0/+4,5/+5,4 re-vérifiés en direct sur arxiv.org).*
