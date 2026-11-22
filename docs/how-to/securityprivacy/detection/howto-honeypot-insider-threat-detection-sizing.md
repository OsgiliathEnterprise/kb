---
title: 'When Suspicion Adds Up: Stochastic Sizing of Honeypot-Based Insider-Threat
  Detection'
diataxis: How-to Guide
domain: security-privacy
topic: detection
source: arxiv
source_url: https://arxiv.org/abs/2611.26353
date: 2026-11-22
keywords:
- knowledge-base
- detection
- security-privacy
- how-to
---
# When Suspicion Adds Up: Stochastic Sizing of Honeypot-Based Insider-Threat Detection

*When Suspicion Adds Up: A Stochastic Framework for Optimizing Honeypot-Based Insider-Threat Detection* (Saharnaz Mehrani, Lujia Zhan, Mohsen Emadikhiav, Payman Dehghanian — arXiv 2611.26353, November 2026) formalise le **dimensionnement conjoint du nombre de honeypots et de l'horizon de monitoring** pour la détection d'insiders.

## Inputs / Outputs du cadre décisionnel

- **Entrée** : taux d'interactions malveillantes vs légitimes avec les leurres, coût des activités malveillantes non détectées, coût des fausses détections, seuil d'interactions requis pour l'alerte.
- **Sortie** : nombre optimal de honeypots + horizon de monitoring minimisant la **perte espérée** (activité malveillante + fausses détections), avec probabilités de détection vraie/fausse en **forme fermée**.

## Méthode (étapes vérifiées)

1. **Modéliser l'accumulation de preuves** par honeypot via une **chaîne de Markov en temps continu** (les interactions nuisibles ressemblent aux comportements routiniers — d'où le besoin d'un modèle probabiliste).
2. **Sélection conjointe** du nombre de honeypots et de l'horizon temporel pour minimiser la perte espérée.
3. **Formes fermées pour seuils 2 et 3** : probabilités de vraie/fausse détection et temps de détection espérés, conditionnés à la détection dans l'horizon.
4. **Cas limites caractérisés + résultats d'ordre stochastique** (comparaisons de lois de détection) pour guider le choix des paramètres ; les régimes à deux étages sont traités comme mélange de fonctions de survie conditionnelles.

## Vérification & erreurs

- ⚠️ Le cadre suppose des taux d'interaction paramétrés — l'estimation empirique (logs) reste à votre charge.
- ✅ Les formes fermées permettent un calcul instantané des métriques (faux positifs, temps moyen) sans simulation Monte-Carlo pour les seuils 2–3.
- Résultat opérationnel : plus de leurres ≠ toujours mieux — le coût des fausses détections borne l'optimum (mis en évidence par les résultats numériques).

## Références

- N. Spitzner, *Honeypots: Catching the Insider Threat*, ACSAC 2003 — l'article fondateur qui adapte les honeypots à un adversaire déjà en accès légitime (le cadre exact de ce papier) — https://www.researchgate.net/publication/4049405_Honeypots_Catching_the_insider_threat
- M. Ben Salem, S. Hershkop, S.F. Stolfo, *A Survey of Insider Attack Detection Research* — panorama classique (abuse detection vs anomaly detection, rôle des honeypots) — https://web.stanford.edu/class/cs259d/readings/Insider_survey.pdf
- Lignes de travaux citées par le papier lui-même : Panigrahi et al. (2013) sur la mise à jour de croyance intra/inter-transactions ; Pawlick et al. (2019) sur les modèles-game de déception défensive et le « leaky deception » (l'insider qui détecte le leurre) — angle complémentaire au dimensionnement stochastique.

---
*Référence : arXiv:2611.26353 (math.OC, cross-listé cs.CR) — When Suspicion Adds Up, Mehrani et al. (nov. 2026). Abstract vérifié contre arxiv_meta.xml le 2026-11-22 ; claims audités contre arxiv.org/html/2611.26353v1 (la mention « régimes non-stationnaires » d'une version antérieure n'était pas étayée et a été retirée).*

*Statut sémantique : arXiv (3 jours) → non citable, S2 non vérifié (rate-limit) ; contenu = abstract + structure HTML.*
