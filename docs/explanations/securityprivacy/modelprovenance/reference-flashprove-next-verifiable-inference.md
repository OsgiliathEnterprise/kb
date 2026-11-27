---
title: 'FlashProve-Next: Verifiable Inference for Production LLM APIs'
diataxis: Explanation
domain: security-privacy
topic: model-provenance
source: arXiv
source_url: https://arxiv.org/abs/2611.33741
date: 2026-11-26
keywords:
- knowledge-base
- model-provenance
- security-privacy
- explanations
---
# FlashProve-Next: Verifiable Inference for Production LLM APIs

**Authors:** Liang Song

## Overview

Référence technique du successeur de FlashProve : production de preuves vérifiables et zero-knowledge-masked pour des réponses individuelles d'API LLM closed-weight, **sans modifier le serving natif** et sans divulguer poids, prompts cachés, raisonnement caché ni activations. Note de référence : paramètres de sécurité, garanties formelles et chiffres de performance tels que rapportés dans le résumé de l'article.

## Problem Statement

Un client d'API closed-weight ne peut pas vérifier que le fournisseur a bien exécuté le modèle annoncé, la précision annoncée, le prompt système caché et le budget de raisonnement annoncé. Les approches existantes soit font confiance au matériel ou à des tiers, soit re-prouvent chaque couche d'un substitut entier à coût élevé tout en divergeant du serving flottant natif.

## Specification Summary

| Dimension | Détail (source : abstract arXiv 2611.33741) |
|---|---|
| Compatibilité serving | bf16 / fp8 / mxfp4, échantillonnage aléatoire, FlashAttention, CUDA graphs, batching, prefix caching — aucun changement au serving natif |
| Confidentialité | poids, prompts cachés, raisonnement caché et activations non divulgués ; les profils denses figent la géométrie coarse ; l'occultation cross-architecture est différée |
| Engagement des poids | engagement Reed-Solomon non déplétif `model_id`, ouvert dans les preuves via des ouvertures de colonnes cachées |
| Contrats d'arrondi | contrats d'arrondi par opérateur en local — suppriment les substituts entiers et la fuite du bit de refus |
| Vérification publique NI | mode spot-checking pondéré par coût : NI-315, ε ≤ 2⁻⁴⁰, Q ≤ 2⁶⁴ |
| Mode graine externe | ExtSeed-153, ε ≤ 2⁻²⁰, Q_samp ≤ 2³⁰ |
| Formatisation | 28 modules Lean 4, 696 déclarations, zéro `sorry`, axiomes standards uniquement (soundness tour-par-tour, échantillonnage bucketisé, binding des masques contraints sur F_&#123;p³&#125;, masking causal, 6 gadgets IR, vérificateurs FPN2 exécutables) |
| Calibration | 5 modèles sur Blackwell : zéro faux rejet sur 1,85 M de blocs GEMM/MoE et 1,96 M de lignes non-GEMM |
| Preuve GPU (Qwen3-0.6B, ExtSeed-153, 1,47 Md de cellules, 8 MiB) | 450,2 s GPU / 10,76 s CPU à décodage unique Q=128 ; matrice de triche 14/14 |
| Scale | Qwen3-4B 36 couches (dev 4+2) ; vLLM live Qwen3-30B-A3B-FP8 Relation 6 : preuve 1,49 s, vérification Rust 23,4 ms |
| Vérificateur CPU | fpn-verify (Rust) : preuves FPN2 Relation 2 de 8 MiB en 10,1 ms |

## Notes d'usage

- Le backend « zero-Phase-2 folded » s'appuie sur un simulateur ZK plié ouvert ; les receipts GPU, les 11 spécifications, les modules Lean et le vérificateur Rust sont publics sur `github.com/s-JoL/FlashProve-Next`.
- Distinguer les deux modes de vérification : NI-315 (public, non interactif, garantie la plus forte) vs ExtSeed-153 (graine externe, budget d'échantillonnage borné).

## Relevance to Our Domain

Première brique crédible d'« audit du fournisseur » pour nos plateformes : prouver à un client qu'une réponse provient bien du modèle/précision budgétés, sans ouvrir le serveur. À mettre en regard de notre note FlashProve v1 (même topic) qui couvrait la preuve d'infrastructure — FlashProve-Next cible désormais le chemin API de production natif.

## References

- Paper: https://arxiv.org/abs/2611.33741
- Code/specs: https://github.com/s-JoL/FlashProve-Next
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.33741
- Related: [[explanation-flashprove-provable-inference]], [[reference-graded-provenance-auditing-video-apis]]
