---
title: ChatGPT and PCB Netlists — Where Language Models Fail at Pin-Level Facts
diataxis: Explanation
domain: AI-LLM
topic: LLM-Limits
source: DEV.to Tech News
source_url: https://dev.to/dibyaprakash_pradhan/can-chatgpt-design-a-pcb-what-its-netlist-gets-wrong-once-you-try-to-build-it-4666
date: 2026-10-04
keywords:
- knowledge-base
- LLM-Limits
- AI-LLM
- explanations
---
# ChatGPT and PCB Netlists — Where Language Models Fail at Pin-Level Facts

Search "ChatGPT PCB design" and you find two camps: it can do everything, or it is useless. Both are wrong; the useful answer sits in a specific place — **the netlist**. A language model cannot design a manufacturable PCB on its own (no geometry engine, no rule checker), but it is genuinely good at the half of PCB design that is *judgement*: choosing parts, explaining topologies, sanity-checking power budgets, and drafting a rough text netlist as a starting point. It is structurally unable to do the half that is *geometry*: placing components with real dimensions, routing multi-layer copper (a search problem over physical space), running design rule checks, or emitting Gerber/Excellon/pick-and-place files in exact formats a fab will reject if approximated.

## Four failure modes of LLM-drafted netlists

The author builds an AI PCB tool and runs language models through its pipeline daily; the numbers below come from those production runs (not ChatGPT specifically), but none depend on which model — they come from asking *any* text generator to recall pin-level facts:

1. **The same pin on two nets.** In 4 of 6 sampled boards, at least one pin appeared on two different nets — a short circuit. The pattern was always the same: a power pin listed on its rail, then again on a signal net (e.g. an ESP32 pull-up resistor `R6.2` on both `+3V3` and `EN`). Read as prose each line looks reasonable; only a check that asks "does any pin appear twice?" catches it.
   ```text
   +3V3     -> ..., U1.1, ...
   QSPI_CS  -> U1.1, U2.1
   ```
2. **Pinouts from memory.** A battery charger IC (MCP73831) came back as an 8-pin part with a "VPROG" pin; the real part is a 5-pin SOT-23-5. The model described a plausible chip that does not exist, with total confidence — and nothing in the text tells you so.
3. **The value field names the wrong thing.** Asked for an Arduino Nano soldered to a board, the model wrote the Nano's value as "ATmega328P" — the chip the Nano *carries*. Anything downstream that trusts that field builds around a bare 32-pin chip instead of the module.
4. **Same prompt, different circuit.** Temperature 0 does not make a hosted model repeatable: two identical runs gave 48 nets then 50 on one board, and 13 then 11 on another. Re-asking for "the" netlist yields a slightly different circuit — check the one you actually build.

