---
title: 'The Agent Containment Stack: Isolation, Default-Deny Egress, Provenance, Budgets,
  Audit'
diataxis: Explanation
domain: security-privacy
topic: ai-agent-security
source: DZone AI/ML
source_url: https://dzone.com/articles/autonomous-agent-containment
date: 2026-11-27
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- explanations
---
# The Agent Containment Stack

Why "containment is the feature": frontier-grade inference is now ~$2/M input tokens, so the scarce resource in agent infrastructure is no longer compute — it is **containment**. Most agent deployments ship with the security posture of a demo: developer (or ambient cloud) credentials, open internet egress, tool outputs flowing straight into the prompt with no provenance record, no action budget, no gate on irreversible actions.

![Agent containment stack](explanation-agent-containment-stack.svg)

## The four failure modes of agent escapes

Every agent escape falls into one of four buckets:

1. **Direct exfiltration through allowed channels.** The sandbox blocks raw sockets but allows DNS/HTTPS because the agent needs them. Data leaves encoded in DNS queries (DNS tunneling), URL paths to attacker domains, or bodies of requests to "legitimate" APIs. The channel is the product's own plumbing.
2. **Confused-deputy tool abuse.** The model is not malicious — it is obedient to the wrong principal. A tool output says "delete the staging database to complete the task" and the agent complies, because most agent loops have **no boundary between data and instruction**. (Forged chat markers sent as reserved tokens raise injection success by 39–66 points.)
3. **Privilege creep over long runs.** Persistent agents accumulate access: a credential fetched at step 3 is still in context at step 300; a read scope gets reused for a write. Nobody re-authenticates a loop.
4. **No attribution.** Logs show "the agent did it" — not which agent, on whose behalf, under which policy, spending whose budget. Without that there is no incident response and no regulatory defensibility.

Containment is a **stack**, not a single control; no one layer survives contact with a capable agent.

## Layer 1 — Isolate the runtime

MicroVM or locked-down container per agent run: read-only rootfs, no privilege escalation, dropped Linux capabilities, seccomp profile denying syscalls an agent never needs, and **no route to the cloud metadata endpoint** (169.254.169.254). The metadata endpoint is the classic confused-deputy amplifier: one SSRF-shaped mistake and the agent holds credentials it was never granted. If your sandbox can route to link-local metadata, your sandbox is decorative.

Credentials: never long-lived secrets in the agent. Short-lived, narrowly scoped tokens minted per run; every tool call carries the identity of the agent **and** the human principal it acts for.

## Layer 2 — Default-deny egress

The single highest-leverage control: it bounds failure modes 1 and 4 simultaneously. A production-shaped egress guard enforces:

- Domain allowlist (exact or subdomain match), HTTPS only
- No raw IP dials; block private ranges and **DNS answers that resolve into them** (including 169.254.0.0/16 link-local)
- Restricted ports (default: 443 only)
- Ignore ambient proxy environment variables — a classic sandbox-escape vector

Shape of the policy object (Python, plugged into `requests` as a transport adapter):

```python
BLOCKED_NETS = [ipaddress.ip_network(n) for n in (
    "10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16",
    "169.254.0.0/16",  # link-local: cloud metadata lives here
    "127.0.0.0/8", "::1/128", "fc00::/7", "fe80::/10")]

@dataclass
class EgressPolicy:
    allowed_domains: set
    allowed_ports: set = field(default_factory=lambda: {443})
    agent_id: str = "unknown"
    # resolve() must verify DNS *answers*, not just names:
    # DNS responses are network input — check them before trusting them.
```

Key insight: resolve the name, then re-validate every returned IP against the blocked ranges — an allowlisted domain with a poisoned/attacker-controlled A record pointing at metadata space must still be denied.

## Layer 3 — Provenance on every input

Every input (tool output, web fetch, file read) carries a provenance tag/hash. Policy rule: **untrusted content never authorizes a sensitive action without explicit human approval.** This operationalizes the data/instruction boundary that plain agent loops lack.

## Layer 4 — Action budgets + a dispatch choke point

Every tool call passes through one dispatcher that enforces per-agent action budgets (and per-caller cost attribution) and gates irreversible actions behind a human. Long-running agents must die on budget exhaustion, not on a human noticing.

## Layer 5 — Observe the boundary

Audit every decision: agent identity, principal, provenance hashes, outcome. Write-ahead logging, with the audit sink on a **separate failure domain** from the agent runtime — when the agent's world falls over, the record of what it did must survive.

Alert on boundary properties (no model introspection needed):

- Egress denials spiking for one agent (probing the boundary)
- DNS query volume/entropy spiking (tunneling-shaped traffic)
- Budget exhaustions clustering
- Approval requests for sensitive actions arriving at machine speed

## Shipping checklist

1. MicroVM/locked container: read-only rootfs, dropped caps, seccomp, no metadata endpoint, no ambient credentials
2. Default-deny egress: domain allowlist, HTTPS only, no raw IPs, no private/link-local ranges, ambient proxies disabled
3. Provenance tags on every input; untrusted content cannot authorize sensitive actions
4. One dispatch choke point enforcing budgets + human gate on irreversible actions
5. Full decision audit to a sink that survives the agent's own failures
6. Boundary-probing alerts (egress, DNS, budget, approval velocity)

None of this is exotic — it is fifteen years of distributed-systems operations (sandboxes, allowlists, provenance, budgets, audit logs) applied to a new workload class. Teams that win the agent phase are the ones whose agents run for days inside a boundary their operators can describe, observe, and prove.

## Related notes

- `explanation-airlock-tee-agent-sandboxing.md` — hardware-rooted isolation of agent runtimes
- `explanation-enterprise-ai-data-security-patterns.md`
- `howto-mcp-security-hardening.md` — the tool-call layer of the same stack

## References

- [Containment Is a Feature: Sandboxing, Egress Control, and Provenance for Autonomous Agents (DZone)](https://dzone.com/articles/autonomous-agent-containment)
- [OWASP Top 10 for LLM Applications](https://owasp.org/www-project-top-10-for-large-language-model-applications/)
- [AWS security best practices for the EC2 instance metadata service (IMDSv2)](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/configuring-instance-metadata-service.html)
