---
title: 'When Answering Is Administering: Permission Replies That Rewrite Coding-Agent
  Policy'
diataxis: Explanation
domain: security-privacy
topic: ai-agent-security
source: arXiv
source_url: https://arxiv.org/abs/2611.32195
date: 2026-11-26
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- explanations
---
# When Answering Is Administering: Permission Replies That Rewrite Coding-Agent Policy

## Overview
L'étude démontre une faille de composition dans les coding agents (Claude Code et 9 autres systèmes) : un plugin ou service distant autorisé à **répondre aux invites de permission** peut, au fil d'une session, réécrire la politique de sécurité elle-même. Une garantie vérifiée décision par décision (une réponse ne peut pas écraser les règles deny de l'opérateur) échoue à l'échelle d'un run complet, car une réponse peut supprimer une règle deny protectrice — le droit de répondre devient le droit d'administrer la politique.

## Problem Statement
Claude Code documente qu'une réponse de permission ne peut pas outrepasser les règles deny de l'opérateur. Mais cette garantie est contrôlée **une décision à la fois**. Rien n'empêche une réponse approuvée d'embarquer une mise à jour de politique qui retire une règle deny. Exemple concret : un service remote sans accès aux fichiers approuve une commande anodine et attache une mise à jour qui supprime la règle deny protégeant les secrets du projet ; l'agent lit alors les secrets dans la session courante et les sessions suivantes — y compris dans le sandbox strict du vendeur.

## Key Contribution
- Identification du **root cause** : Claude Code ne filtre que les mises à jour qui ajoutent/remplacent des règles allow ; les suppressions de deny passent (des relays existent déjà, dont le Remote Control du vendeur).
- Observabilité comme invariance de sécurité : la suppression distante laisse **les mêmes traces qu'une édition locale** de l'opérateur — le runtime ne sait pas qui a écrit la règle, donc ne peut pas déléguer safely.
- **Deux bornes tight prouvées** sur ce qu'un runtime peut déléguer sans risque : sans attribution d'auteur des règles, n'accepter que les mises à jour qui gardent deny chaque appel actuellement nié ; avec attribution, permettre à chaque partie de ne retirer que ses propres restrictions.
- Validation prédictive sur 13 designs de permission × 10 systèmes d'agents (Codex, Gemini CLI, opencode, Goose inclus), avec des prédictions consignées avant expérimentation ; l'application des bornes à l'étape d'update partagée bloque l'attaque.

## Technical Approach
Le cadre d'analyse traite la réponse à une invite de permission comme une **surface d'administration de politique**. Les auteurs modélisent les designs de permission selon deux axes : le runtime enregistre-t-il l'auteur de chaque règle ? La délégation est-elle restreinte aux updates monotones vis-à-vis du deny ? Les deux bornes découlent de ce croisement et prédisent correctement la survie des restrictions de l'opérateur dans les 13 designs. Côté écosystème, un survey de 2 227 plugins de marketplace téléchargés trouve seulement 2 plugins envoyant des mises à jour de politique — l'attaque est réaliste mais rare aujourd'hui.

## Relevance to Our Domain
Nos harnais délèguent déjà des réponses de permission (hooks, approbations distantes, gates Step Functions). Cette note impose deux règles de conception : (1) traçabilité de l'auteur de chaque règle de policy (author attribution) dans tout store de permissions partagé, (2) par défaut, refuser toute mise à jour de politique issue d'un chemin de réponse — les updates doivent transiter par un canal d'administration distinct et authentifié. Complète la série « Tool-Call Smuggling » (2611.30624) et les notes approval-gates : la frontière n'est pas seulement ce que l'agent exécute, mais qui a le droit de modifier ce qui est interdit.

## References
- Paper: https://arxiv.org/abs/2611.32195
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.32195?fields=citationCount,year
