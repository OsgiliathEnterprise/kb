---
title: LiteLLM 1.107.0 PyPI Compromise — Credential Stealer and Self-Updating Backdoor
  Explained
diataxis: Explanation
domain: security-privacy
topic: supply-chain
source: SafeDep Blog
source_url: https://safedep.io/litellm-pypi-compromise-credential-stealer-backdoor/
date: 2026-10-22
keywords:
- knowledge-base
- supply-chain
- security-privacy
- explanations
---
# LiteLLM 1.107.0 PyPI Compromise — Credential Stealer and Self-Updating Backdoor Explained

On **2026-10-21**, seven `litellm` 1.107.0 wheels plus a source distribution were published to PyPI carrying a two-part implant: a **credential stealer** that fires once on first `pip install` and a **persistent C2 daemon** that checks an attacker-controlled GitHub repo hourly for second-stage code. The compromise went through the project's *own official release pipeline* — the wheels were built, signed, and published by the legitimate CI, which is why nothing in the package looked forged.

This note reconstructs the full attack chain, the implant mechanics, and the complete IOC set (SafeDep analysis, cross-referenced with LiteLLM's incident report, JFrog's investigation, and GitHub issue [#47826](https://github.com/BerriAI/litellm/issues/47826)).

## The attack chain

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "L1",
      "type": "rectangle",
      "x": 40,
      "y": 40,
      "width": 340,
      "height": 60,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#ffc9c9",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "seed": 601,
      "versionNonce": 601,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 3},
      "updated": 1760000000000
    },
    {
      "id": "L1t",
      "type": "text",
      "x": 55,
      "y": 55,
      "width": 310,
      "height": 30,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "seed": 602,
      "versionNonce": 602,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "updated": 1760000000000,
      "text": "1. Internal deployment logs leaked\\nGitHub CLI tokens of 3 developers",
      "fontSize": 14,
      "fontFamily": 2,
      "textAlign": "left",
      "verticalAlign": "top",
      "baseline": 36,
      "containerId": null,
      "originalText": "1. Internal deployment logs leaked\\nGitHub CLI tokens of 3 developers",
      "lineHeight": 1.25
    },
    {
      "id": "L2",
      "type": "rectangle",
      "x": 40,
      "y": 120,
      "width": 340,
      "height": 60,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#ffc9c9",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "seed": 603,
      "versionNonce": 603,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 3},
      "updated": 1760000000000
    },
    {
      "id": "L2t",
      "type": "text",
      "x": 55,
      "y": 135,
      "width": 310,
      "height": 30,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "seed": 604,
      "versionNonce": 604,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "updated": 1760000000000,
      "text": "2. One token = org OWNER\\nbranch protection overridden (10:08)",
      "fontSize": 14,
      "fontFamily": 2,
      "textAlign": "left",
      "verticalAlign": "top",
      "baseline": 36,
      "containerId": null,
      "originalText": "2. One token = org OWNER\\nbranch protection overridden (10:08)",
      "lineHeight": 1.25
    },
    {
      "id": "L3",
      "type": "rectangle",
      "x": 40,
      "y": 200,
      "width": 340,
      "height": 70,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#ffec99",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "seed": 605,
      "versionNonce": 605,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 3},
      "updated": 1760000000000
    },
    {
      "id": "L3t",
      "type": "text",
      "x": 55,
      "y": 215,
      "width": 310,
      "height": 40,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "seed": 606,
      "versionNonce": 606,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "updated": 1760000000000,
      "text": "3. Release workflow pointed at\\nlookalike repo Berri-AI/litellm\\nsecond dev's creds passed review",
      "fontSize": 14,
      "fontFamily": 2,
      "textAlign": "left",
      "verticalAlign": "top",
      "baseline": 36,
      "containerId": null,
      "originalText": "3. Release workflow pointed at\\nlookalike repo Berri-AI/litellm\\nsecond dev's creds passed review",
      "lineHeight": 1.25
    },
    {
      "id": "L4",
      "type": "rectangle",
      "x": 40,
      "y": 290,
      "width": 340,
      "height": 60,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#ffec99",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "seed": 607,
      "versionNonce": 607,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 3},
      "updated": 1760000000000
    },
    {
      "id": "L4t",
      "type": "text",
      "x": 55,
      "y": 305,
      "width": 310,
      "height": 30,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "seed": 608,
      "versionNonce": 608,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "updated": 1760000000000,
      "text": "4. Official pipeline builds, signs,\\npublishes 7 wheels + sdist + Docker",
      "fontSize": 14,
      "fontFamily": 2,
      "textAlign": "left",
      "verticalAlign": "top",
      "baseline": 36,
      "containerId": null,
      "originalText": "4. Official pipeline builds, signs,\\npublishes 7 wheels + sdist + Docker",
      "lineHeight": 1.25
    },
    {
      "id": "L5",
      "type": "rectangle",
      "x": 480,
      "y": 120,
      "width": 340,
      "height": 70,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#a5d8ff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "seed": 609,
      "versionNonce": 609,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 3},
      "updated": 1760000000000
    },
    {
      "id": "L5t",
      "type": "text",
      "x": 495,
      "y": 135,
      "width": 310,
      "height": 40,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "seed": 610,
      "versionNonce": 610,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "updated": 1760000000000,
      "text": "pip install litellm==1.107.0\\n→ site-packages gets cook.pth,\\ncook.py, sitecustomize.py",
      "fontSize": 14,
      "fontFamily": 2,
      "textAlign": "left",
      "verticalAlign": "top",
      "baseline": 36,
      "containerId": null,
      "originalText": "pip install litellm==1.107.0\\n→ site-packages gets cook.pth,\\ncook.py, sitecustomize.py",
      "lineHeight": 1.25
    },
    {
      "id": "L6",
      "type": "rectangle",
      "x": 480,
      "y": 220,
      "width": 340,
      "height": 70,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#d3f9d8",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "seed": 611,
      "versionNonce": 611,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 3},
      "updated": 1760000000000
    },
    {
      "id": "L6t",
      "type": "text",
      "x": 495,
      "y": 235,
      "width": 310,
      "height": 40,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "seed": 612,
      "versionNonce": 612,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "updated": 1760000000000,
      "text": "Stealer fires once (AES+RSA exfil\\nto litellm[.]dev) + daemon checks\\nGitHub domain.txt hourly → /codepy",
      "fontSize": 14,
      "fontFamily": 2,
      "textAlign": "left",
      "verticalAlign": "top",
      "baseline": 36,
      "containerId": null,
      "originalText": "Stealer fires once (AES+RSA exfil\\nto litellm[.]dev) + daemon checks\\nGitHub domain.txt hourly → /codepy",
      "lineHeight": 1.25
    },
    {
      "id": "La1",
      "type": "arrow",
      "x": 210,
      "y": 100,
      "width": 0,
      "height": 20,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "seed": 613,
      "versionNonce": 613,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 2},
      "updated": 1760000000000,
      "points": [[0, 0], [0, 20]],
      "lastCommittedPoint": null,
      "startBinding": null,
      "endBinding": null,
      "startArrowhead": null,
      "endArrowhead": "arrow"
    },
    {
      "id": "La2",
      "type": "arrow",
      "x": 210,
      "y": 180,
      "width": 0,
      "height": 20,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "seed": 614,
      "versionNonce": 614,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 2},
      "updated": 1760000000000,
      "points": [[0, 0], [0, 20]],
      "lastCommittedPoint": null,
      "startBinding": null,
      "endBinding": null,
      "startArrowhead": null,
      "endArrowhead": "arrow"
    },
    {
      "id": "La3",
      "type": "arrow",
      "x": 210,
      "y": 270,
      "width": 0,
      "height": 20,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "seed": 615,
      "versionNonce": 615,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 2},
      "updated": 1760000000000,
      "points": [[0, 0], [0, 20]],
      "lastCommittedPoint": null,
      "startBinding": null,
      "endBinding": null,
      "startArrowhead": null,
      "endArrowhead": "arrow"
    },
    {
      "id": "La4",
      "type": "arrow",
      "x": 380,
      "y": 320,
      "width": 100,
      "height": -150,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "seed": 616,
      "versionNonce": 616,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 2},
      "updated": 1760000000000,
      "points": [[0, 0], [100, -150]],
      "lastCommittedPoint": null,
      "startBinding": null,
      "endBinding": null,
      "startArrowhead": null,
      "endArrowhead": "arrow"
    },
    {
      "id": "La5",
      "type": "arrow",
      "x": 650,
      "y": 190,
      "width": 0,
      "height": 30,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "seed": 617,
      "versionNonce": 617,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 2},
      "updated": 1760000000000,
      "points": [[0, 0], [0, 30]],
      "lastCommittedPoint": null,
      "startBinding": null,
      "endBinding": null,
      "startArrowhead": null,
      "endArrowhead": "arrow"
    }
  ],
  "appState": {
    "gridSize": null
  },
  "files": {}
}
```

## What was in the package

Three planted files, installed into `site-packages` next to the real litellm code:

| File | Size | Role |
|---|---|---|
| `cook.pth` | ~30 B | `import cook` — Python executes `.pth` files at interpreter startup, so the payload runs on *any* Python process in the environment, not just litellm |
| `cook.py` | 22,252 B | `exec(zlib.decompress(base64.b64decode(...)))` — the stealer, compressed + base64-encoded to defeat naive string scanning |
| `sitecustomize.py` | 25,509 B | Backdoor daemon installer (also auto-imported by the interpreter) |

The packaging trick: `pyproject.toml` gained a maturin `data="cook"` entry that copies the `cook/` folder into the wheel. Notably, **the sdist did not contain the `cook/` folder** — only the wheels and the prebuilt Docker images carried the payload, which is why JFrog's research flagged issue [#47826](https://github.com/BerriAI/litellm/issues/47826): the sdist is clean, the wheels are not.

## The stealer (fires once, on first install)

Configuration constants embedded in the decoded payload:

- **C2**: `http://www.litellm[.]dev/healthcheck`, every upload sent with header `X-Token: XWiA8gZNa7NcX2XRoAEb`
- **Once-per-host marker**: `/tmp/.pc_once_72129118c59f5636c0bb` — if present, the stealer skips (already exfiltrated)
- **Async**: a `PC_ASYNC` daemon thread so the install doesn't block
- **16 collector modules** (`PC_MODULES`) targeting credential and AI-tooling stores:

