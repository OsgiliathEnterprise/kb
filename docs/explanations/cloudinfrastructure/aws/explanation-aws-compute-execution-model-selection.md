---
title: 'Choosing AWS Compute: EC2 vs ECS vs EKS vs Fargate vs Lambda by Execution
  Model'
diataxis: Explanation
domain: cloud-infrastructure
topic: aws
source: DEV.to Tech News
source_url: https://dev.to/cloudsynthesizer/choosing-the-right-compute-service-on-aws-ec2-vs-ecs-vs-eks-vs-fargate-vs-lambda-n71
date: '2026-11-18'
keywords:
- knowledge-base
- aws
- cloud-infrastructure
- explanations
---
# Choosing AWS Compute: EC2 vs ECS vs EKS vs Fargate vs Lambda by Execution Model

## Overview
The article's framing is the useful part: AWS compute services are not five flavors of "server" — they are **four different execution models**, and conflating orchestration with compute is where teams pick wrong:
- **EC2** = virtual servers (you own OS, instance types, storage, software).
- **ECS / EKS** = container *orchestration* (ECS is AWS-native; EKS is a managed Kubernetes control plane — you still operate the workloads and node infrastructure).
- **Fargate** = container *compute* for ECS/EKS — removes EC2 instance management from under the orchestrator.
- **Lambda** = function execution driven by events; hard **15-minute maximum** execution duration for standard functions.

The clean mental model: *ECS and EKS orchestrate, Fargate provides compute, EC2 provides servers, Lambda is event-driven functions.*

## Selection matrix

| Service | Choose when | You take on |
|---|---|---|
| EC2 | OS-level control, licensed/specialized software, GPU workloads, hard-to-containerize legacy | OS patching, capacity planning, instance lifecycle |
| ECS | Containerized, AWS-focused, want orchestration without Kubernetes | Task definition, service design (EC2 or Fargate launch type) |
| EKS | Kubernetes APIs/ecosystem required, existing K8s expertise, portable K8s patterns | Control-plane is managed; workload + node ops still yours |
| Fargate | Containers without managing EC2; reduce infra overhead | Per-vCPU/memory provisioned billing, capacity limits |
| Lambda | Event-driven, short-running (≤15 min), spiky/idle demand | Cold starts, invocation volume cost, downstream dependency limits |

Cost is not hourly price: EC2/ECS-on-EC2 pay instance costs; Fargate charges provisioned resources x duration; Lambda charges requests + duration. Networking, storage, monitoring, and data transfer routinely dominate — compare with the AWS Pricing Calculator on the *full architecture*, not the compute line alone.

## Worked example (mixed stack beats one-size-fits-all)
An online store with three workloads:
1. Website + checkout → **ECS on Fargate** behind an Application Load Balancer (steady containerized web traffic, no instance management).
2. Product image processing → **Lambda** triggered by S3 uploads (event-driven, bursty, short tasks).
3. Legacy inventory app → **EC2** (needs specific OS configuration / licensed software).

The decision axis per workload: execution pattern (request/response vs event vs batch), infrastructure requirements (OS control? Kubernetes APIs?), scaling behavior (steady vs spiky vs idle), operational constraints (team expertise), total cost at expected utilization.

## Relevance to Our Domain
This is the decision framing to reuse when sizing serving platforms: steady GPU inference pools behave like EC2/steady-load workloads; bursty glue (webhooks, S3 pipelines) behaves like Lambda; containerized API layers are the ECS/Fargate case. Pairs with [[tutorial-full-stack-app-on-aws-fargate-vue-express-dynamodb]] (the hands-on Fargate path) and [[howto-cloud-budget-alerts-aws-gcp-azure]] (cost guardrails after the choice).

## References
- Original article: [Choosing the Right Compute Service on AWS](https://dev.to/cloudsynthesizer/choosing-the-right-compute-service-on-aws-ec2-vs-ecs-vs-eks-vs-fargate-vs-lambda-n71)
- AWS Lambda quotas (15-min limit): [Lambda quotas](https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-limits.html)
- AWS Pricing Calculator: [calculator.aws](https://calculator.aws/)
