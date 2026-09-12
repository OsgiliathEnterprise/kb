---
title: 'Secure Boot Certificate Expiration: The June 2026 Deadline for Windows and
  Linux'
diataxis: Explanation
domain: security-privacy
topic: boot-security
source: Wired Backchannel
source_url: https://www.wired.com/story/a-critical-deadline-is-approaching-for-windows-and-linux-security/
date: 2026-09-12
keywords:
- knowledge-base
- boot-security
- security-privacy
- explanations
---
# Secure Boot Certificate Expiration: The June 2026 Deadline for Windows and Linux

A security-deadline explainer: beginning **June 24, 2026**, the three 2011-era Microsoft certificates that cryptographically verify firmware and software loaded during system boot start expiring. These certificates are the linchpins of **Secure Boot**, the chain of trust that checks digital signatures of everything loaded at startup (UEFI firmware, bootloaders) to prevent **UEFI bootkits** — firmware malware that loads before the OS and before any antimalware protection exists.

## Why the keys exist

Secure Boot creates a chain of trust: each stage of boot verifies the signature of the next stage against trusted keys. If a link in the chain is unrecognized, the device refuses to start. Microsoft's design uses a small set of root/intermediate certificates (the **PKI**) whose fingerprints are embedded in UEFI firmware (the `db`/`KEK`/`UEFI CA`/`Windows Production PCA` keys).

## Why they are being replaced

In 2023, researchers disclosed **LogoFail** — a family of vulnerabilities in the UEFI image-parsing code that displays hardware manufacturers' logos at boot. The image-parsing bug allowed attackers to bypass Secure Boot and install malicious firmware on nearly every Windows and Linux system in the world. The discovery forced Microsoft to rotate the cryptographic signatures underpinning Secure Boot: the **2011-dated signatures are being removed and replaced by 2023-dated ones**.

## What expires, and when

| Certificate | Expiry |
| --- | --- |
| Microsoft Corporation KEK CA 2011 | **June 24, 2026** |
| Microsoft UEFI CA 2011 | **June 27, 2026** |
| Microsoft Windows Production PCA 2011 | **October 19, 2026** |

The last one signs the Windows bootloader itself, making **October 19 the most critical date** for long-term boot integrity.

## What happens to machines that miss the update

- The machine **does not stop booting** — it continues to start normally and keeps receiving standard OS updates.
- It **loses the ability to receive new Secure Boot database updates**, certificate revocation lists (CRLs), and patches for newly discovered boot-layer vulnerabilities.
- In practice: a device with expired certificates has **no patch path against future boot-level threats** — exactly the layer that exploits like the **BlackLotus** bootkit target.

## How the rollout works

**Windows**
- Microsoft began rolling out the 2023 replacement certificates through Windows Update in January 2026 and is advancing the rollout with each monthly update (e.g., KB5089549).
- Most Windows 10/11 machines update keys automatically during regular monthly patching; older machines may need manual attention.
- Check status: **Windows Security → Device Security → Secure Boot** — a green checkmark means the update completed.
- Microsoft's support article **KB5062710** documents what the expiration means and remediation steps if the update has not applied.
- Windows 10 machines **outside the Extended Security Updates program do not receive the new certificates** and have no remediation path after June 24.
- Some older hardware needs a matching **OEM firmware update** because the new certificate chain must be anchored in UEFI firmware; devices whose manufacturers stopped issuing firmware updates may stay on 2011 certificates regardless of what Windows installs.

**Linux**
- Linux distros distribute updates to the **"shim"** — the small first-stage UEFI bootloader that acts as the trusted bridge between the Secure Boot keys and the Linux bootloader (shim → GRUB → kernel).
- Linux users should **watch for new shim releases** from their distributor; until a distro ships one, systems remain on the expiring chain.

## Operational checklist

1. Apply the latest Windows monthly updates (verify KB5089549 or later installed).
2. Open Windows Security → Device Security → Secure Boot and confirm the 2023 certificate set is present (per KB5062710).
3. For fleet/enterprise: inventory machines still on the 2011 certificate set; prioritize October 19 as the hard deadline.
4. Contact OEM support for hardware that lacks the 2023 chain after a full update — a firmware update from the manufacturer is required.
5. For Linux: subscribe to your distro's security channel and update the shim package as soon as it ships; verify `mokutil --list-enrolled`-style tooling shows the new keys.
6. Unsupported Windows 10 installs: plan migration or accept the loss of boot-layer patching.

## References

- [A Critical Deadline Is Approaching for Windows and Linux Security — Wired](https://www.wired.com/story/a-critical-deadline-is-approaching-for-windows-and-linux-security/)
- [Windows Secure Boot certificates start expiring June 24 — NotebookCheck](https://www.notebookcheck.net/Windows-Secure-Boot-certificates-start-expiring-June-24.1304838.0.html)
