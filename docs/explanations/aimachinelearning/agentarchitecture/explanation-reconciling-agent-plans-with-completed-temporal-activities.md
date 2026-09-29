---
title: Reconciling AI Decisions With Completed Temporal Activities — Plan Is Intent,
  History Is Fact
diataxis: Explanation
domain: ai-machine-learning
topic: agent-architecture
source: DZone AI/ML
source_url: https://dzone.com/articles/agent-plan-temporal-activities
date: 2026-09-29
keywords:
- knowledge-base
- agent-architecture
- ai-machine-learning
- explanations
---
# Reconciling AI Decisions With Completed Temporal Activities — Plan Is Intent, History Is Fact

An AI agent rarely follows a long plan exactly as first proposed. Tool results expose missing facts, external systems change, policies arrive through human input, and a model may discover that an earlier assumption was wrong. ReAct-style agents were explicitly designed around this interleaving of reasoning, action, observation, and plan updates rather than one immutable plan. The engineering difficulty begins when those actions are **durable side effects**.

In Temporal, a completed Activity is not an intention that can be edited out of a revised plan; its completion and result are part of the Workflow Event History. Replanning therefore has to reconcile a new decision with an already-real past.

## A plan is intent; history is fact

The cleanest mental model separates **plan state** from **committed execution state**. The plan is provisional — what the agent currently intends to do. Committed state represents facts established by completed Activities, accepted external messages, and other durable events. Temporal stores Workflow history as an append-only sequence and uses it to reconstruct Workflow state during replay. An `ActivityTaskCompleted` event contains the serialized Activity result, so a later model decision cannot make that completion disappear.

That distinction changes the shape of the agent loop. Instead of asking an LLM to generate a complete plan and then blindly executing it, each replanning call should receive the goal, the latest observations, the prior plan revision, **and** a normalized set of committed effects. The model may abandon remaining steps, but completed steps enter the next prompt as constraints on the current world state:

```java
public AgentResult run(Goal goal) {
    while (!goalSatisfied(goal, committed)) {
        Plan plan = planner.replan(
            new PlanningContext(goal, revision, committed));

        for (Action action : plan.readyActions()) {
            if (alreadySatisfied(action, committed)) {
                continue;
            }
            ActionReceipt receipt = tools.execute(action, action.operationId());
            committed.add(receipt);
            if (receipt.requiresReplan()) {
                break;
            }
        }
        revision++;
    }
    return summarize(committed);
}
```

In this shape, `planner.replan(...)` and `tools.execute(...)` are **Activities**, not arbitrary network calls from Workflow code. That matters because Workflow code must remain replay-safe, while non-deterministic operations such as LLM invocations belong behind durable boundaries. Temporal records Activity results in history and returns those recorded results during replay instead of re-running the external call.

## Replanning should consume effects, not merely step status

A boolean such as `completed=true` is usually too weak for reconciliation. A completed tool call should return an **execution receipt** describing the externally relevant postcondition: resource identifiers, amounts, versions, timestamps when materially relevant, and whether a compensating operation exists. The agent then reasons from effects rather than from labels like "step three succeeded."

Consider a reservation agent that initially plans to reserve inventory, create a shipment, and notify a customer. Inventory reservation succeeds, but shipment creation reports a destination restriction. A revised plan must not schedule another reservation merely because the original plan was discarded. The durable input to replanning should state that a specific reservation already exists and identify it. The next plan might change the shipping method, release the reservation, or escalate for approval — but it should not pretend the reservation never happened.

## Two guards: planning epochs and stable operation identity

**Planning epoch.** External input can arrive while a planning Activity is outstanding; Temporal schedules Workflow Tasks when Signals or Updates arrive, and those messages can mutate durable Workflow state. A plan generated from revision 12 should therefore not be committed blindly if the state has advanced to revision 13 before the planner returns. The planner result carries the revision it used as input, and the Workflow discards stale output and requests a fresh plan — optimistic concurrency control applied to agent reasoning rather than database rows.

