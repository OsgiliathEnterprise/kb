---
title: How to Respond When a CI/CD or Remote Execution Service Is Compromised — JetBrains
  Cadence Incident Playbook
diataxis: How-to Guide
domain: cloud-infrastructure
topic: incident-response
source: TheNewStack
source_url: https://thenewstack.io/jetbrains-told-everyone-to-patch-it-didnt-patch-itself/
date: 2026-08-29
keywords:
- knowledge-base
- incident-response
- cloud-infrastructure
- how-to
---
# How to Respond When a CI/CD or Remote Execution Service Is Compromised — JetBrains Cadence Incident Playbook

JetBrains disclosed that attackers exploited **CVE-2026-63077** (critical, unauthenticated RCE on TeamCity On-Premises servers with HTTP/HTTPS access) against *JetBrains' own* server running its **Cadence** cloud development service — a server the company said "should have been patched as part of our response to the vulnerability, but it was not." JetBrains disclosed CVE-2026-63077 on July 27 and announced active exploitation by August 7; their own unpatched instance sat in exactly the sensitive position this incident class targets. This note turns the Cadence disclosure into a reusable response playbook for any compromised CI/CD or remote-execution environment.

## What was exposed (Cadence specifics)

- A **complete Cadence server backup from 2024** — potentially everything stored in it: credentials, configuration files, artifacts, logs.
- Multiple **AWS IAM users and their credentials**, including IAM users of JetBrains employees who had used Cadence.
- Files in **S3 buckets** within JetBrains AWS accounts used by the service (customer bucket access still under determination).
- Source code and project-embedded secrets: developers using the PyCharm plugin could sync project files to Cadence before running them.
- PII: usernames, real names, email addresses, last-login timestamps, last-accessed IP addresses.

## Step 1 — Treat everything that ran through the service as untrusted

The defining property of a compromised CI/CD or remote-execution system: it sits at the center of software delivery with access to private repos, dependencies, cloud storage, package registries, and deployment systems. Once the environment itself is compromised, **credentials that passed through it and artifacts it produced are both suspect**. JetBrains' guidance: anything run through Cadence during the affected period — including resulting output — should be treated as untrusted and verified against trusted source code and expected build results.

## Step 2 — Rotate every credential class that touched the service

JetBrains' rotation list is a good checklist for any similar incident:

- **Cloud**: AWS, Azure, Google Cloud credentials (IAM users, access keys).
- **Source control**: GitHub, GitLab, Bitbucket tokens; personal access tokens; SSH and deployment keys.
- **Package registries**: npm, Maven, NuGet, PyPI, container registries (Docker Hub, ECR, GCR, ACR) — especially any credential that can *publish* packages or artifacts.
- **Collaboration/API**: Slack tokens and webhooks, generic API tokens.
- **Identity/signing**: service account credentials, signing keys or certificates.

## Step 3 — Hunt for lateral movement in audit logs

Changing exposed credentials is only half the job; you must check whether they were *used elsewhere*. JetBrains' recommended checks:

- **Source control audit logs**: unexpected repository clones/downloads, unauthorized commits, changes to repository secrets or webhooks, new/changed personal access tokens, API tokens, SSH keys.
- **Cloud environments**: unexpected IAM changes, new users or service accounts, unusual storage access (e.g., S3 buckets); authentication logs showing credentials used from unknown locations.
- **Package repositories and release histories**: unexpected publications or changes — particularly where the compromised system held publish-capable credentials.

## Step 4 — Screen against published IoCs (and know their limits)

JetBrains published six IPs associated with detected exploitation: `150.109.230.104`, `43.153.227.206`, `62.210.127.48`, `210.247.242.190`, `15.235.225.205`, `152.233.30.18`. Their explicit caveat: **the indicators are not complete — not seeing them does not mean you were not compromised.** IoC matching is a fast filter, never a clearance test; the audit-log hunt in Step 3 is what actually establishes scope.

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "cd1",
      "type": "rectangle",
      "x": 60,
      "y": 80,
      "width": 240,
      "height": 110,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#f5c6c6",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "Unpatched TeamCity server\n(CVE-2026-63077)\nunauthenticated RCE",
        "fontSize": 14,
        "fontFamily": 1
      }
    },
    {
      "id": "cd2",
      "type": "rectangle",
      "x": 380,
      "y": 60,
      "width": 260,
      "height": 150,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#f9e0a3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "Exfiltrated\n2024 server backup (creds,\nconfigs, artifacts, logs)\nAWS IAM users + keys\nS3 bucket files\nsynced source code + PII",
        "fontSize": 14,
        "fontFamily": 1
      }
    },
    {
      "id": "cd3",
      "type": "rectangle",
      "x": 720,
      "y": 60,
      "width": 280,
      "height": 150,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#d9ccff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "Response\n1. treat all executions +\n   outputs as untrusted\n2. rotate every credential class\n3. audit logs: SCM, cloud IAM,\n   package registries\n4. screen IoCs (incomplete!)",
        "fontSize": 14,
        "fontFamily": 1
      }
    },
    [
      {
        "id": "cd4",
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
        "id": "cd5",
        "type": "arrow",
        "x": 640,
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

## Lessons for your own environment

1. **Patch your own instances of the products you vendor.** The irony that made this incident memorable: JetBrains told everyone to patch TeamCity and left their own server exposed. If you run on-prem CI/CD, include *your* instances in the same patch SLA as customer-facing systems — and verify the patch actually landed (this failure was a process gap, not a technical one).
2. **CI/CD is an acquisition target** precisely because of its central role: private repos, dependencies, cloud storage, registries, deployment systems all reachable from one box. Scope your response accordingly — a compromised build runner is a lateral-movement platform, not just a lost server.
3. **Backups are part of the blast radius.** A years-old backup containing credentials means "rotate everything that was ever in it," even if the live system was clean.
4. **Publish IoCs with an explicit completeness caveat** — and when consuming others' IoCs, treat absence as inconclusive.

## References

- [JetBrains told everyone to patch. It didn't patch itself. (The New Stack)](https://thenewstack.io/jetbrains-told-everyone-to-patch-it-didnt-patch-itself/)
- [CVE-2026-63077 — TeamCity On-Premises critical vulnerability disclosure](https://blog.jetbrains.com/teamcity/2026/07/cve-2026-63077/)
