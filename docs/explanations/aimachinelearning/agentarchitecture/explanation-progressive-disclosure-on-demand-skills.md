---
title: 'Progressive Disclosure for AI Agents: On-Demand Skills Instead of Giant Prompts'
diataxis: Explanation
domain: ai-machine-learning
topic: agent-architecture
source: DZone AI/ML
source_url: https://dzone.com/articles/progressive-disclosure-ai-agents
date: 2026-09-29
keywords:
- knowledge-base
- agent-architecture
- ai-machine-learning
- explanations
---
# Progressive Disclosure for AI Agents: On-Demand Skills Instead of Giant Prompts

Large agent prompts often begin as a practical shortcut: policies, domain rules, tool descriptions, examples, recovery procedures, and integration notes all go into one system message so every capability is always available. That approach stops scaling once an agent accumulates dozens of tools and specialized workflows — tool definitions and instructions consume context on every turn, irrelevant material competes with task-relevant material, and each integration enlarges a shared prompt that becomes harder to test and version.

Current platform guidance converges on a different model: **expose compact capability metadata first, load detailed instructions only after relevance is established, and execute specialized logic inside controlled tool or sandbox boundaries.** Anthropic describes this as progressive disclosure for Agent Skills; OpenAI supports both Skills and deferred tool discovery.

## Context should be earned, not prepaid

Progressive disclosure treats context as a runtime resource rather than a static configuration file:

