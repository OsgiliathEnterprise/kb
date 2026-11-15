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

## Registry-side hardening checklist (Harbor-specific)

The incident's precondition was a *public Harbor project*. Defense in depth at the registry layer:

- **Change the default admin password at deploy time.** Harbor ships with a documented default administrator password (`Harbor12345`, set via `harbor_admin_password` in `harbor.yml`); the install docs expect you to change it before exposing the registry — and exposed Harbors with the default still appear in scanning results. This is a tracked vulnerability, not just a hygiene tip: **CVE-2026-4404** covers hardcoded default credentials in GoHarbor ≤ 2.15.0 granting web-UI access ([NVD](https://nvd.nist.gov/vuln/detail/CVE-2026-4404), [GitLab advisory](https://advisories.gitlab.com/pkg/golang/github.com/goharbor/harbor/CVE-2026-4404/)). Automate it in the Helm values / compose bring-up, don't rely on manual steps.
- **No public projects by default.** Make every project private; anonymous `service/token` minting and blob pulls (steps 2–3 of the exposure chain) simply fail against private projects. Audit with the API: list all projects and flag `public` visibility.
- **Rate-limit and alert on anonymous pulls**, since unauthenticated manifest/blob traffic to a registry is anomalous by definition once public projects are gone.
- **Scan registry contents, not just source.** Run secret scanners (TruffleHog/gitleaks) over pushed image layers *and* config blobs in CI, so `history[].created_by` leaks are caught before publication.
- **Sign and verify images** (cosign/Notary or Docker Content Trust) so a tampered or leaked registry cannot silently serve attacker-built images to CI.

## Why this matters for AI-era threat modeling

The same recon → anonymous-pull → history-inspection path is exactly what an autonomous attacker agent can execute unattended; a live admin token discoverable in ~25 minutes of black-box scanning means the defense must be continuous self-scanning, not periodic audits. See also [How a Malicious LLM Could Take Over Its Inference Host](../../securityprivacy/aiagentsecurity/explanation-llm-inference-engine-exploits.md) for the complementary agent-side threat model.

## References

- [Strix: We wanted to use Baseten for inference. We ended up with admin access to Baseten GitHub repos](https://www.strix.ai/blog/baseten-harbor-github-pat-takeover)
- [TruffleHog (secret scanning, open source)](https://github.com/trufflesecurity/trufflehog)
- [BuildKit secret mounts (`--secret`)](https://docs.docker.com/build/concepts/secrets/)
- [Harbor docs: Configure the Harbor YML File (default `harbor_admin_password`)](https://goharbor.io/docs/2.0.0/install-config/configure-yml-file/)
- [Harbor docs: Run the Installer Script (project/registry bring-up)](https://goharbor.io/docs/1.10/install-config/run-installer-script/)
