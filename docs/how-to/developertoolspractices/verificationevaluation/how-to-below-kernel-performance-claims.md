---
title: 'Below the Stopwatch: Checking the Performance Claims of Coding Agents in the
  Kernel'
diataxis: How-to Guide
domain: developer-tools-practices
topic: verification-evaluation
source: arXiv
source_url: https://arxiv.org/abs/2611.31460
date: 2026-11-26
keywords:
- knowledge-base
- verification-evaluation
- developer-tools-practices
- how-to
---
# Below the Stopwatch: Checking the Performance Claims of Coding Agents in the Kernel

## Overview
Below est un pipeline qui vérifie non pas qu'un PR « accélère le code » (un chronomètre le fait déjà) mais qu'il accélère **pour la raison déclarée** (« mettre le résultat en cache », « lire le fichier une seule fois »). Il extrait le mécanisme revendiqué par chaque PR de performance, le mappe vers les signaux noyau/matériel qui doivent bouger si la revendication est vraie, puis mesure avant/après avec timing brut, compteurs matériels et traces noyau LTTng. Appliqué aux PRs de coding agents du dataset AIDev, la majorité des revendications ne sont même pas mesurées par leurs auteurs.

## Problem Statement
Les coding agents ouvrent des PRs qui prétendent rendre un logiciel plus rapide, en giving une justification. Un benchmark de temps ne peut pas discriminer « vraiment plus rapide grâce au mécanisme cité » de « plus rapide par accident, ou pas du tout ». Sans vérifier le mécanisme, un reviewer humain ou un harnais automatise l'acceptation de claims invérifiés.

## How-to (procédure Below)
1. **Extraire le mécanisme revendiqué** : depuis la description du PR, isoler la raison avancée (« cache the result », « read the file once ») — cf. les 1 343 PRs runtime-performance du dataset AIDev.
2. **Mapper mécanisme → signaux** : pour chaque mécanisme, lister les signaux noyau et hardware qui *doivent* changer si la revendication est vraie (ex. appel système `read()` supprimé pour « read the file once », accès mémoire réduits pour un cache).
3. **Rebuild aveugle** : un build agent qui **ne voit jamais la claim** reconstruit le code avant et après le PR — évite tout biais de l'implémenteur-versus-vérificateur.
4. **Mesurer en triple** : (a) runs de timing plats, (b) compteurs matériels (PMU), (c) traces noyau LTTng, sur les deux versions.
5. **Croiser** : le signal attendu du mécanisme revendiqué est-il apparu ? Le signal des mécanismes *non* revendiqués bouge-t-il aussi (discrimination) ? Attention : vérifier si la sortie du programme a changé en même temps (42 PRs sur 82 le font — la performance n'est pas le seul delta).

## Results / Evidence
- Sur 1 343 PRs : **57,3 % n'offrent que du raisonnement ou aucune preuve**, seuls 31,4 % chiffrent un effet.
- Sur 82 PRs analysés en profondeur : 32 plus rapides, 28 sans changement clair, 22 plus lents.
- Le signal attendu du mécanisme revendiqué apparaît dans 34 PRs (dont 20 visibles **uniquement** via les traces noyau — le chronomètre seul les aurait manqués).
- Pouvoir discriminant : les signaux noyau bougent ~**1,7× plus souvent** pour le mécanisme revendiqué d'un PR rapide que pour ses mécanismes non revendiqués ; le simple compte d'instructions ne sépare presque rien (1,15×) — d'où LTTng + PMU.

## Relevance to Our Domain
Nos harnais de coding agents acceptent des PRs de perf sur foi de benchmarks maison. Cette note fournit un protocole de verification layer spécifique aux claims de performance : build aveugle + signal mapping par mécanisme + traces noyau. À intégrer dans nos gates « performance claim » (cf. verification layer Claude Code, harness leverage ladder « exit codes lie — score artifacts ») : ne jamais accepter un claim sans le signal causal correspondant, et toujours tester l'invariance de la sortie.

## References
- Paper: https://arxiv.org/abs/2611.31460
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.31460?fields=citationCount,year
