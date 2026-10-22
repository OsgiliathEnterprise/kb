---
title: Managing Docker config Resources Directly with the CLI
diataxis: How-to Guide
domain: cloud-infrastructure
topic: docker
source: ''
---
---
created: 2026-09-06
type: howto
title: "Managing Docker config Resources Directly with the CLI"
domain: cloud-infrastructure
topic: docker
source: "Ebook: Docker in Action, Second Edition by Jeff Nickoloff and Daniel Kuenzli"
source_book_id: calibrebook_537
source_chapter: "Chapter 12: First-class configuration abstractions"
tags: [docker-config, swarm-cli, immutability]
visibility: private
ai_tool_candidate: true

concise: true---

# Managing Docker config Resources Directly with the CLI

## Input parameters
- Config file path (or stdin via `-`)
- Cluster-unique resource name

## Procedure
1. Create from a file or stdin:
   ```bash
   docker config create my_config ./config/app.yml
   cat app.yml | docker config create my_config -
   ```
2. List and inspect:
   ```bash
   docker config ls
   docker config inspect <name>
   # Spec.Data holds the value Base64-encoded — encoding is for transport/storage only, NOT encryption; no confidentiality is provided by configs
   ```
3. Remove when unused: `docker config rm <name>` (fails while a service references it).

## Error handling
- **Configs are immutable** — there is no update subcommand. Recreating with the same name fails: `rpc error: code = AlreadyExists desc = config ... already exists`.
- A stack redeploy that would change an existing config's contents fails: `only updates to Labels are allowed` (labels are the only mutable field).
- Removing a config in use by a service is rejected; new tasks of dependent services may fail to start if their referenced ConfigID disappears.

## Verification
```bash
docker config inspect <name>   # ID, Version.Index, Spec.Name, Base64 Data
# decode: echo '<Data>' | base64 -d  → original file contents
docker service inspect --format '{{ json .Spec.TaskTemplate.ContainerSpec.Configs }}' <service>
# confirms the ConfigID linkage between service and resource
```

## Related notes
- Versioning Immutable config Resources for Automated Pipelines
- Working with Docker config Resources in Compose
