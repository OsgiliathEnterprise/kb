---
title: 'GreyNoise GT13: Check Point Security Management Server Intrusion Campaign
  (24 Servers, 22 Orgs)'
diataxis: Explanation
domain: security-privacy
topic: attack-lifecycle
source: HackerNews
source_url: https://www.greynoise.io/blog/check-point-security-management-servers-intrusion-campaign
date: 2026-11-24
keywords:
- knowledge-base
- attack-lifecycle
- security-privacy
- explanations
---
# GreyNoise GT13: Check Point Security Management Server Intrusion Campaign

On 2026-11-23 GreyNoise published a rare end-to-end tracking of an unknown actor: **GreyNoise Threat 13 (GT13)** compromised **24 Check Point Security Management Servers across at least 22 organizations** (UK, IE, FR, NL, GR, DE, AT, BG, PL, IN, TH, VN, KR, HK, CN, AU, US; sectors include finance, energy, government, transport, mining, manufacturing). Activity window: 2026-10-02 to 2026-11-02 UTC; access likely persists. The actor used **99 IPs** (ExpressVPN egresses + compromised Check Point devices), 1400+ network sessions, 800+ command-line artifacts, 1200+ files.

## Attack chain

```
Rejetto HFS (CVE-2026-61500, PRNG session forgery)
   -> admin cookie "allow_session_ip_change:true" -> SSH key in /root/.ssh/authorized_keys
   -> compromised HFS server becomes ORB/"hop" (unauthenticated HTTP exfil server + Chisel reverse proxy)
   -> exploit.py (CVE-2026-16232, Check Point SmartConsole auth bypass -> Run Script)
   -> 100+ mgmt tasks on Check Point SMS: copy firewall DB + Internal CA, mint pivot.p12, UNLOAD security policies
   -> probe Citrix / Ivanti / vCenter / Exchange / domain controllers over Chisel tunnel
   -> bulk cert-minting task to all 24 servers, results scp'd to hop's /root/exfil/
```

### The HFS entry bug (CVE-2026-61500) — a predictable-PRNG lesson
Each POST to HFS's `loginSrp1` endpoint returns a signed session cookie whose `sid` comes from **JavaScript `Math.random()`**. The actor did several consecutive logins, collected outputs, **reconstructed V8's PRNG internal state, recovered the cookie signing key, and forged a signed admin session cookie** — logging in as admin with no password. The forged cookie included `allow_session_ip_change:true`, so it worked from any IP (handy behind VPN egresses). Days later, middleware hooks were installed via HFS `server_code`, and an SSH key was appended to `/root/.ssh/authorized_keys`.

### The Check Point flaw (CVE-2026-16232)
Advisory published **2026-07-22**: authentication bypass in the SmartConsole login process affecting **Security Management Server and Multi-Domain Server (MDS)** — an unauthenticated remote attacker obtains an application login token and authenticates **with full administrative privileges**. Public exploit chain (Metasploit module exists): forge an application certificate bind → mint and redeem an SSO ticket → submit a `run-script` command executing attacker payload. GT13 used a script adapted from that Metasploit module as its command channel into victim SMS hosts.

### CVEs observed in this campaign
| CVE | Product | Role |
| --- | --- | --- |
| CVE-2026-61500 | Rejetto HFS | Initial access (PRNG cookie forgery) |
| CVE-2026-16232 | Check Point SmartConsole | Auth bypass → Run Script RCE on SMS |
| CVE-2026-98432 | Linux IPv4 | UAF; actor self-checked then patched its own hop with `nftables` rules dropping IPv4 packets with IP options |
| CVE-2026-41089 / CVE-2020-1472 | Windows Netlogon | Privilege escalation attempts (DcShadow/Zerologon family) |
| CVE-2025-5777 / CVE-2023-4966 | Citrix NetScaler | Lateral probing |
| CVE-2024-21893 | Ivanti Connect Secure | Lateral probing |
| CVE-2021-26855 / 34473 | Microsoft Exchange | Lateral probing |
| CVE-2021-21972 / CVE-2023-34048 | VMware vCenter | Lateral probing |

## Tradecraft worth studying

- **Operational Relay Box (ORB):** a compromised HFS server hosted an unauthenticated HTTP server (`/root/exfil/srv_post2_*.py`) plus a **Chisel** reverse-proxy server; victim devices shipped data *to* the hop via scp. Tooling: Nmap, Chisel, Impacket, Paramiko, and **~30 Python scripts** (exploit launchers, `spray_portal.py` with victim-themed weak passwords, `ssh_spray.py`, `comb.py`).
- **Data theft from the firewall management plane:** firewall database copies, **Internal CA files**, a minted certificate (`pivot.p12`), and **unloaded security policies** — i.e., the actor could silently disable firewalls org-wide.
- **Access protection:** when *other* actors started scanning the hop, GT13 ran a `cve_2026_98432.py` self-check and immediately applied nftables drop rules — attackers now patch their own footholds against rivals.
- **AI-enabled offense:** GreyNoise assesses separate agentic harnesses for vuln scanning, exploitation, and tool development; odd timeline gaps (e.g., SSH access unused for two weeks) are attributed to agentic pipeline quirks. Quiet hours ~17:00–00:19 UTC suggest a UTC+7/+8 workday; the `newpayapp.com` domain (registered 2026-03-13, registrant state "Hai Phong", VN) predates observed activity.

## IOCs and hunting leads

| Value | Type | Context |
| --- | --- | --- |
| `newpayapp.com` | Domain | GT13-controlled |
| `data-zt.newpayapp.com` | Domain | "ZULT" Linux implant download |
| `api-zt.newpayapp.com` | Domain | GT13 subdomain |
| `/root/exfil/` | Path | Staging dir on hop |
| `/usr/lib/.libproc.so` in `/etc/ld.so.preload` | Persistence | Preload implant indicator seen in cert-task error output |
| `pivot.p12` | Artifact | Minted pivot certificate |
| Chisel server/client binaries | Tooling | Tunnel to hop |

**Defender checklist:** (1) patch SmartConsole/MDS against CVE-2026-16232 (July 2026 advisory) and verify no unauthorized management tasks, certificate minting, or policy unload events since October 2026; (2) audit `authorized_keys` and `/etc/ld.so.preload` on any internet-facing HFS/management hosts; (3) hunt Chisel and unauthenticated local HTTP servers; (4) treat a Check Point SMS as a crown-jewel asset — segment and vault its management access.

## References

- [GreyNoise: An Active Intrusion Campaign Against Check Point Security Management Servers](https://www.greynoise.io/blog/check-point-security-management-servers-intrusion-campaign) (2026-11-23)
- [GreyNoise GT13 CVE page: CVE-2026-16232](https://viz.greynoise.io/cves/CVE-2026-16232)
- Related KB note: [JetBrains/Cadence CI-CD Compromise Response](../../../how-to/cloudinfrastructure/incidentresponse/howto-cicd-compromise-response-jetbrains-cadence.md)
