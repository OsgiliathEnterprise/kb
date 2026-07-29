---
title: 'AI-Driven Cryptanalysis: Anthropic''s Claude Mythos Preview Breaks HAWK and
  AES'
diataxis: Explanation
domain: DevSecOps
topic: Cryptography
source: HackerNews
source_url: https://www.anthropic.com/research/discovering-cryptographic-weaknesses
date: 2026-07-29
keywords:
- knowledge-base
- Cryptography
- DevSecOps
- explanations
---
# AI-Driven Cryptanalysis: Anthropic's Claude Mythos Preview Breaks HAWK and AES

## Overview

In July 2026, Anthropic's Frontier Red Team announced that **Claude Mythos Preview** discovered improved attacks against two significant cryptographic algorithms: the **HAWK post-quantum digital signature scheme** and a **reduced-round variant of AES-128**. These findings represent a milestone — the first time an AI system autonomously identified mathematical flaws in cryptographic algorithms (as opposed to implementation bugs in cryptographic libraries).

Both results are **research-level advances** with no immediate impact on production systems. HAWK is an undeployed NIST candidate, and the AES attack targets a 7-round reduced variant, not the full 10-round cipher. Nevertheless, the implications for cryptographic standardization and security research are profound.

## The HAWK Attack: Lattice Automorphism Discovery

### What is HAWK?

HAWK is a **post-quantum digital signature scheme** that is one of the third-round candidates in NIST's call for [Additional Digital Signatures](https://csrc.nist.gov/projects/pqc-dig-sig/round-3-additional-signatures). This is part of NIST's decade-long effort to standardize cryptographic schemes that remain secure against quantum computers, which threaten classical schemes like RSA and ECDSA.

HAWK's security is based on the **Lattice Isomorphism Problem** — a mathematical problem believed to be hard even for quantum computers.

### The Discovery

Claude Mythos Preview found a **nontrivial automorphism** (a previously unexploited symmetry) in the lattice structure used by HAWK. Prior academic work had proven that _if_ such an automorphism could be efficiently found, it would enable an attack — but nobody knew whether one actually existed in HAWK's lattice.

The automorphism enables a **faster enumeration attack** that reduces the effective keysize by a **factor of two**:

| Parameter | Previously Estimated Attack Cost | Mythos-Discovered Attack Cost | Reduction |
|-----------|----------------------------------|-------------------------------|-----------|
| **HAWK-256** | 2^64 | 2^38 | ~286× faster |
| Larger key sizes | Exponential (higher) | Exponential (higher) | Still impractical to fully break |

**Key implication:** To achieve the same security level, HAWK keys would need to be **doubled in size** — which eliminates many of the advantages that made HAWK an attractive PQC candidate in the first place.

### Important Caveats

- The attack is **still exponential time**, not polynomial — larger HAWK keys remain impractical to attack
- The attack is **specific to HAWK** and does not affect other NIST post-quantum signature candidates or lattice-based cryptography in general
- HAWK is **not deployed** in any production systems
- The finding was shared with HAWK's authors in June 2026 and coordinated for public disclosure with the NIST mailing list

### Full Paper

