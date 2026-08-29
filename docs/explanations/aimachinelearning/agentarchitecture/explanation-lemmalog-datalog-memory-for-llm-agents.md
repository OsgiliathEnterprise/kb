---
title: Lemmalog — Maintaining LLM Agent State with a Datalog Engine (Facts, Retractions,
  Provenance)
diataxis: Explanation
domain: ai-machine-learning
topic: agent-architecture
source: HackerNews
source_url: https://pwning.systems/posts/llm-memory-program-analysis/
date: 2026-08-29
keywords:
- knowledge-base
- agent-architecture
- ai-machine-learning
- explanations
---
# Lemmalog — Maintaining LLM Agent State with a Datalog Engine (Facts, Retractions, Provenance)

Jordy Zomer's **Lemmalog** ([source](https://github.com/JordyZomer/lemmalog)) starts from a concrete failure mode of long-running LLM agents doing vulnerability research: after a few hours the model loses track of what was actually established — it re-suggests approaches already ruled out, forgets assumptions that turned out false, or keeps reasoning from observations that are no longer valid. Telling an LLM something is wrong does not make it stop believing everything that *depended* on it.

The insight: this is not a language-model problem, it is a **database/program-analysis problem**. If you establish `attacker controls object_a`, `object_a points to object_b`, `object_b is a kernel object`, you can derive `controls_kernel_object(attacker)`. Two hours later LLDB shows `object_a` does *not* point to `object_b` — and every conclusion that depended on that fact should be invalidated **automatically**, not by re-reading the transcript and hoping the model notices. That is exactly what incremental fixed-point evaluation with dependency tracking already solves in program analysis.

## The architecture: LLM as front-end, Datalog as IR + engine

The system splits into two parts:

- **The LLM handles the fuzzy part** — understanding natural language, source code, and debugger output, then converting it into structured facts (`freed(object_a)`, `reused_as(object_a, write_target)`).
- **Lemmalog handles the deterministic part** — a Datalog engine that takes facts + rules → derived facts, maintains them incrementally, and tracks how each fact was derived.

