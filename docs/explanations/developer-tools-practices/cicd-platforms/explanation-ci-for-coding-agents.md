---
title: 'CI Wasn''t Built for Coding Agents: The Rise of "Plans"'
diataxis: Explanation
domain: Developer Tools & Practices
topic: CI-CD & Platforms
source: TheNewStack
source_url: https://thenewstack.io/ci-for-coding-agents/
date: 2026-05-22
keywords:
- knowledge-base
- CI-CD & Platforms
- Developer Tools & Practices
- explanations
---
# CI Wasn't Built for Coding Agents: The Rise of "Plans"

## Summary
Traditional CI pipelines are fundamentally misaligned with AI coding agents due to speed mismatch (CI takes 10-30 minutes vs. agent iterations in seconds). The solution: "Plans" — small, agent-pickable, end-to-end checks that run directly inside the agent's session against real integration environments, collapsing the inner/outer loop gap.

## Why This Matters
The "Two-Loop Tax": Agents ship from the fast, mocked inner loop because they can't wait for the slow, high-fidelity outer loop (CI/staging). This pushes integration verification to human developers and leaves the agent loop open. Plans shift integration testing left into the agent's inner loop.

## Core Problem: The Two-Loop Tax

| Aspect | Inner Loop (Agent) | Outer Loop (CI/Staging) |
|--------|-------------------|------------------------|
| Speed | Seconds | 10-30 minutes |
| Fidelity | Mocked, low | Production-grade |
| Execution | Agent session | Remote pipeline |
| Feedback | Immediate | Delayed |
| Who handles failures | Agent | Human developer |

## The Solution: "Plans" for Inner-Loop Validation

Plans are small, agent-pickable, end-to-end checks that run directly inside the agent's session against a real integration environment.

### Architecture Components

| Component | Description |
|-----------|-------------|
| **Ephemeral Environments** | On-demand, isolated environments with production-grade fidelity. Scoped per run, scalable to agent demand, tear down instantly. |
| **Actions** | Typed, deterministic building blocks (similar to GitHub Actions). Run against real infrastructure (live endpoints, real browsers, k6 load tests). Documented inline in Markdown. |
| **Plans** | Directed Acyclic Graphs (DAGs) compiled from actions. Authored in natural language. Each includes a `selectionHint` (prose description) so agents can automatically match a plan to a code diff. |

### Example Plan Spec

```yaml
spec:
  selectionHint: "End-to-end ride-request check for HotROD: pick pickup +
    dropoff in the React app, request a ride, assert the resulting
    itinerary shows both location names."
  steps:
  - id: e2e_ride
    action: { actionID: <playwright-action-id> }
    args:
      values:
        script: |
          test('itinerary shows pickup and dropoff', async ({ page }) => {
            await page.goto(process.env.BASE_URL + '/');
            await page.getByRole('button', { name: 'Request Ride' }).click();
            await expect(page.locator('.itinerary')).toContainText("Rachel's Floral Designs");
          });
```

## Practical Workflow Example

1. **Agent Change:** Renames a Go struct field (`Name` → `LocationName`). Compiles & passes unit tests.
2. **Pre-PR Validation:** Agent reads the diff, uses `selectionHint` to pick the ride-request plan, and runs it against an ephemeral environment.
3. **Failure Detection:** Playwright test fails. Frontend still reads `Name`, itinerary renders empty. Structured failure report surfaces the exact assertion break.
4. **Auto-Fix:** Agent traces the contract break, edits 4 frontend files, and re-runs the plan.
5. **Result:** Plan passes. PR opens already validated against the real cluster.

## Impact on the SDLC

- **Validation Moves Up:** Integration tests run in the authoring session before a PR is created
- **Staging Reverts to Sanity Check:** No longer the primary test bed; catches only edge cases
- **Behavioral Reviews:** Human reviews focus on intent and architecture, not validation stand-ins
- **Living Documentation:** Teams build a versioned library of plans that doubles as a reference for both agents and humans

## Implementation: Agent Skills

Delivered as scoped, loadable instructions compatible with modern AI harnesses (Claude Code, Cursor, Codex). Split into two narrow skills to prevent agent ambiguity:

- **`signadot-plan`**: Handles **authorship**. Converts natural language behavior descriptions into draft plans composed from the action catalog.
- **`signadot-validate`**: Handles **execution**. Reads diffs, selects plans via hints, spins ephemeral environments, runs tests, and surfaces structured failure reports for agent remediation.

## Actionable Takeaways

1. **Shift integration testing left** into the agent's inner loop to match AI iteration speeds
2. **Use ephemeral, production-fidelity environments** scoped per run to eliminate mock-driven false positives
3. **Structure tests as reusable "plans"** with natural language descriptions and `selectionHint` metadata for automatic agent routing
4. **Split agent responsibilities** into authorship vs. execution skills to reduce prompt ambiguity and improve reliability
5. **Treat plan libraries as system documentation** that evolves alongside the codebase

## Common Pitfalls

- **Over-mocking:** Tests against mocks can pass while real integration fails — always validate against real infrastructure
- **Plan sprawl:** Without proper organization, plan libraries become unwieldy; use `selectionHint` for discoverability
- **Slow ephemeral environments:** If environment spin-up takes too long, the inner loop advantage is lost
- **Ignoring plan maintenance:** Plans must evolve with the codebase; stale plans produce false confidence

## Related Topics

- [[explanation-maintainability-sensors-for-coding-agents|Maintainability Sensors for Coding Agents]]
- [[explanation-kubernetes-v136-release-overview|Kubernetes v1.36 Release Overview]]

## References

- 📰 [CI wasn't built for coding agents. Here's what comes next.](https://thenewstack.io/ci-for-coding-agents/) via TheNewStack (May 21, 2026)
- 🔍 [Signadot — Plans for AI Coding Agents](https://www.signadot.com/)

---
*Created by Hermes Agent Knowledge Researcher — Daily Deep Research Pipeline (May 22, 2026)*