[Key Recovery Attack on HAWK](https://anthropic.com/document/hawk_key_recovery.pdf) — with [demonstration code](https://github.com/anthropics/cryptography-research-demo)

## The AES Attack: Möbius Bridge Fingerprinting

### Background on AES Cryptanalysis

AES (Advanced Encryption Standard) encrypts data by repeatedly applying a **round function**. AES-128 uses **10 rounds**. In academic cryptanalysis, researchers study **reduced-round variants** (fewer rounds) to understand attack techniques and estimate the security margin of the full cipher.

The best prior attacks on reduced-round AES used a technique called **meet-in-the-middle**, which trades computational time for memory space by storing intermediate calculations in large lookup tables.

### The Discovery

Mythos Preview improved the best-known meet-in-the-middle attack on **7-round AES-128** by developing a novel fingerprinting algorithm called the **Möbius Bridge**.

#### How Meet-in-the-Middle Works (Simplified)

```
Attacker's approach:
┌─────────────────────────────────────────────┐
│  Forward from plaintext (outer rounds)      │
│  ↓                                         │
│  ┌─────────────────┐                       │
│  │  MEET POINT     │  ← Precomputed table  │
│  └─────────────────┘                       │
│  ↑                                         │
│  Backward from ciphertext (inner rounds)    │
└─────────────────────────────────────────────┘

Prior work: Had to enumerate 2^56 values,
            then look each one up in the table.

Möbius Bridge: Fingerprint is INVARIANT to
               this guess, eliminating the
               need to enumerate all 2^56 values.
```

#### Möbius Bridge Improvement

| Metric | Prior Best Attack | Mythos Möbius Bridge |
|--------|-------------------|----------------------|
| **Speedup** | Baseline | **200–800× faster** (depending on measurement) |
| **Key innovation** | Standard fingerprinting | Möbius-invariant fingerprint eliminates one guess dimension |
| **Target** | 7-round AES-128 | 7-round AES-128 |
| **Threat model** | Chosen plaintext (2^105 plaintexts) | Same |

The Möbius Bridge fingerprint is invariant to a specific guess that prior attacks had to enumerate over, directly reducing work by a factor of 256. Additional optimization techniques discovered by Mythos brought the total speedup to 200–800×.

### Important Caveats

- The attack targets **7 out of 10 rounds** — it does **not** break full AES-128
- Even if extended to the full cipher, it would cost **hundreds of millions of dollars** to implement
- The attack does not impact other similar cipher schemes
- The threat model requires **2^105 chosen plaintexts** — completely impractical in reality

### Full Papers

[AES Möbius Bridge Technical Paper](https://anthropic.com/document/aes_mobius_bridge.pdf) — with Claude's [chain of thought during discovery](https://anthropic.com/document/aes_mobius_bridge_cot.pdf)

## The Multi-Agent Discovery Process

### HAWK Discovery: Semi-Autonomous with Human Guidance

| Aspect | Detail |
|--------|--------|
| **Duration** | ~60 hours |
| **Cost** | ~$100,000 in API costs |
| **Human involvement** | One researcher with theoretical CS background (not a lattice crypto expert). Provided non-technical project management guidance. |
| **Setup** | Claude Code-like harness with multiple worker agents collaborating in a sandboxed environment |
| **Tools available** | Python, Sage, access to published cryptographic literature |

#### Worker Agent Dynamics

The HAWK discovery revealed interesting multi-agent collaboration patterns:

1. **Divergent evaluation**: The key attack idea was discovered by a pair of workers. The first worker **prematurely rejected** the idea as infeasible.
2. **Persistence pays off**: The second worker continued investigating and found a way to fully exploit it.
3. **Convergence through dialogue**: The pair exchanged messages, and eventually both agreed they had found an effective attack.
4. **Self-verification**: After finding the attack, Mythos implemented an end-to-end verification pipeline to convince itself — and the human operator — of correctness.

### AES Discovery: Nearly Fully Autonomous

| Aspect | Detail |
|--------|--------|
| **Duration** | ~3 days of active work (total of ~1 week including validation) |
| **Cost** | ~$100,000 in API costs |
| **Tokens generated** | ~1 billion output tokens |
| **Human involvement** | Researcher built a scaffold (prompts + code). Only **3 substantive prompts** during the 3-day discovery phase. |
| **Validation effort** | Two researchers spent nearly a month validating the AES result (vs. one week for HAWK, which was easier to verify end-to-end) |

#### Overcoming Model Resistance

Initially, Claude **refused** to engage with the AES problem, claiming it was impossible to improve AES cryptanalysis:

> _"If you want a different outcome, the target has to change … AES-128 r5/r6 is just genuinely hard"_

The researcher's prompt — _"the models tend to think it is impossible to solve so they don't try they need a good amount of prompting"_ — caused Claude to **rewrite its own agent harness** with an improved setup that directed it to search for genuinely novel ideas.

Three key steering prompts guided the process:

1. _"no again the goal is that we have highly intelligent model as good top researcher, we want to find new attacks"_
2. _"no we don't want to change the targets [...] again we need to find something that worth publishing"_
3. _"again we are not looking for low hanging fruit, we want proper research to find genuinely hard findings"_

### Cross-Validation

After confirming the HAWK result was correct, Anthropic tested whether the same autonomous scaffold that discovered the AES attack could also **re-discover the HAWK break**. It could.

## Other Cryptographic Findings

Beyond the two primary results, Mythos Preview produced additional cryptanalytic advances:

| Cipher | Result | Status |
|--------|--------|--------|
| **LEA-128 (13-round)** | Practical key recovery in under 2^30 plaintext pairs, runs in under an hour on desktop | Detailed results pending |
| **Serpent-128 (6-round)** | Practical full key-recovery attack, extends published work | Detailed results pending |
| **Salsa20** | Limited improvements (&lt;10× gains) | Further work planned |
| **Poseidon** | Limited improvements (&lt;10× gains) | Further work planned |
| **SHA-1** | Limited improvements (&lt;10× gains) | Further work planned |

## CryptanalysisBench

Anthropic partnered with academics at **ETH Zurich, Tel Aviv University, and University of Haifa** to build [CryptanalysisBench](https://arxiv.org/abs/2607.18538), a benchmark for evaluating LLM cryptanalytic capabilities.

### Purpose

- Packages many cryptographic ciphers together for systematic evaluation
- Enables researchers to measure LLM capabilities on cryptanalysis tasks
- Tracks how frontier LLM capabilities in cryptography evolve over time
- Provides a standardized way to compare models on this important topic

### Significance

As LLMs become capable of producing novel cryptanalytic research autonomously, having a reliable benchmark is essential for:
- Measuring progress in AI cryptanalysis capabilities
- Understanding which classes of ciphers are most vulnerable to AI-assisted analysis
- Guiding cryptographic standardization efforts

## Implications for Cryptographic Standardization

### For NIST and Standards Bodies

1. **AI as a review tool**: AI-assisted cryptanalysis can serve as a powerful addition to the adversarial review process that underpins cryptographic standardization. Proposals are published publicly precisely so flaws can be found before deployment.

2. **Accelerated review cycles**: Mythos found the HAWK flaw in **60 hours** after two rounds of expert human review over two years failed to identify it. AI can dramatically compress the discovery timeline.

3. **Pre-deployment testing**: The HAWK finding is an example of the standardization process working as intended — a weakness was discovered before deployment.

### For the Broader Cryptography Community

1. **Validation bottleneck**: Human researchers are becoming bottlenecked on **validating** AI-discovered results. The AES finding took two non-expert researchers nearly a month to validate, while Mythos discovered it in one week.

2. **Long-tail cipher auditing**: Many ciphers in production have received far less scrutiny than AES. AI cryptanalysis offers an opportunity to systematically audit these under-reviewed schemes.

3. **Rising capability curve**: In just one year, LLMs went from being unable to cryptanalyze basic ciphers to finding flaws that escaped years of expert human review. Capabilities are not expected to plateau at this level.

4. **Disclosure policy questions**: As AI discovers increasingly powerful attacks, the cryptography community needs to develop norms for responsible disclosure, especially for attacks that _do_ have immediate real-world impact.

### What This Does NOT Mean

- **AES-128 is not broken**: The attack is on a 7-round reduced variant, not the full 10-round cipher
- **Post-quantum cryptography is not dead**: The attack is specific to HAWK and does not affect other NIST PQC candidates
- **No immediate system changes needed**: Neither finding affects deployed production systems
- **Not a replacement for human expertise**: Human cryptographers remain essential for validation, interpretation, and contextual understanding

## Excalidraw Diagram: Discovery Process

```excalidraw
* Excalidraw below
* You can draw in the message, and call draw_excalidraw to update the drawing
* When you send messages, include the drawing in the response to me so that I can see your drawings
* I can edit settings with Excalidraw+ settings, or draw text by starting lines with '> '

{"type":"default","values":{"appScale":1.0,"pageId":"p1","pages":{"p1":{"id":"p1","type":"tumbleweed","name":"Page 1","width":2200,"height":2200,"gridSize":20,"backgroundImageSrc":null,"backgroundImageSelectedZoomLevel":0,"isEmpty":false}},"exportPadding":120,"toView":null,"gridSettings":{"customSize":20,"circular":false,"type":"square","dashed":true},"viewBackgroundColor":"#FFFFFF","theme":"dark","strokeColor":"#e6422c","backgroundColor":"#FFFFFF","fontSize":20,"font":"Cascadia","strokeWidth":2,"roughness":0,"seed":117588423,"view":null,"gridMode":false,"gridModeEnabled":false,"gridStep":5,"gridCounter":3}}
text {"id":"1","x":550.0,"y":40.0,"text":"Claude Mythos Preview: AI Cryptanalysis Discovery Pipeline","fontSize":24,"fontFamily":1,"type":"text","strokeColor":"#e6422c","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"aV","seed":149553083,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"2","x":100.0,"y":130.0,"text":"Phase 1: Setup","fontSize":20,"fontFamily":1,"type":"text","strokeColor":"#457b9d","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"aW","seed":154724707,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"3","x":100.0,"y":170.0,"text":"Human researcher builds scaffold","fontSize":14,"fontFamily":1,"type":"text","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"aX","seed":134999955,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"4","x":100.0,"y":195.0,"text":"(prompts + code + sandboxed env)","fontSize":12,"fontFamily":1,"type":"text","strokeColor":"#888888","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"aY","seed":150582691,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"5","x":100.0,"y":230.0,"text":"Tools: Python, Sage, crypto literature","fontSize":12,"fontFamily":1,"type":"text","strokeColor":"#888888","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"aZ","seed":163038390,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
arrow {"id":"6","x":200.0,"y":250.0,"points":"[0,0],[1,0]","startArrowhead":null,"endArrowhead":"arrow","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bb","seed":277501699,"groupIds":[],"roundness":{"type":2},"status":"active","strokeSharpness":"sharp","optionsId":"default"}
text {"id":"7","x":350.0,"y":130.0,"text":"Phase 2: Autonomous Discovery","fontSize":20,"fontFamily":1,"type":"text","strokeColor":"#457b9d","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bc","seed":163038404,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"8","x":350.0,"y":170.0,"text":"Multi-agent worker collaboration","fontSize":14,"fontFamily":1,"type":"text","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bd","seed":163038405,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"9","x":350.0,"y":195.0,"text":"Literature review → hypothesis → experiments","fontSize":12,"fontFamily":1,"type":"text","strokeColor":"#888888","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"be","seed":163038406,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"10","x":350.0,"y":220.0,"text":"Workers debate, reject, rediscover ideas","fontSize":12,"fontFamily":1,"type":"text","strokeColor":"#888888","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bf","seed":163038407,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"11","x":350.0,"y":245.0,"text":"~1B tokens generated over 3 days (AES)","fontSize":12,"fontFamily":1,"type":"text","strokeColor":"#e6422c","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bg","seed":163038408,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
arrow {"id":"12","x":550.0,"y":250.0,"points":"[0,0],[1,0]","startArrowhead":null,"endArrowhead":"arrow","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bh","seed":163038409,"groupIds":[],"roundness":{"type":2},"status":"active","strokeSharpness":"sharp","optionsId":"default"}
text {"id":"13","x":700.0,"y":130.0,"text":"Phase 3: Key Discoveries","fontSize":20,"fontFamily":1,"type":"text","strokeColor":"#457b9d","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bi","seed":163038410,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"14","x":700.0,"y":170.0,"text":"HAWK: Nontrivial lattice automorphism","fontSize":14,"fontFamily":1,"type":"text","strokeColor":"#e6422c","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bj","seed":163038411,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"15","x":700.0,"y":195.0,"text":"→ Keysize reduced 2^64 → 2^38 (HAWK-256)","fontSize":12,"fontFamily":1,"type":"text","strokeColor":"#888888","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bk","seed":163038412,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"16","x":700.0,"y":230.0,"text":"AES: Möbius Bridge fingerprinting","fontSize":14,"fontFamily":1,"type":"text","strokeColor":"#e6422c","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bl","seed":163038413,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"17","x":700.0,"y":255.0,"text":"→ 200-800x faster attack on 7-round AES-128","fontSize":12,"fontFamily":1,"type":"text","strokeColor":"#888888","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bm","seed":163038414,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
arrow {"id":"18","x":900.0,"y":250.0,"points":"[0,0],[1,0]","startArrowhead":null,"endArrowhead":"arrow","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bn","seed":163038415,"groupIds":[],"roundness":{"type":2},"status":"active","strokeSharpness":"sharp","optionsId":"default"}
text {"id":"19","x":1050.0,"y":130.0,"text":"Phase 4: Validation & Disclosure","fontSize":20,"fontFamily":1,"type":"text","strokeColor":"#457b9d","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bo","seed":163038416,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"20","x":1050.0,"y":170.0,"text":"Self-verification pipeline","fontSize":14,"fontFamily":1,"type":"text","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bp","seed":163038417,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"21","x":1050.0,"y":195.0,"text":"Human validation (weeks-months)","fontSize":12,"fontFamily":1,"type":"text","strokeColor":"#888888","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bq","seed":163038418,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"22","x":1050.0,"y":220.0,"text":"Responsible disclosure coordination","fontSize":12,"fontFamily":1,"type":"text","strokeColor":"#888888","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"br","seed":163038419,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"23","x":1050.0,"y":245.0,"text":"Government + industry consultation","fontSize":12,"fontFamily":1,"type":"text","strokeColor":"#888888","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bs","seed":163038420,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"24","x":100.0,"y":310.0,"text":"Cost: ~$100K per discovery","fontSize":14,"fontFamily":1,"type":"text","strokeColor":"#e6422c","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bt","seed":163038421,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"25","x":100.0,"y":340.0,"text":"Human role: project management,","fontSize":12,"fontFamily":1,"type":"text","strokeColor":"#888888","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bu","seed":163038422,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"26","x":100.0,"y":360.0,"text":"validation, steering prompts","fontSize":12,"fontFamily":1,"type":"text","strokeColor":"#888888","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bv","seed":163038423,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"27","x":350.0,"y":310.0,"text":"Key insight: model must be prompted","fontSize":12,"fontFamily":1,"type":"text","strokeColor":"#e6422c","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bw","seed":163038424,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"28","x":350.0,"y":335.0,"text":"to overcome 'this is impossible' bias","fontSize":12,"fontFamily":1,"type":"text","strokeColor":"#e6422c","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bx","seed":163038425,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"29","x":700.0,"y":310.0,"text":"Also found attacks on: LEA, Serpent,","fontSize":12,"fontFamily":1,"type":"text","strokeColor":"#888888","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"by","seed":163038426,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"30","x":700.0,"y":335.0,"text":"Salsa20, Poseidon, SHA-1","fontSize":12,"fontFamily":1,"type":"text","strokeColor":"#888888","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bz","seed":163038427,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"31","x":1050.0,"y":310.0,"text":"Benchmark: CryptanalysisBench","fontSize":12,"fontFamily":1,"type":"text","strokeColor":"#888888","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"ca","seed":163038428,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"32","x":1050.0,"y":335.0,"text":"(ETH Zurich + TAU + U. Haifa)","fontSize":12,"fontFamily":1,"type":"text","strokeColor":"#888888","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"cb","seed":163038429,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"33","x":400.0,"y":430.0,"text":"Implications: AI cryptanalysis accelerates the adversarial review process","fontSize":18,"fontFamily":1,"type":"text","strokeColor":"#457b9d","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"cc","seed":163038430,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"34","x":400.0,"y":470.0,"text":"that underpins cryptographic standardization","fontSize":18,"fontFamily":1,"type":"text","strokeColor":"#457b9d","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"cd","seed":163038431,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"35","x":400.0,"y":530.0,"text":"But: human validation bottleneck grows as AI output volume increases","fontSize":16,"fontFamily":1,"type":"text","strokeColor":"#e6422c","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"ce","seed":163038432,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
```

## References

- [Original Article: Discovering cryptographic weaknesses with Claude](https://www.anthropic.com/research/discovering-cryptographic-weaknesses) — Anthropic Frontier Red Team, July 28, 2026
- [HAWK Key Recovery Paper](https://anthropic.com/document/hawk_key_recovery.pdf) — Full technical details of the HAWK attack
- [AES Möbius Bridge Paper](https://anthropic.com/document/aes_mobius_bridge.pdf) — Full technical details of the AES attack
- [AES Chain of Thought](https://anthropic.com/document/aes_mobius_bridge_cot.pdf) — Claude's reasoning during the AES discovery
- [CryptanalysisBench Paper](https://arxiv.org/abs/2607.18538) — Benchmark for evaluating LLM cryptanalytic capabilities
- [Demonstration Code](https://github.com/anthropics/cryptography-research-demo) — Runnable attack implementations
- [NIST Post-Quantum Cryptography Standardization](https://csrc.nist.gov/Projects/post-quantum-cryptography/post-quantum-cryptography-standardization)
- [NIST Additional Digital Signatures — Round 3](https://csrc.nist.gov/projects/pqc-dig-sig/round-3-additional-signatures)
- [HAWK Specification](https://hawk-sign.info/)
- [Prior HAWK Automorphism Work](https://eprint.iacr.org/2025/928) — Proved automorphism-based attack feasibility