| Category | Examples |
|---|---|
| Cloud | AWS (`~/.aws/credentials`, IAM instance metadata `169.254.169.254`), GCP, Azure |
| Dev/CI | `~/.npmrc`, `~/.pypirc`, `~/.netrc`, `~/.git-credentials`, GitHub tokens |
| AI tooling | Claude Code config, Cursor, Windsurf, VS Code `mcp.json` (MCP server configs often embed API keys) |
| Secrets managers | 1Password CLI, `~/.secrets`, vault CLI config |

**Exfiltration mechanics**: random AES-256-CBC key encrypts a `tar.gz` (`hdr.json` + `data.bin`), the key is wrapped with the attacker's RSA-4096 public key (`key.bin`), and the three files are POSTed to the C2 with the static `X-Token` header. Static header + static C2 = two simple network signatures.

## The backdoor daemon (persistent C2)

`sitecustomize.py` installs a self-updating loop:

1. Takes an exclusive lock on `/tmp/remote_code_loader.lock` — one daemon per host.
2. `fork()` + `setsid()`, stdio to `/dev/null`, `chdir("/")` — detaches from the install process (parent PID becomes 1; a Python process with PPID 1 and cwd `/` is a strong host signature).
3. **Every hour**: reads `domain.txt` from the attacker's GitHub repo (`letters9813/pythonclient-test`), takes the first line that looks like a domain, runs its embedded stealer copy (this copy has *no* once-per-host marker), then downloads `http://<domain>/codepy` and executes it with `exec()`.