Conceptually it is "a slightly strange compiler": the LLM is the probabilistic front-end (source code / debugger output / notes → structured facts), Lemmalog is the IR and analysis engine (facts → deductive rules → maintained state), and another LLM invocation can turn that state back into natural language or the next experiment. The parser is probabilistic; everything after it does not have to be.

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "lm1",
      "type": "rectangle",
      "x": 60,
      "y": 80,
      "width": 240,
      "height": 110,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#c4e0f2",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "LLM front-end (probabilistic)\nsource code, debugger output,\nnatural-language notes\n-> structured facts",
        "fontSize": 14,
        "fontFamily": 1
      }
    },
    {
      "id": "lm2",
      "type": "rectangle",
      "x": 380,
      "y": 60,
      "width": 280,
      "height": 150,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#d9ccff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "Lemmalog (Datalog engine)\nfacts + rules -> derived facts\nincremental evaluation\nretractions, provenance,\ntemporal validity intervals",
        "fontSize": 14,
        "fontFamily": 1
      }
    },
    {
      "id": "lm3",
      "type": "rectangle",
      "x": 740,
      "y": 80,
      "width": 260,
      "height": 110,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#c9e7c9",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "Maintained state\nask 'why is X true?'\n(auto-invalidate stale conclusions)",
        "fontSize": 14,
        "fontFamily": 1
      }
    },
    [
      {
        "id": "lm4",
        "type": "arrow",
        "x": 300,
        "y": 135,
        "width": 80,
        "height": 0,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [
          [
            0,
            0
          ],
          [
            80,
            0
          ]
        ]
      }
    ],
    [
      {
        "id": "lm5",
        "type": "arrow",
        "x": 660,
        "y": 135,
        "width": 80,
        "height": 0,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [
          [
            0,
            0
          ],
          [
            80,
            0
          ]
        ]
      }
    ]
  ]
}
```

## The four hard problems (and why vector memory alone fails)

1. **Retractions.** Adding facts is easy; removing them is not. If `c :- a.` and `c :- b.`, then removing `a` must *not* remove `c` while `b` still supports it — but removing both should. Lemmalog tracks how each fact was derived (its support set) and updates that when inputs change, so conclusions with multiple independent derivations survive the loss of one.
2. **Provenance ("why is this true?").** Because dependencies are tracked, you can ask for the derivation tree of any conclusion (`candidate_3_is_exploitable` ← `attacker_controls_pointer` ← `observation_41`, …). If an observation later turns out wrong, the affected conclusions are removed automatically. This also attacks a specific LLM failure mode: the model confidently asserting "we already established X" when it did not — if no provenance supports X in Lemmalog, then X is simply not part of the maintained state. (It does not prevent hallucination *during extraction*, but makes unsupported conclusions hard to silently persist.)
3. **Temporal facts.** Replacing an old fact is not always deleting it: `viable(primitive_a) [10:14, 12:37)` followed by `not_viable(primitive_a) [12:37, ...)` lets you answer both "is it viable now?" and "why did we think it was earlier?" without keeping contradictory facts and asking the LLM to pick.
4. **Why not just a vector database?** Retrieval answers *"what past information is relevant to this question?"*; Lemmalog answers *"given everything learned so far, what is currently true?"* Cosine similarity retrieves `object_a points to object_b` because it is *relevant*, but does not know the statement was disproven two hours later or that five conclusions depended on it. The two problems are complementary — the current setup combines hybrid retrieval (BM25 + graph/entity boosts + embeddings, with original source snippets alongside structured facts) with the deductive state.

## Benchmark results (MemEval harness, standardized readers/judges)

Extraction at ingestion uses Claude Sonnet 4.6 (chunked, file-cached — paid once per conversation); everything after extraction uses the benchmark's own standardized readers and judges. Each run repeated three times to avoid seed luck.

**LongMemEval** (102 questions across user facts / assistant facts / preferences / multi-session / temporal / knowledge updates): Lemmalog **F1 0.463 ± 0.010**, accuracy 0.575 ± 0.004 — vs. PropMem 0.550, SimpleMem 0.480, OpenClaw 0.244, full context 0.222 (author's own GPT-4.1 full-context run: 0.197). Lemmalog tops the **Knowledge Update** category (0.579 vs PropMem 0.528, full context 0.202) — precisely the "we believed A, then learned A is no longer true" case it was built for. Its weak spot: multi-session reasoning (0.211 vs PropMem 0.582), diagnosed as *extraction* failures (the fact was never emitted), not derivation failures.

**LoCoMo** (10 long conversations, 1,986 questions): Lemmalog **F1 0.533 ± 0.001**, third among dedicated memory systems behind PropMem (0.605) and OpenClaw (0.557), ahead of full context (0.542). Standouts: adversarial false-premise questions (**0.707** vs full context 0.509 — a structured state can notice there is simply no supporting fact, so "no" becomes a usable answer) and temporal reasoning (jumped from 0.257 to **0.454** after fixing date handling).

## The debugging story: the front-end matters more than the engine

The first standardized LongMemEval configuration scored 0.226; the current one scores 0.463 — and most of that came from concrete computer-science bugs, not a bigger model:

- **Accidentally teaching refusal.** An anti-hallucination instruction ("make sure the answer is supported by retrieved facts") was interpreted as "if no single fact literally contains the final answer, refuse" — 32 of 102 questions (all answerable) got "Not mentioned." Fix: separate *absent/misattributed premise → refuse* from *evidence exists but requires counting/comparing/combining → reason over it*.
- **A dead counting path.** Count lines passed through a relevance filter whose plural stemmer only folded words longer than four characters, so `owns` never matched `own`, every count line was dropped, and counting questions silently received no counts. Fixing the stemmer + rendering counts with their facts + precomputing date arithmetic brought F1 to 0.463.
- **Dates as interned symbols.** Comparing date-like values as Datalog symbols meant `&lt;` compared internal ids — not dates. Normalizing extracted dates into comparable integers and deriving `happened_before` from real timestamps gained ~20 F1 points on temporal reasoning.
- **Entity reconciliation.** "I bought a Honda Civic" / "my car broke down" / "the Civic is fixed" extract as three different objects unless an episode-local → canonical-entity reconciliation pass connects them.

## What it still can't do (and the target architecture)

**Inference stays weak** (LoCoMo inferential: 0.164 vs PropMem 0.289): flattening "I prefer quiet restaurants, except when travelling with friends" into `prefers(user, quiet_restaurants)` throws away half the information before Datalog sees it. The direction is not abandoning structured memory but keeping conditional knowledge *conditional* (`prefers(User, lively) :- prefers_when(User, lively, with_friends), with_friends(User).`) and keeping original episode text available when structure loses nuance.

The resulting architecture is less "vector memory OR symbolic memory" and more a **deductive state** (facts / rules / time / provenance / retractions) alongside an **episodic memory** (fuzzy context, semantic retrieval, source text). The token economics reinforce the point: on LongMemEval the answering model sees ~2,700 tokens/question vs ~104,000 for full context (~38× less); on LoCoMo ~3,400 vs ~18,900 (~6×). Extraction is paid once; full-context prompting re-pays the entire history on every query — so with a persistent agent the gap grows until the full-context version stops fitting in the window at all.

## References

- [I accidentally turned LLM memory into program analysis (pwning.systems)](https://pwning.systems/posts/llm-memory-program-analysis/)
- [Lemmalog source code](https://github.com/JordyZomer/lemmalog)
- [MemEval — standardized LLM memory evaluation harness](https://github.com/ProsusAI/MemEval)
