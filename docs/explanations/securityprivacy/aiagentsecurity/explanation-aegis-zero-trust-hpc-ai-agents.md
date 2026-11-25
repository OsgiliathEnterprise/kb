---
title: 'Attestation is All You Need: Toward a Zero-Trust Architecture for HPC AI Agents'
diataxis: Explanation
domain: security-privacy
topic: ai-agent-security
source: arXiv
source_url: https://arxiv.org/abs/2611.32958
date: '2026-11-25'
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- explanations
---
# Attestation is All You Need: Toward a Zero-Trust Architecture for HPC AI Agents

**Authors:** Jie Li, Chenxu Niu, Tongyang Wang, Yong Chen


## Overview
AI agents are starting to automate data analysis, orchestration and simulation steering on HPC clusters — and they introduce a threat that existing cluster defenses miss: the **hijacked authorized agent**. An adversary subverts a legitimately authorized agent (prompt injection, poisoned shared data, compromised tools, or multi-agent coordination), then exfiltrates sensitive data through *legitimate, encrypted LLM API traffic*, which network-level defenses cannot flag. The paper proposes **behavioral attestation** as a runtime defense and implements it in **AEGIS**, a zero-trust monitor for HPC AI agents.

## Problem Statement
Cluster security assumes that authorized users and credentials behave as intended. A hijacked authorized agent defeats that assumption: its actions are agent-initiated, its credentials are genuine, and its exfiltration channel is ordinary encrypted API traffic. No deployed HPC defense inspects *what the agent actually does at the syscall level* against what its task should permit.

## Key Contribution
- **Behavioral attestation**: instead of attesting code identity, AEGIS attests *behavior* — it compiles **task-derived behavioral constraints** into profiles, monitors agent actions with **eBPF-based syscall interception**, and verifies observed evidence against those constraint profiles.
- **Cross-agent correlation**: behavior is correlated across agents — closing a gap opened by multi-agent coordination attacks where no single agent looks malicious.
- **Cluster-native containment**: verified violations trigger **SLURM-level containment**, using the scheduler as the enforcement point rather than bolted-on network controls.
- **Evaluation on the real attestation path**: detects all four implemented attack classes with **sub-second median detection latency** at a 1-second verification interval and low measured verifier overhead; full attack-suite coverage, stronger detection than representative baselines, and **no observed false positives** on the evaluated benign workflows.

## Technical Approach
AEGIS structures agent execution as a continuous attest loop: (1) compile the agent's assigned task into behavioral constraints; (2) intercept syscalls of the agent process tree via eBPF; (3) assemble runtime evidence and verify it against the constraint profile; (4) correlate evidence across cooperating agents; (5) on violation, ask SLURM to contain the job. Every privileged continuation thus requires fresh behavioral evidence — the zero-trust "never trust, always verify" principle applied to *actions*, not logins.

## Relevance to Our Domain
Our agent-security notes cover injection, tool poisoning and permission UX; AEGIS adds the runtime-enforcement layer we lack: syscall-level behavioral contracts for agents, with the scheduler as containment backbone. The pattern transfers beyond HPC — any Kubernetes/CI environment running agents could adopt task-derived constraint profiles + syscall/eBPF attestation, and the encrypted-LLM-API exfiltration channel is a blind spot worth adding to our threat models. Complements our skill-hub detector audit and Bounded Autonomy defense notes.

## References
- Paper: https://arxiv.org/abs/2611.32958
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.32958
- Related in KB: how-to-bounded-autonomy-resource-exhaustion-defense.md, explanation-skill-hub-detector-audit.md