The attacker can re-point all infected hosts at a new C2 by editing one GitHub file — a remote-controlled second-stage pipeline. At **13:40 UTC** the GitHub account `letters9813` was deleted (404), so the daemon now finds no server address and does nothing; SafeDep could not recover the server address, so hosts that ran the daemon before deletion may have received and executed second-stage code.

## Timeline (UTC, 2026-10-21)

| Time | Event |
|---|---|
| 10:08 | Attacker overrides branch protection, modifies the release workflow |
| 10:46 | Staging run builds from lookalike `Berri-AI/litellm` |
| 11:39–11:40 | Seven malicious wheels uploaded to PyPI |
| 11:46 | Malicious Docker images published (Docker Hub + ghcr.io) |
| 13:23 | PyPI removes 1.107.0 |
| 13:40 | GitHub account `letters9813` returns 404 (SafeDep) |
| 14:20 | Docker Hub tags removed or repointed to clean images |

## Indicators of compromise

**Network**

| Indicator | Purpose |
|---|---|
| `www.litellm[.]dev`, `hxxp://www.litellm[.]dev/healthcheck` | Receives stolen data |
| HTTP header `X-Token: XWiA8gZNa7NcX2XRoAEb` | Sent with each upload |
| `raw.githubusercontent[.]com/letters9813/pythonclient-test/main/domain.txt` | Backdoor reads its server address here (account deleted) |
| `hxxp://<domain>/codepy` | Second-stage code download |
| Requests to `169.254.169.254` from Python processes | AWS instance credential theft |

**Host**

| Indicator | Meaning |
|---|---|
| `cook.pth`, `cook.py`, `sitecustomize.py` in `site-packages` | Implant installed |
| `/tmp/.pc_once_72129118c59f5636c0bb` | Stealer already uploaded data |
| `/tmp/remote_code_loader.lock` | Backdoor daemon has run |
| Env var `PRIVCOLLECT_ACTIVE=1` in a process | Present in infected processes |
| Detached Python daemon (PPID 1, own session, cwd `/`) | Backdoor loop |

