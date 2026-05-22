---
title: Running Agents on Kubernetes with Agent Sandbox
diataxis: howto
domain: "Cloud & Infrastructure"
topic: Kubernetes
source: Kubernetes
source_url: "https://kubernetes.io/blog/2026/03/20/running-agents-on-kubernetes-with-agent-sandbox/"
date: 2026-05-22
keywords:
  - "knowledge-base"
  - "Kubernetes"
  - "Cloud & Infrastructure"
---
# Running Agents on Kubernetes with Agent Sandbox

## Summary
The Agent Sandbox project (SIG Apps) introduces a declarative, standardized API for managing isolated, stateful, singleton AI agent workloads on Kubernetes. Unlike traditional K8s primitives (StatefulSet, PVC, Headless Service), Agent Sandbox is purpose-built for bursty, mostly-idle, long-running autonomous agents that maintain context, use external tools, and execute code.

## Why This Matters
AI is evolving from transient 50ms inference calls to **long-running, autonomous agents** that maintain state over hours or days. Traditional Kubernetes primitives misalign with singleton, idle-heavy workloads — managing them at scale becomes an operational nightmare without a dedicated abstraction.

## Core Features

### Strong Isolation
Natively supports secure runtimes like `gVisor` or `Kata Containers` for kernel/network isolation — critical for executing untrusted, autonomously generated code.

### Lifecycle Management
Optimized for bursty workloads. Supports **scale-to-zero** during idle periods while guaranteeing rapid, stateful resumption.

### Stable Identity
Assigns a persistent hostname and network identity to each Sandbox, enabling seamless multi-agent discovery and communication.

## Installation

```bash
# Replace "vX.Y.Z" with a specific version tag from
# https://github.com/kubernetes-sigs/agent-sandbox/releases
export VERSION="vX.Y.Z"

# Install the core components:
kubectl apply -f https://github.com/kubernetes-sigs/agent-sandbox/releases/download/${VERSION}/manifest.yaml

# Install the extensions components (optional):
kubectl apply -f https://github.com/kubernetes-sigs/agent-sandbox/releases/download/${VERSION}/extensions.yaml

# Install the Python SDK (optional):
python3 -m venv .venv
source .venv/bin/activate
pip install k8s-agent-sandbox
```

## Extensions API: Cold Start Mitigation

### The Problem
Pod startup adds ~1 second of overhead, breaking interaction continuity when invoking idle agents.

### The Solution: SandboxWarmPool
Maintains pre-provisioned Sandbox pods, eliminating cold starts.

### Workflow
1. Orchestration services issue a `SandboxClaim` against a `SandboxTemplate`
2. The controller instantly hands over a pre-warmed, fully isolated environment
3. Agent runs to completion; sandbox returns to warm pool or tears down

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                 Orchestration Layer              │
│  (Agent Framework: LangChain, AutoGen, etc.)    │
└──────────────────┬──────────────────────────────┘
                   │ SandboxClaim
┌──────────────────▼──────────────────────────────┐
│              Agent Sandbox Controller            │
│  ┌─────────────┐  ┌──────────────────────────┐  │
│  │Sandbox CRD  │  │  SandboxWarmPool          │  │
│  │(Singleton,  │  │  (Pre-warmed pods)        │  │
│  │ Stateful)   │  └──────────────────────────┘  │
│  └──────┬──────┘                                │
│         │ Assigns                                │
└─────────▼────────────────────────────────────────┘
         │
┌────────▼────────────────────────────────────────┐
│              Isolation Runtime                   │
│  ┌─────────────┐    ┌────────────────────────┐  │
│  │   gVisor    │ OR │    Kata Containers     │  │
│  │ (User-space │    │  (MicroVM isolation)   │  │
│  │  kernel)    │    └────────────────────────┘  │
│  └──────┬──────┘                                │
│         │ Runs Agent Workload                    │
└─────────▼────────────────────────────────────────┘
         │
┌────────▼────────────────────────────────────────┐
│              Kubernetes Cluster                  │
│  (Nodes, CNI, CSI, Resource Management)         │
└─────────────────────────────────────────────────┘
```

## How-To: Deploy Your First Agent Sandbox

### Step 1: Install the CRD and Controller
```bash
export VERSION="v0.1.0"  # Use latest release
kubectl apply -f https://github.com/kubernetes-sigs/agent-sandbox/releases/download/${VERSION}/manifest.yaml
```

### Step 2: Define a SandboxTemplate
```yaml
apiVersion: sandbox.apps.k8s.io/v1alpha1
kind: SandboxTemplate
metadata:
  name: my-agent-template
spec:
  runtimeClassName: gvisor  # or kata-qemu
  template:
    spec:
      containers:
      - name: agent
        image: my-agent-runtime:latest
        resources:
          requests:
            cpu: "500m"
            memory: "512Mi"
```

### Step 3: Create a Warm Pool (Optional)
```yaml
apiVersion: sandbox.apps.k8s.io/v1alpha1
kind: SandboxWarmPool
metadata:
  name: my-warm-pool
spec:
  templateRef: my-agent-template
  minSize: 2
  maxSize: 10
```

### Step 4: Claim a Sandbox from Your Application
```python
from k8s_agent_sandbox import SandboxClient

client = SandboxClient()
sandbox = client.claim(template="my-agent-template")
# sandbox is now a running, isolated environment
sandbox.execute("python3 agent_script.py")
```

## Key Takeaways

1. **Use Agent Sandbox for long-running, stateful agent workloads** — not for transient inference
2. **Enable gVisor or Kata isolation** for untrusted code execution
3. **Deploy SandboxWarmPool** to eliminate cold starts in interactive scenarios
4. **Leverage stable identity** for multi-agent communication and discovery
5. **Monitor sandbox lifecycle** — scale-to-zero saves resources during idle periods

## Common Pitfalls

- **Wrong runtime selection:** gVisor has lower overhead but less isolation than Kata; choose based on trust model
- **Ignoring warm pool sizing:** Too few warm pods → cold starts; too many → wasted resources
- **State persistence:** Ensure sandbox PVCs are properly configured for stateful resumption
- **Resource limits:** Agent workloads can be unpredictable; set appropriate resource requests/limits

## Related Topics

- [[reference-kubernetes-v136-release-overview|Kubernetes v1.36 Release Overview]]
- [[reference-ci-for-coding-agents|CI for Coding Agents: Plans]]

## References

- 📰 [Running Agents on Kubernetes with Agent Sandbox](https://kubernetes.io/blog/2026/03/20/running-agents-on-kubernetes-with-agent-sandbox/) via Kubernetes Blog (March 20, 2026)
- 🔍 [Agent Sandbox GitHub Repository](https://github.com/kubernetes-sigs/agent-sandbox)
- 🔍 [Agent Sandbox Official Website](https://agent-sandbox.sigs.k8s.io/)
- 🔍 [How to sandbox AI agents in 2026](https://northflank.com/blog/how-to-sandbox-ai-agents) via Northflank

---
*Created by Hermes Agent Knowledge Researcher — Daily Deep Research Pipeline (May 22, 2026)*