Every one of these is a pin-level fact that has to be **looked up** in a symbol library or datasheet. Generating it is the wrong operation, and a better model does not change the operation.

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "pcb1",
      "type": "rectangle",
      "x": 40,
      "y": 60,
      "width": 230,
      "height": 90,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#c4e0f2",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "LLM (judgement half)\\nchoose parts + reasons\\ndraft text netlist\\nexplain topology / power budget", "fontSize": 13, "fontFamily": 1 }
    },
    {
      "id": "pcb2",
      "type": "rectangle",
      "x": 350,
      "y": 40,
      "width": 260,
      "height": 130,
      "strokeColor": "#c0392b",
      "backgroundColor": "#f5b7b1",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "distrust the draft\\ncheck every pin vs datasheet\\neach pin on exactly ONE net\\n(10-line script catches the common short)", "fontSize": 13, "fontFamily": 1 }
    },
    {
      "id": "pcb3",
      "type": "rectangle",
      "x": 690,
      "y": 40,
      "width": 280,
      "height": 130,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#d9ccff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "geometry + rules (computed)\\nplacement / routing / DRC / Gerber\\npins from library data, never memory\\nsame parts ⇒ same circuit every time", "fontSize": 13, "fontFamily": 1 }
    },
    {
      "id": "pcb4",
      "type": "rectangle",
      "x": 690,
      "y": 230,
      "width": 280,
      "height": 110,
      "strokeColor": "#c0392b",
      "backgroundColor": "#f5b7b1",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "DRC-passing ≠ electrically correct\\n(amp inputs tied together)\\nadd checks: two outputs on one net,\\nchip's own inputs shorted, regulator bypassed", "fontSize": 13, "fontFamily": 1 }
    },
    {
      "id": "pcb5",
      "type": "arrow",
      "x": 270,
      "y": 105,
      "width": 80,
      "height": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "points": [[0, 0], [80, 0]]
    },
    {
      "id": "pcb6",
      "type": "arrow",
      "x": 610,
      "y": 105,
      "width": 80,
      "height": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "points": [[0, 0], [80, 0]]
    },
    {
      "id": "pcb7",
      "type": "arrow",
      "x": 830,
      "y": 170,
      "width": 0,
      "height": 60,
      "strokeColor": "#c0392b",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "points": [[0, 0], [0, 60]]
    }
  ]
}
```

## The workflow that holds up

1. **Let it choose.** Describe the board; ask for parts and the reason for each — the judgement half, where LLMs are good.
2. **Ask for the netlist, then distrust it.** Treat it as a draft.
3. **Check every pin against the datasheet**, not against the model's memory — especially power, enable, reset, and anything on a module.
4. **Check that each pin is on exactly one net.** A ten-line script does this; it catches the most common short.
5. **Hand the result to a tool with geometry and rules**: placement, routing, DRC, and Gerber export are *computed*, not written.

The design principle behind PCBEditor's pipeline: **AI decides intent, algorithms verify physics.** Pins come from library data (KiCad symbol library + land pattern), never from model memory; nets are formed by rules over those pins so the same parts give the same circuit every time; placement is constrained and routing is a deterministic router with no AI in it. The test: if you swap the model tomorrow, the boards must still be correct — which is only true if correctness lives in code.

## DRC passing is not electrical correctness

A board passed routing and DRC with zero errors and was still electrically wrong: an amplifier's inputs were tied together. Routing and DRC check *geometry*, not whether the circuit works — so add checks for exactly that class: two outputs driving one net, a chip's own inputs shorted, a regulator bypassed. The general lesson: **anything that must be true needs a check that measures it.**

## Cross-reference with research on LLM-generated circuits

Independent work converges on the same split between generation and verification:

- [Validation and Simulation Catch Different Errors (arXiv 2609.26830)](https://arxiv.org/abs/2609.26830) — on 150 circuits, topological validation and ngspice disagreed in *both* directions: some structurally invalid netlists simulated cleanly (a silent divider reporting 5.00 V where the answer is 2.50 V), while others passed structural checks but were rejected by the simulator. A typed intermediate representation plus deterministic backend emission eliminated an entire failure class (23 of 79 baseline failures referenced a `.subckt` never defined).
- [SchGen (arXiv 2605.30345)](https://arxiv.org/html/2605.30345) — semantic-grounded code representations (relative coordinates, pin-name connectivity) lift valid-circuit rate from ~32% (raw KiCad text baseline) to 82%, with netlist accuracy as a strong proxy for expert-verified functional correctness.
- [HWE-Bench (arXiv 2603.18102)](https://ar5iv.labs.arxiv.org/html/2603.18102) — models are highly accurate on pins with conventional semantic names (TXD, SDA, RST) but produce serious omissions and connection hallucinations on multiplexed/redundant pins; a "pin locking" mechanism in static rule checks prevents the same physical pin being assigned to two exclusive nets.

## Quick answers

- **Can ChatGPT generate a schematic?** It can describe one and produce a text netlist — not a verified schematic with real footprints and pin mappings, because it has no component library to check against.
- **What is it actually good for in hardware design?** Part selection, explaining trade-offs, reviewing design decisions, drafting a first-pass netlist you intend to verify.
- **Will a newer model fix this?** It will get better at the judgement half. Placement, routing, DRC, and fabrication output need a geometry engine and rule checker; pin maps need lookup. A newer model gives you none of those — though agent-style tools that *drive* KiCad (e.g. GPT-6 Astra) shift the work to KiCad's own router rather than replacing it.

## References

- [Can ChatGPT Design a PCB? What Its Netlist Gets Wrong Once You Try to Build It (DEV.to)](https://dev.to/dibyaprakash_pradhan/can-chatgpt-design-a-pcb-what-its-netlist-gets-wrong-once-you-try-to-build-it-4666)
- [Validation and Simulation Catch Different Errors: Four Levels of Evaluation for LLM-Generated Circuits (arXiv)](https://arxiv.org/abs/2609.26830)
- [SchGen: PCB Schematic Generation with Semantic-Grounded Code Representations (arXiv)](https://arxiv.org/html/2605.30345)
- [HWE-Bench: Can Language Models Perform Board-level Schematic Designs? (arXiv)](https://ar5iv.labs.arxiv.org/html/2603.18102)
