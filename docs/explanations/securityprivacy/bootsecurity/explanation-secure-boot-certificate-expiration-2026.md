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

## Status as of September 2026

The first two deadlines have now passed: **KEK CA 2011 expired June 24** and **UEFI CA 2011 expired June 27**. The final one — **Windows Production PCA 2011, which signs the Windows bootloader itself — expires October 19, 2026**, making it the remaining hard deadline. Per Microsoft (KB5062710), devices that never received the 2023 replacement certificates still start and operate normally and keep receiving standard updates; what they lose is the ability to receive new early-boot protections — Windows Boot Manager updates, Secure Boot database updates, revocation lists, and mitigations for newly discovered boot-level vulnerabilities. Microsoft also notes this can affect scenarios that rely on Secure Boot trust, such as BitLocker hardening or third-party bootloaders. The practical action today is the same as before: verify your device has the 2023 certificate set (both DB **and** KEK must be updated) and prioritize any machine still on the 2011 chain ahead of October 19.

## Why the keys exist

Secure Boot creates a chain of trust: each stage of boot verifies the signature of the next stage against trusted keys. If a link in the chain is unrecognized, the device refuses to start. Microsoft's design uses a small set of root/intermediate certificates (the **PKI**) whose fingerprints are embedded in UEFI firmware (the `db`/`KEK`/`UEFI CA`/`Windows Production PCA` keys).

## Why they are being replaced

In 2023, researchers disclosed **LogoFail** — a family of vulnerabilities in the UEFI image-parsing code that displays hardware manufacturers' logos at boot. The image-parsing bug allowed attackers to bypass Secure Boot and install malicious firmware on nearly every Windows and Linux system in the world. The discovery forced Microsoft to rotate the cryptographic signatures underpinning Secure Boot: the **2011-dated signatures are being removed and replaced by 2023-dated ones**.

## What expires, and when

| Expiring Certificate | Expiry | Replacement (2023) | Stored in | Purpose |
| --- | --- | --- | --- | --- |
| Microsoft Corporation KEK CA 2011 | **June 24, 2026** *(expired)* | Microsoft Corporation KEK 2K CA 2023 | KEK | Signs updates to DB and DBX |
| Microsoft UEFI CA 2011 | **June 27, 2026** *(expired)* | Microsoft UEFI CA 2023 | DB | Signs third-party boot loaders and EFI applications |
| Microsoft UEFI CA 2011 | **June 27, 2026** *(expired)* | Microsoft Option ROM UEFI CA 2023 | DB | Signs third-party option ROMs |
| Microsoft Windows Production PCA 2011 | **October 19, 2026** | Windows UEFI CA 2023 | DB | Signs the Windows boot loader |

Note: during renewal of the UEFI CA 2011 certificate, Microsoft split it into two — one for boot-loader signing and one for option-ROM signing — so systems can trust option ROMs without trusting third-party boot loaders. The last expiring row signs the Windows bootloader itself, making **October 19 the most critical date** for long-term boot integrity.

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
- **Red Hat's approach (verified Sept 2026):** new shims signed by *both* the 2011 and 2023 keys shipped starting with RHEL 9.8 and RHEL 10.2, and all supported RHEL 9/10 z-streams received the dual-signed shim; RHEL 8 streams got it in June 2026. As long as *either* Microsoft certificate is present in the firmware `db`, a dual-signed shim boots — so updating the shim alone does not break machines that haven't yet updated their firmware db.
- **After June 2026, new shims are signed only with the 2023 key.** A future CVE-fixed shim will therefore boot *only* if the system's firmware `db` contains the 2023 certificate. Red Hat ships a utility, **`sbchooser`** (part of the `efivar` package), which prevents installing an incompatible (2023-only) shim on a machine whose db lacks the 2023 cert.
- **Do not remove or revoke the 2011 certificate after updating to 2023.** The dual-signed shim won't boot if either signing key is revoked into `dbx`, and option ROMs still signed with the 2011 key would stop executing — breaking associated hardware. Hardware manufacturers have no plans to remove/revoke the 2011 cert in the near term for this reason.
- **RHEL 7.9** (the first RHEL with Secure Boot) never receives a dual-signed shim; any future CVE fix there will be 2023-key-only and bootable only on firmware that has the 2023 cert enrolled.
- Practical steps: update your firmware db if an OEM/fwupd update is available (`fwupd` works for bare-metal RHEL systems), then update the shim package; verify which keys a given shim is signed with via `sudo pesign -S -i /boot/efi/EFI/redhat/shimx64.efi`.

## Operational checklist (post-June 2026)

1. **Verify, don't just apply** — open Windows Security → Device Security → Secure Boot and confirm the 2023 certificate set is present in both DB and KEK (per KB5062710). The June deadlines have passed; this is now a verification step, not a pre-deadline precaution.
2. **Fleet/enterprise:** inventory machines still on the 2011 certificate set — these are your exposure window until October 19. Prioritize them for the remaining Windows Production PCA 2011 expiry.
3. Contact OEM support for hardware that lacks the 2023 chain after a full update — a firmware update from the manufacturer is required (the new chain must be anchored in UEFI firmware).
4. For Linux: confirm your distro's shim is dual-signed or 2023-key-signed, and that the firmware `db` contains the 2023 certificate; use `pesign -S -i <shim>` to check signing keys and `sbchooser` (RHEL) before installing a new shim.
5. **Do not revoke/remove the 2011 certificates** from `dbx`/firmware — dual-signed shims and option ROMs still depend on them.
6. Unsupported Windows 10 installs: plan migration or accept that they will lose boot-layer patching entirely after October 19.

## References

- [A Critical Deadline Is Approaching for Windows and Linux Security — Wired](https://www.wired.com/story/a-critical-deadline-is-approaching-for-windows-and-linux-security/)
- [Windows Secure Boot certificates start expiring June 24 — NotebookCheck](https://www.notebookcheck.net/Windows-Secure-Boot-certificates-start-expiring-June-24.1304838.0.html)
- [Windows Secure Boot certificate expiration and CA updates (KB5062710) — Microsoft Support](https://support.microsoft.com/en-us/topic/windows-secure-boot-certificate-expiration-and-ca-updates-7ff40d33-95dc-4c3c-8725-a9b95457578e)
- [Expiration of Secure Boot signing certificates in 2026 — Red Hat](https://www.redhat.com/en/blog/expiration-secure-boot-signing-certificates-2026)