**Stable operation identity.** Retries make stable identity equally important. Temporal recommends idempotent Activities because Activities can be retried; its documentation specifically notes that idempotency keys are appropriate for critical side effects. A plan revision must therefore not double as an operation identity: a reservation that remains semantically the same across replans retains the same business operation key, while a genuinely new reservation receives a new key.

```java
public ReservationReceipt reserve(ReservationCommand command) {
    return inventory.reserve(
        command.sku(),
        command.quantity(),
        command.operationId());   // passed through to a downstream API that enforces idempotency
}
```

The receipt returned to the Workflow becomes durable evidence of the reservation. This also prevents a subtle failure mode in which a model repeats a tool call after losing conversational context even though the Workflow already possesses proof of the earlier effect.

## Cancellation and compensation are forward actions

A changed plan often creates pressure to "cancel the old step," but cancellation has a precise boundary: it can stop work that is still **in flight**; it cannot retroactively cancel an Activity that has already completed. For long-running Activities, Temporal delivers cancellation cooperatively through Activity heartbeats, so heartbeat configuration determines how promptly an Activity can observe a cancellation request.

Once an effect has committed, reconciliation becomes a domain operation. If the effect is reversible, **compensation** is normally the correct mechanism — the Saga pattern: a sequence of local operations paired with compensating actions, typically executed in reverse order when later work makes earlier effects undesirable. The important semantic point is that compensation creates *new* history; it does not rewrite old history. A released reservation follows a created reservation; a refund follows a charge; a revocation follows a grant:

```java
private void reconcile(Plan revisedPlan) {
    for (ActionReceipt receipt : compensationsInReverseOrder(revisedPlan, committed)) {
        ActionReceipt reversal = tools.compensate(receipt);
        committed.add(reversal);
    }
}
```

Not every action has a true inverse. An email cannot be unsent, an external party may already have observed a published event, and a physical operation may have crossed an irreversible boundary. Such effects should be modeled as **facts that constrain future planning**, not as failures of rollback. The revised plan can issue a correction, create a follow-up notification, or route the case to a human decision — but the historical effect remains part of the state presented to the agent.

## Durable agents need forward-only semantics

Replanning also needs to stay distinct from Workflow code versioning. A model changing its runtime plan is ordinary application behavior: a new planning Activity produces a new durable decision after new evidence arrives. Changing deployed Workflow code is different, because replay must still produce commands compatible with existing Event History — Temporal provides versioning and patching mechanisms for those code changes. Mixing the two concepts leads to brittle systems in which model variability is handled as deployment variability or, worse, non-deterministic Workflow logic.

External corrections fit the same forward-only model: Signals and Updates can change running Workflow state, and accepted messages become durable inputs that trigger another planning turn. For very long-running agents, Continue-As-New creates a fresh Event History while carrying forward explicit application state — which makes the committed-effect ledger an important part of the continuation payload rather than transient model memory.

## The central design rule

> An agent may revise intentions at any time, but durable execution never revises facts.

Completed Activities should be represented as committed effects with stable identities and useful receipts; in-flight work may be canceled cooperatively; reversible effects may be compensated; irreversible effects must constrain the next decision. Temporal's history then becomes more than a recovery mechanism — it becomes the authoritative boundary between what the agent merely planned and what the surrounding world has already observed. That boundary allows adaptive AI behavior without sacrificing replay safety, idempotency, auditability, or operational correctness.

## Related notes

- [Building Effectively-Once Agent Workflows](../../../how-to/aimachinelearning/agentarchitecture/howto-build-effectively-once-agent-workflows.md) — idempotency keys and resume semantics for agent workflows
- [Progressive Disclosure for AI Agents: On-Demand Skills Instead of Giant Prompts](explanation-progressive-disclosure-on-demand-skills.md)

## References

- [The Agent Changed Its Plan Mid-Run: Reconciling AI Decisions With Completed Temporal Activities (DZone)](https://dzone.com/articles/agent-plan-temporal-activities)
- [Temporal — durable execution and the Saga pattern](https://temporal.io/)
