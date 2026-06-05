---
title: 'GitLab 19.0: Full DevSecOps Orchestra'
diataxis: Explanation
domain: DevSecOps
topic: CI-CD-Pipelines
source: ''
source_url: https://thenewstack.io/gitlab-19-secrets-manager/
keywords:
- knowledge-base
- CI-CD-Pipelines
- DevSecOps
- explanations
---
# GitLab 19.0: Full DevSecOps Orchestra

## Overview

GitLab 19.0, released May 21, 2026, marks a significant expansion of GitLab's DevSecOps platform. The release introduces **Secrets Manager** in public beta, extends **agentic merge request workflows**, adds four open-source models for self-hosted Duo, and enhances supply chain security with SBOM dependency scanning.

## Key Features

### 1. GitLab Secrets Manager (Public Beta)

A centralized credential storage and access control system integrated directly into the GitLab platform:

- **Centralized secret storage**: Store API keys, passwords, certificates, and tokens within GitLab
- **Access control policies**: Fine-grained permissions for who can read, rotate, or delete secrets
- **Secret rotation automation**: Built-in rotation workflows for managed credentials
- **Reference in CI/CD**: Secrets available in pipeline variables without exposure in logs
- **Audit trail**: Complete history of secret access and modifications

```
┌─────────────────────────────────────────────────────┐
│              GitLab Secrets Manager                  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────┐   ┌──────────────┐               │
│  │  Secret      │   │  Access      │               │
│  │  Storage     │   │  Control     │               │
│  │  (encrypted) │   │  Policies    │               │
│  └──────┬───────┘   └──────┬───────┘               │
│         │                  │                        │
│         ▼                  ▼                        │
│  ┌──────────────────────────────────────┐           │
│  │         Secret Resolution Layer      │           │
│  │  - Variable injection                │           │
│  │  - Reference resolution              │           │
│  │  - Audit logging                     │           │
│  └──────────────┬───────────────────────┘           │
│                 │                                   │
│         ┌───────┴───────┐                           │
│         ▼               ▼                           │
│  ┌────────────┐  ┌────────────┐                      │
│  │  CI/CD     │  │  Runtime   │                      │
│  │  Pipelines │  │  Environments│                     │
│  └────────────┘  └────────────┘                      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 2. Agentic Merge Request Workflows

GitLab Duo's AI capabilities now extend to automated merge request processing:

- **Automated code review**: AI agents perform initial code review and suggest improvements
- **Test generation**: Auto-generate unit tests for changed code paths
- **Documentation updates**: AI-generated doc updates for modified APIs
- **Group-level review instructions**: Standardize review criteria across teams
- **Custom work item types**: Extend MR workflows with domain-specific task types

### 3. Supply Chain Security Enhancements

- **SBOM dependency scanning**: Automated Software Bill of Materials generation and vulnerability scanning
- **Secret Push Protection**: Detect and prevent accidental secret commits
- **Centralized security profiles**: Unified security configuration across projects and groups
- **Dependency provenance tracking**: Track package origins and build integrity

### 4. Self-Hosted Duo Enhancements

Four new open-source models available for self-hosted GitLab Duo deployments, enabling organizations with strict data sovereignty requirements to run AI features on-premise.

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                    GitLab 19.0 Platform                       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────┐  ┌──────────────────┐                  │
│  │   Source Code   │  │   Secrets        │                  │
│  │   Repository    │  │   Manager (Beta) │                  │
│  └────────┬────────┘  └────────┬─────────┘                  │
│           │                    │                             │
│           ▼                    ▼                             │
│  ┌──────────────────────────────────────┐                    │
│  │        CI/CD Pipeline Engine         │                    │
│  │                                      │                    │
│  │  ┌────────────┐  ┌────────────────┐ │                    │
│  │  │  Build     │  │  Security      │ │                    │
│  │  │  Stage     │  │  Scanning      │ │                    │
│  │  │            │  │  (SBOM + SAST) │ │                    │
│  │  └────────────┘  └────────────────┘ │                    │
│  │                                      │                    │
│  │  ┌────────────┐  ┌────────────────┐ │                    │
│  │  │  Test      │  │  Agentic       │ │                    │
│  │  │  Stage     │  │  MR Review     │ │                    │
│  │  │            │  │  (Duo AI)      │ │                    │
│  │  └────────────┘  └────────────────┘ │                    │
│  └───────────────┬─────────────────────┘                    │
│                  │                                          │
│                  ▼                                          │
│  ┌──────────────────────────────────────┐                    │
│  │       Deployment & Runtime           │                    │
│  │  - Environment secrets injection     │                    │
│  │  - Runtime security monitoring       │                    │
│  └──────────────────────────────────────┘                    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Migration Considerations

### For Teams Using External Secret Managers

1. **Assess overlap**: Determine which secrets can migrate to GitLab Secrets Manager
2. **Plan rotation schedule**: Coordinate secret rotation during migration
3. **Update CI/CD pipelines**: Replace external secret references with GitLab variables
4. **Test access policies**: Verify RBAC policies work as expected

### For Self-Hosted Deployments

1. **Evaluate hardware requirements**: AI model inference requires GPU resources
2. **Configure model selection**: Choose appropriate models for your use case
3. **Set up monitoring**: Track AI model performance and resource usage

## Best Practices

1. **Enable Secret Push Protection immediately** — Prevent accidental credential exposure
2. **Use group-level review instructions** — Standardize code quality across teams
3. **Generate SBOMs for every pipeline** — Maintain supply chain visibility
4. **Rotate secrets on schedule** — Use automated rotation where possible
5. **Audit secret access regularly** — Review who accessed what and when

## References

- [The New Stack: GitLab 19.0 trades its string section for a full DevSecOps orchestra](https://thenewstack.io/gitlab-19-secrets-manager/)
- [GitLab 19.0 Release Notes](https://docs.gitlab.com/releases/19/gitlab-19-0-released/)
- [GitLab Press Release: GitLab 19.0 Extends Intelligent Orchestration](https://about.gitlab.com/press/releases/2026-05-21-gitlab-19-extends-intelligent-orchestration-to-close-the-gap-between-writing-code-and-shipping-it/)
- [GitLab Secrets Manager Documentation](https://docs.gitlab.com/ee/user/security/secrets_manager/)