**Container images** — tags `v1.107.0`, `latest`, `main-latest`, `main-stable` with image index digest `sha256:1bbcb1443bc962e45f5aad53fe3d2c30600e0379715fb6c664cdd3ac126c339e` on `berriai/litellm` (Docker Hub) and `ghcr.io/berriai/litellm`.

**Wheel file hashes (SHA-256)** — `litellm-1.107.0.tar.gz` `2befe2a79fb4fbbd9a543b5b40b530c8cffa8771bab22b8fb22b2e4ae3b1f819`; x86_64 manylinux `462d0c9f67ca522d9e0e4acd245e90b36ce0d5353604a66bb7c43a1ec4a6fcf7`; aarch64 manylinux `668169d35b87bf51324080390b1b1c5ab12bd335cfe5f1a99e3689abd5e02ae6`; musllinux x86_64 `1bbce8caa94f01c0aaa0b7ddae51553a8a32e1ce53d96d44fe583272aff7ad00`; musllinux aarch64 `c2e32d0ce2548aa662c18bf5001911a79fe5b30cf8357132275add02fdcde054`; macOS x86_64 `7598727f209d717041db37f7dca271d3a7d328a279890e0e1d55375729aeb86d`; macOS arm64 `0aaf7ba346d41ef2f40390436738b001180d5a1c03aa093f121078a9969d9a1a`; Windows `12d4ccc5c6f8d35cf4f2cf233b7f3e418e863e657d81ff5f5fc9e210005b9484`. The planted files hash differently on Windows (CRLF): `cook.pth` `7f191632e7320705d154b85204f1ae546b543acbd7e8861229b76f5042b92bdb` (Linux/macOS) vs `84dc8c82c0a4a4a62552ef826b49fcc86d1a5c4a5d0f2c06665723f93d129d7d` (Windows); `cook.py` `9dd0a3926f96a37eb86cf1ee2310d9be93139cc4ebef3ef9e2efe9531390be25` vs `03ac2a8b752605d1d7710979c17ff18b03dd978203ba23ba97fd8ce3d6f897ea`; `sitecustomize.py` `34bef04fe88ac9d0aae0475630b1738681d15b94f233ac8aa46eacf5968305fa` vs `b6122440d0d9cb1eb1ade9933f49214da8c31288de7710c076c2680dfa528465`.

## Remediation

- **Upgrade to `1.106.2` or `1.107.0rc1/rc2`** (or any version after the 14:20 Docker fix). Do not use 1.107.0.
- **Pinned companion packages**: if you pin litellm's transitive dependencies, re-verify their sources too — the attack chain shows a pinned-but-lookalike-repo failure mode.
- **Audit environments that installed 1.107.0** against the host IOCs above; treat any hit as compromised, not just "infected" — the second-stage payload is unknown.
- **Rotate every credential class in the `PC_MODULES` table** for affected hosts, prioritizing cloud IAM, GitHub, and npm/PyPI tokens.

## Lessons

1. **Leaked deployment logs are a credential vault.** GitHub CLI tokens in logs gave org-owner access with no phishing involved.
2. **Lookalike orgs + shared CI = silent supply chain.** The release workflow was pointed at `Berri-AI/litellm` and the second developer's credentials were enough to pass review.
3. **`.pth` files are a universal Python persistence mechanism.** Any package can execute code at interpreter startup for the whole environment.
4. **sdist-clean, wheel-dirty defeats naive verification** — hash-compare the *installed* artifacts, not just the source.
5. **A deleted C2 account is not a safe state** — it's the attacker's kill-switch, and the second stage is unknowable.

## References

- [LiteLLM 1.107.0 PyPI Compromise — Credential Stealer and Self-Updating Backdoor (SafeDep, original source)](https://safedep.io/litellm-pypi-compromise-credential-stealer-backdoor/)
- [LiteLLM — Security Incident Report (Oct 21, 2026)](https://docs.litellm.ai/blog/security-incident-oct-21-2026)
- [BerriAI/litellm issue #47826 — investigation thread (JFrog)](https://github.com/BerriAI/litellm/issues/47826)
- [The Hacker News — coverage](https://thehackernews.com/)
- Related KB notes: [[Mini Shai-Hulud — The TanStack npm Worm That Spread Through a Dependabot Bump]] (poisoned-cache variant of the same pattern), [[How to Audit Transitive GitHub Action Dependencies with pin-deep]]
