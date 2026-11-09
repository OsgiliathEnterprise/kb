---
title: 'Coldframe: A One-File Honeypot Impersonating Danfoss AK-SM 800A and Dixell
  XWEB Refrigeration Controllers'
diataxis: Example
domain: security-privacy
topic: iot-firmware-security
source: HackerNews
source_url: https://github.com/hedgerow-dev/coldframe
date: 2026-11-08
keywords:
- knowledge-base
- iot-firmware-security
- security-privacy
- examples
---
# Coldframe: A One-File Honeypot Impersonating Danfoss AK-SM 800A and Dixell XWEB Refrigeration Controllers

`coldframe` (MIT, hedgerow-dev) is a **low-interaction honeypot for supermarket refrigeration controllers** — the exact class of devices attacked in the Oct 2026 France defrost-cycle incident (see [[France Supermarket Fridge Attack]]). It pretends to be a Danfoss AK-SM 800A or Copeland/Dixell XWEB supervisor, records who connects, which passwords they try, and which public exploits they fire, and gives them nothing real. **One Python file, zero non-stdlib dependencies.**

## What makes a convincing ICS decoy: fingerprint fidelity

The design lesson generalizes beyond fridges — match what internet scanners actually observe for real devices:

| Aspect | Danfoss persona | Dixell persona |
| --- | --- | --- |
| Identity | AK-SM 800A "Danfoss StoreView" | XWEB EVO supervisor |
| Web surface | nginx server header + header order, `Danfoss StoreView` page title, XML API at `/html/xml.cgi` and `/xml.cgi`, HTTP + HTTPS | No `Server` header, real XWEB security-header set/order, XWEB 500 CGI exploit paths, `/cgi-bin/login.lua` flow |
| TLS | **TLS 1.2 only**, 1-year cert `CN=DanfossSM800A` issued by `SelfSigned-DanfossSM800A`; fresh keys per build | HTTPS off by default |
| Bait credentials | `Supervisor`/`12345` and other weak logins **succeed** → session token + fake case dashboard with defrost buttons | Factory `Admin`/`Admin` succeeds; 5 failures in 5 min lock the user |
| Optional | Modbus TCP (off by default — real AK-SM only talks Modbus to its own case controllers) with fake temperatures/setpoints/defrost register | — |

Scanners identify devices by **favicon hash** and the shared Angular loader page hash; both are vendor artwork/firmware content, so the repo ships `FAVICON_FILE` and `INDEX_FILE` env hooks for private deployments to serve the real bytes (with matching `Last-Modified`/`ETag`).

## Exploit recognition

Matching requests get an `exploit` field in the JSONL log:

- **CVE-2023-25914** — AK-SM 800A path traversal via `get_file`
- **CVE-2023-25915** — AK-SM 800A command injection via `load_cert`
- **CVE-2025-41452** — AK-SM 800A nginx header overwrite via `load_nginx_headers`
- **CVE-2025-41450** — "code of the day" login bypass (`getauth` with `eds_only`/`quantum_only`), noting whether the attacker computed the correct code (a correct code = a targeted, informed attacker)
- **CVE-2021-45420** — XWEB 500 upload/command paths under `/cgi-bin/`
- **CVE-2026-25085** — XWEB Pro login bypass via unexpected `auth_mode`

## Run it

```bash
# Local trial — every request becomes a JSON line on stdout + events.jsonl
PERSONA=danfoss HTTP_PORT=8080 python3 -I honeypot.py

# Self-test (starts the honeypot on loopback and attacks it)
python3 -I test_honeypot.py

# Deployment: paste cloud-init.yaml into an Ubuntu 24.04 droplet's User data (~$4/mo),
# then read the log:
ssh root@<server> 'podman logs coldframe'
```

Container hardening worth copying for any public honeypot — **rootful** podman (rootless port forwarding rewrites the source address, making every attacker look like one internal IP):

```bash
echo "containers:2147483647:2147483648" | sudo tee -a /etc/subuid /etc/subgid
sudo podman run -d --name coldframe --restart=always \
  --read-only --cap-drop=ALL --security-opt no-new-privileges --userns=auto \
  --memory 128m --pids-limit 512 --log-opt max-size=10m \
  -p 80:8080 -p 443:8443 -v coldframe-logs:/logs:U \
  -e PERSONA=danfoss coldframe
```

On the host: expose only the ports the real persona would have, **egress-deny everything except DNS/updates** (a decoy never connects out), and never leave SSH open — a fridge controller with public SSH looks wrong.

## Log model

One JSON object per line: `request` (method/path/Host/UA/Authorization/body), `login_attempt` (+`granted`), `control` (post-login actions like defrost), `xml_cmd` (Danfoss XML API + `exploit` match), `tls_error`, and Modbus events (`connect`/`read`/`write`, defrost-register writes tagged `"defrost": true`). Summarize with:

```bash
python3 -I summary.py --hours 24 --ignore <your-own-ip> < events.jsonl
```

Safety posture: never executes commands/reads files/forwards traffic; payloads logged and dropped; caps on body size, fields, connections, per-source limits; slow-trickle connections cut at 30 s; log rotation; `summary.py` neutralizes attacker-supplied ANSI escapes. **Treat log fields as attacker-controlled input** when processing them.

## Known limitations (design honesty worth noting)

- Shallow interaction — logged-in attackers see a small dashboard, not the full StoreView app.
- **Public code is fingerprintable** — change persona strings, layout, and cert subject for serious deployments.
- Some real-device paths were reverse-guessed where firmware details aren't public.
- Cloud IPs themselves are a tell: some scanners deprioritize industrial devices on cloud hosting as likely honeypots.

Related: [eppser/danfoss-ak-sm-decoy](https://github.com/eppser/danfoss-ak-sm-decoy) — richer simulated store + SNMP/Service Tool listeners; coldframe differentiates on web-fingerprint fidelity + exploit tagging + Dixell support.

## References

- **coldframe repository (README, honeypot.py, cloud-init.yaml)**: https://github.com/hedgerow-dev/coldframe
- **France supermarket fridge attack (the incident it decoys)**: [explanation-danfoss-storeview-france-fridge-attack.md](../../../explanations/securityprivacy/iotfirmwaresecurity/explanation-danfoss-storeview-france-fridge-attack.md)
- **Wired: The Fridge-Hacking Spree Is an IoT Wake-Up Call**: https://www.wired.com/story/kernel-panic-refrigeration-hacks-internet-of-things/
