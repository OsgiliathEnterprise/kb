---
title: Formally Verified Lean 4 Functions Running Inside Clojure Services via the
  Ansatz Lean/JVM SDK
diataxis: Example
domain: programming
topic: lean
source: DEV.to Tech News
source_url: https://dev.to/ganesh_rajendran_art/proving-what-ai-generates-running-formally-verified-lean-4-inside-clojure-services-3hip
date: 2026-11-07
keywords:
- knowledge-base
- lean
- programming
- examples
---
# Formally Verified Lean 4 Functions Running Inside Clojure Services via the Ansatz Lean/JVM SDK

A concrete, end-to-end demonstration of closing the loop between an AI coding agent, a theorem prover, and a production JVM service: the agent writes business logic + invariant theorems in **Lean 4**, the **Lean compiler** (not the agent's own judgment) acts as ground truth, proofs are erased at build time, and the proved code runs at production time as a portable `.leanjvm` artifact on stock **OpenJDK 17+** — no native C, no JNI, no Lean toolchain on the server.

The enabler is the **Ansatz Lean/JVM SDK** (`org.replikativ/ansatz-lean-jvm`, currently `0.2.615`, by the Simmis/replikativ team — the same team behind Ansatz, a dependently-typed Clojure DSL that shares Lean 4's CIC kernel, so proofs are interchangeable with Lean 4).

## Why this matters: the LLM reliability wall

Unit tests only sample finite inputs. The catastrophic financial-ledger bug lives in the untested corner where an overdraft limit, a currency-conversion edge, and a zero-sum constraint collide. Formal verification guarantees invariants for *all* inputs. Previously Lean was an island on the JVM:

- native binaries needed brittle JNI or Panama bridges;
- memory models clashed — Lean frees via reference counting, the JVM via GC, so cross-boundary reference cycles leaked;
- production servers needed the full native Lean toolchain.

The Ansatz SDK replaces all three with a **pure-JVM IR interpreter** managed entirely by the JVM garbage collector, an instruction budget (default: 2M ops) against runaway computations, and bidirectional host callbacks for IO.

## Round 1: the agent writes a plausible-but-wrong transfer

```lean
namespace Ledger

def transfer (fromBal toBal amount : Nat) : (Nat × Nat) :=
  (fromBal - amount, toBal + amount)

theorem transfer_conserves_value (fromBal toBal amount : Nat) :
  let (f, t) := transfer fromBal toBal amount
  f + t = fromBal + toBal := by
  unfold transfer
  -- FAILS: Nat subtraction truncates at zero (3 - 5 = 0),
  -- so conservation breaks when amount > fromBal
```

The Lean compiler rejects it cold:

```
error: unsolved goals
case h
fromBal toBal amount : Nat
⊢ (fromBal - amount) + (toBal + amount) = fromBal + toBal
```

The agent cannot hallucinate past this — the build stops.

## Round 2: self-correction with machine-checked invariants

```lean
namespace Ledger

def settleTransfer (fromBal toBal amount : Nat) : (Nat × Nat) :=
  if amount ≤ fromBal then
    (fromBal - amount, toBal + amount)
  else
    (fromBal, toBal) -- rejected transfer leaves balances unchanged

/-- Transfers strictly conserve total capital. -/
theorem settle_conserves_value (fromBal toBal amount : Nat) :
  let (f, t) := settleTransfer fromBal toBal amount
  f + t = fromBal + toBal := by
  unfold settleTransfer
  split
  · rename_i h
    omega
  · rfl

/-- The sender account never drops below zero (solvency). -/
theorem settle_preserves_solvency (fromBal toBal amount : Nat) :
  let (f, _) := settleTransfer fromBal toBal amount
  f ≤ fromBal := by
  unfold settleTransfer
  split
  · rename_i h
    omega
  · rfl

end Ledger
```

`omega` discharges the linear arithmetic goals. Both theorems now hold for **all** `Nat` combinations — conservation of value and solvency are guaranteed, not sampled.

## Build stage: compile the proof-checked artifact (CI, Linux x86-64 or Docker)

```bash
java -cp "$SDK_CLASSPATH" ansatz.lean.jvm.LeanPreparation \
  --source ./ledger \
  --sysroot "$LEAN_SYSROOT" \
  --producer-bundle "$PRODUCER_BUNDLE" \
  --cache "$COMPILER_CACHE" \
  --root-module Ledger \
  --entry Ledger.settleTransfer \
  --output ./ledger.leanjvm
# prints: sha256:d8a2...3f10  (manifest fingerprint to pin in production)
```

Native Lean (4.33.1 toolchain) checks proofs, strips them, and packages IR + types + layouts into the portable artifact.

## Production stage: interpret in Clojure (any OpenJDK 17+)

`deps.edn`:

```clojure
{:deps {org.replikativ/ansatz-lean-jvm {:mvn/version "0.2.615"}}}
```

```clojure
(ns ledger.core
  (:require [ansatz.lean.jvm :as lean]
            [clojure.java.io :as io]))

(defn run-settlement []
  (with-open [runtime (lean/open)
              input   (io/input-stream "ledger.leanjvm")
              project (lean/load-artifact runtime input
                        (System/getenv "EXPECTED_MANIFEST_SHA256"))]
    (let [settle (lean/function project "Ledger.settleTransfer")]
      {:valid-transfer     (settle 10000 1000 500)     ;; -> (9500, 1500)
       :overdraft-rejected (settle 10000 1000 15000)}))) ;; -> (10000, 1000)
```

Note the supply-chain hygiene: `load-artifact` takes the expected **SHA-256 manifest fingerprint**, so production refuses to run an artifact that was not the one CI proved.

## Pattern to reuse

1. **Build-time proofs, run-time JVM** — verification cost is paid in CI only; production stays a plain JVM deploy.
2. **The compiler as agent supervisor** — feed compiler errors back into the agent loop; the failing proof is an actionable counterexample, which turns "AI wrote it" into "AI wrote it *and proved it*".
3. **Prove the invariant, not the sample** — pick the two or three business invariants that must never break (here: conservation of value, solvency) and state them as theorems.
4. Pin artifacts by hash and budget executions (the SDK's 2M-instruction default) when running proved code in request paths.

## Caveats

- CI producer side currently needs Linux x86-64 (uses `prlimit`) or Docker; the consumer side runs on any OpenJDK 17+.
- Version is fast-moving (15 releases on Clojars/Maven at time of writing); treat the IR format and API as evolving.
- Only what you state as a theorem is guaranteed — an unmodelled invariant (e.g., rounding in currency conversion) is exactly as untested as before.

## References

- [DEV.to: Proving What AI Generates — Running Formally Verified Lean 4 Inside Clojure Services](https://dev.to/ganesh_rajendran_art/proving-what-ai-generates-running-formally-verified-lean-4-inside-clojure-services-3hip)
- [Simmis: Lean on the JVM — proved functions for Java and Clojure](https://simm.is/blog/lean-on-the-jvm/)
- [org.replikativ/ansatz-lean-jvm on Clojars](https://clojars.org/org.replikativ/ansatz-lean-jvm) (Apache-2.0; also on Maven Central)
- [replikativ/ansatz on GitHub — dependently typed Clojure DSL sharing Lean 4's CIC kernel](https://github.com/replikativ/ansatz)
- [Functional Programming in Lean](https://lean-lang.org/functional_programming_in_lean/)

## See also in this KB

- [The Classification of Finite Simple Groups Formalized in Lean](../../../explanations/programming/lean/explanation-cfsg-lean-formalization-axiommath.md) — Lean at industrial proof scale.
