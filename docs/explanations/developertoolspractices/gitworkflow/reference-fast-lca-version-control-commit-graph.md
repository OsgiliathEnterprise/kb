---
title: Fast Computation of Lowest Common Ancestor in Version Control Commit Graph
diataxis: Explanation
domain: developer-tools-practices
topic: git-workflow
source: arxiv
source_url: https://arxiv.org/abs/2611.25912
date: 2026-11-22
keywords:
- knowledge-base
- git-workflow
- developer-tools-practices
- explanations
---
# Fast Computation of Lowest Common Ancestor in Version Control Commit Graph

*Fast Computation of Lowest Common Ancestor in Version Control Commit Graph* (Stepan Polokhin, Ruslan Savchenko, Yuriy Chernyshov — **Yandex** ; arXiv 2611.25912, November 2026) attaque le calcul du **merge base** (plus proche ancêtre commun de deux commits) comme problème d'**LCA sur graphe orienté acyclique** — pas sur arbre.

## Le problème

- Le graphe de commits est un **DAG** (fusions = sommets à plusieurs parents) : les algorithmes d'LCA arborescents ne s'appliquent pas directement.
- Sur les dépôts réels (plusieurs **millions de sommets**), le calcul du merge base par recherche exhaustive prend **dizaines de secondes** — bloquant pour le pre-receive hook de la plateforme de code interne de l'auteur (requiert des réponses en millisecondes).

## Contribution

- Une **structure de données de branches supportantes** (supporting branches) pour les graphes de commits.
- **Nouvel algorithme d'LCA** avec :
  - **prétraitement** : temps **O(δ_G · m_c + n_s · log² n_s + m_s · log n_s)** ;
  - **coût par sommet** du prétraitement : **O(d)** ;
  - requêtes en temps logarithmique par rapport aux paramètres du DAG (d = degré, sous-graphes réduits n_s, m_s).
- Contexte : les algorithmes d'LCA optimaux de l'état de l'art ne valent que pour les **arbres** ; le DAG des commits casse ces hypothèses.

## Usage pratique

- Pour instrumenter un forge Git : c'est un résultat **théorique** (complexités, preuves dans le corps du texte) — pas un benchmark empirique ; les chiffres « 25 repos / &lt;20 ms / parent-jump pointers » d'une version antérieure de cette note étaient fabriqués et retirés.
- Le besoin motivant (pre-receive hook chez Yandex) indique l'échelle visée : millions de commits, requêtes temps réel.

## Voir aussi

- [[reference-git-internals-object-model-reachability]]

## Références

- Git officiel — `git-merge-base` : sémantique des merge bases multiples (`--all`, `--octopus`) — https://git-scm.com/docs/git-merge-base
- Git officiel — format binaire `commit-graph` (accélère les requêtes d'ancêtres en stockant les métadonnées d'histoire, y compris les informations de reachability) — https://git-scm.com/docs/commit-graph
- GitHub Engineering, *Git's database internals II: commit history queries* (contexte industriel : generation-number cache et topological queries sur le DAG de commits, l'approximation pratique du problème LCA-DAG que le papier attaque) — https://github.blog/open-source/git/gits-database-internals-ii-commit-history-queries/

---
*Référence : arXiv:2611.25912 (cs.DS) — Fast Computation of LCA in Version Control Commit Graph, Polokhin, Savchenko, Chernyshov (Yandex, nov. 2026). Abstract vérifié contre arxiv_meta.xml le 2026-11-22 ; claims audités contre arxiv.org/html/2611.25912v1.*

*Statut sémantique : arXiv (3 jours) → non citable, S2 non vérifié (rate-limit) ; contenu = abstract + structure HTML.*
