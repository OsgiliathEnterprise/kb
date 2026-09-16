---
title: Live GitHub Admin Token in a Public Container Image — The Baseten Harbor Incident
diataxis: Explanation
domain: cloud-infrastructure
topic: docker
source: HackerNews
source_url: https://www.strix.ai/blog/baseten-harbor-github-pat-takeover
date: 2026-09-16
keywords:
- knowledge-base
- docker
- cloud-infrastructure
- explanations
---
# Live GitHub Admin Token in a Public Container Image — The Baseten Harbor Incident

Security firm Strix ran its autonomous hacking agent against `*.baseten.co` before trusting the inference provider with customer data. Within ~25 minutes it found a **live GitHub personal access token for `basetenbot`** with repository-level admin rights on Baseten's main product repo, the GitOps repo driving their clusters, and their Homebrew tap — sitting in the **build history of a publicly pullable container image**, created March 2023 and still valid when found in July 2026.

## The exposure chain

1. **Recon**: host enumeration + certificate logs mapped the full surface; a Harbor registry at `gcp-us-east4-zlw.registry.baseten.co` had one **public project**.
2. **Anonymous pull access**: no token or auth was needed to list repositories, mint an anonymous `service/token` scoped to `repository:baseten/baseten-app:pull`, and download manifests and blobs — including the `baseten/baseten-app` image.
3. **Credential inside the image config**: a first hit (AWS keys) was dead (`InvalidClientTokenId`). Running TruffleHog over layers plus inspecting the image **config** found the GitHub PAT in `history[].created_by`: a Dockerfile `RUN` command whose value contained an expanded `GITHUB_TOKEN`.
4. **Impact verification (read-only)**: `GET /user` returned 200 for account `basetenbot`; `X-OAuth-Scopes: repo`; org membership `basetenlabs`; per-repo checks showed `admin: true, push: true` on the product/GitOps/Homebrew repos and read/write on customer-specific private repos.

The critical subtlety: **cleaning a credential file from an image does not remove it if the build history still contains another copy**. The config blob's `history[].created_by` fields record how each layer was created — including expanded secret values in `RUN` commands — and that config is downloadable alongside the image.

## Remediation checklist (from the post)

1. **See what someone can pull without logging in** — old tags, forgotten projects, public Harbor/registry projects included.
2. **Read build history**: `docker history --no-trunc`, or inspect the config blob's `history[].created_by` fields; check layers too (e.g., with TruffleHog).
3. **Get secrets out of build arguments** — use secret mounts (BuildKit `--secret`) and ensure consuming commands do not write them back into image metadata.
4. **Scope build tokens minimally and expire them** — fetching a dependency needs read access to that dependency; admin on product/deployment repos turns any leak into full repo takeover.

## Disclosure timeline (a good example of fast vendor response)

- July 13, 23:10 — live token, public Harbor project, and repo permissions reported.
- July 14 morning — Harbor project made private; reporter flagged the token still worked.
- July 14, 16:34 — Baseten security confirmed critical severity, rotated the token, requested secure deletion of pulled images.
- July 17 — remaining lower-severity findings closed out.

## Why this matters for AI-era threat modeling

The same recon → anonymous-pull → history-inspection path is exactly what an autonomous attacker agent can execute unattended; a live admin token discoverable in ~25 minutes of black-box scanning means the defense must be continuous self-scanning, not periodic audits. See also [How a Malicious LLM Could Take Over Its Inference Host](../../securityprivacy/aiagentsecurity/explanation-llm-inference-engine-exploits.md) for the complementary agent-side threat model.

## References

- [Strix: We wanted to use Baseten for inference. We ended up with admin access to Baseten GitHub repos](https://www.strix.ai/blog/baseten-harbor-github-pat-takeover)
- [TruffleHog (secret scanning, open source)](https://github.com/trufflesecurity/trufflehog)
- [BuildKit secret mounts (`--secret`)](https://docs.docker.com/build/concepts/secrets/)