1. **Level 1 — descriptors.** A skill registry initially contributes only metadata: name, purpose, version, input shape, side-effect class, required capabilities. This is what Anthropic pre-loads into the system prompt at startup (`name` + `description` from each installed skill's YAML frontmatter).
2. **Level 2 — main instructions.** When intent matches a descriptor, the runtime loads the skill's full body (Anthropic: the complete `SKILL.md`, read via bash; OpenAI: full instructions after selection).
3. **Level 3+ — supporting files.** Deeper references, scripts, templates, or schemas stay outside active context until needed. Scripts can be *executed* without their code ever entering context — only the output consumes tokens.

A minimal runtime contract keeps selection separate from execution:

```java
@Skill(id = "invoice.reconcile", version = "3", risk = "read")
public SkillResult invoke(SkillRequest request) {
    SkillDescriptor descriptor = registry.describe(request.skillId());
    SkillPackage skill = registry.load(descriptor.id(), descriptor.version());
    policy.authorize(request.principal(), descriptor, request.arguments());
    return sandbox.execute(skill, request.arguments(), request.deadline());
}
```

The important boundary is the **order of operations**: `describe` is metadata-oriented; `load` materializes selected instructions and resources; `authorize` evaluates the proposed operation independently of model reasoning; `sandbox.execute` provides an execution boundary. Skill discovery therefore does not imply permission, and packages can evolve independently while the core agent prompt stays small.

The motivation is not merely context-window capacity: larger context degrades recall and accuracy as token counts rise (Anthropic's context guidance), which is why OpenAI's tool-search interface defers selected function definitions until discovery instead of exposing every definition eagerly.

## Discovery is a protocol concern

Once skills become modular, capability negotiation matters as much as prompt composition. A descriptor should state what a skill needs *before* activation: structured output, file access, network access, long-running execution, approval support, or a protocol version. The runtime intersects those requirements with host support and policy so selection can fail early instead of letting an incompatible skill into the reasoning loop:

```java
public NegotiatedCapabilities negotiate(
        AgentCapabilities agent, SkillDescriptor skill, PolicyScope scope) {
    return agent.intersect(skill.requiredCapabilities())
                .restrictTo(scope.allowedCapabilities())
                .require(skill.minimumProtocolVersion());
}
```

MCP provides a useful reference model even when MCP is not used directly. In the 2026-07-28 specification, `server/discover` returns supported versions and server capabilities, while requests carry protocol version and client capability metadata; the same release adds `ttlMs` and `cacheScope` to cacheable discovery results plus change notifications for tool lists. These matter because production capability catalogs are dynamic — tools disappear due to permissions, outages, tenancy, or deployments — so cached discovery needs explicit freshness semantics.

A practical registry keeps a small cacheable index of descriptors and version pointers while storing full skill bodies separately. Version pinning prevents an active run from silently switching behavior mid-task; long-lived business state stays outside the prompt as structured run state, artifact references, or domain records (OpenAI's Agents documentation treats history, continuation identifiers, interruptions, and resumable state as explicit runtime surfaces rather than one text transcript).

## Execution boundaries matter more than prompt boundaries

Progressive disclosure reduces exposure but does not make a skill trustworthy. Skill instructions can contain executable scripts, tool calls, file references, and untrusted text — OpenAI warns that skills can introduce prompt-injection-driven data exfiltration and recommends review before exposure; Anthropic's programmatic tool-calling guidance distinguishes unsafe local execution from sandboxed execution with restrictions such as disabled network egress.

The safer design treats model output as a **proposal**: authorization is enforced beside the side effect, using independently computed identity, tenant, scope, destination, and argument constraints. Read-only skills can receive broader automatic execution; write, shell, credential, or external-network skills require approval (OpenAI's guardrail guidance makes the same boundary explicit: check tool arguments and results at the tool boundary, pause sensitive side effects for human approval).

Fallback behavior belongs in the contract rather than a vague prompt instruction:

```java
@SkillFallback(forSkill = "customer.profile")
private SkillResult fallback(ProfileRequest request, SkillException ex) {
    if (ex.retryable()) {
        return SkillResult.retry("profile-cache", request.customerId());
    }
    return SkillResult.partial("profile unavailable", ex.errorCode());
}
```

This distinguishes recoverable infrastructure failure from semantic failure. A fallback may choose a cached or lower-fidelity capability, but it must preserve the original authorization scope and return structured provenance indicating degraded execution. **Silent fallback to a more privileged tool is an anti-pattern** — availability logic then becomes privilege escalation.

## Production behavior needs evidence

Progressive disclosure introduces a measurable trade-off: smaller active context reduces token usage and model distraction, but discovery, loading, and sandbox startup add latency. Anthropic reports that programmatic tool calling reduced billed input tokens by about **38% on a 75-tool benchmark**, yet cost about **8% more** on a benchmark dominated by one or two sequential tool calls. Implication: eager loading remains reasonable for a tiny stable core; specialized or heavy capabilities benefit from on-demand activation.

Testing should cover more than final answer quality:

- **Skill-selection tests**: relevant activation and rejection of near-neighbor skills.
- **Contract tests**: schemas, capability requirements, version compatibility, timeouts, fallback semantics, policy denial.
- **Sandbox tests**: filesystem and network boundaries.
- **End-to-end evaluations**: score complete traces including tool choice, routing, and policy behavior (OpenAI's evaluation guidance supports trace grading across model calls, tool calls, guardrails, and handoffs).

Observability should expose the same lifecycle as the runtime: spans for discovery, descriptor match, package load, authorization, invocation, fallback, and completion — with skill ID, resolved version, latency, token counts, sandbox identity, policy decision, and outcome attached as structured attributes; sensitive arguments redacted.

## Rollout strategy

Incremental rollout is safer than replacing a giant prompt in one release:

1. Run existing prompt logic beside a metadata registry in **shadow mode** — selection decisions without executing skills.
2. Move read-only skills behind feature flags.
3. Canary traffic for side-effecting skills with approval enforced.
4. Versioned bundles and explicit registry pointers make rollback deterministic.

As evidence accumulates, stable instructions leave the monolithic prompt and become independently deployable capabilities. An extensible agent does not need an ever-growing prompt; it needs a small stable core, a discoverable capability surface, explicit negotiation, controlled execution, durable external state, and observable contracts. Progressive disclosure turns agent growth from prompt accumulation into modular software composition.

## Related notes

- [Sandboxed Execution and Runtime Engineering: What BoxAgnts Teaches About Agent Infrastructure](explanation-sandboxed-execution-runtime-engineering-for-ai-agents.md)
- [Rate Limits Are Not Quality Gates: The Guardrail Stack Behind an AI Agent](explanation-agent-guardrail-stack.md)

## References

- [From Giant Prompts to On-Demand Skills: Build an Extensible AI Agent With Progressive Disclosure (DZone)](https://dzone.com/articles/progressive-disclosure-ai-agents)
- [Equipping agents for the real world with Agent Skills (Anthropic Engineering)](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)
- [Agent Skills overview — Claude Platform Docs](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview)
