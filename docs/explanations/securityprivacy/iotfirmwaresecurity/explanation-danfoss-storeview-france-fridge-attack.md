---
title: 'France Supermarket Fridge Attack: Danfoss StoreView Dashboards Exposed to
  the Internet for Months'
diataxis: Explanation
domain: security-privacy
topic: iot-firmware-security
source: ipinfo.io
source_url: https://ipinfo.io/blog/france-fridges-hack
date: 2026-10-20
keywords:
- knowledge-base
- iot-firmware-security
- security-privacy
- explanations
---
# France Supermarket Fridge Attack: Danfoss StoreView Dashboards Exposed to the Internet for Months

On the night of **October 11–12, 2026**, fridges and freezers in **hundreds of French supermarkets** started
warming up: attackers pushed the refrigeration systems into **defrost mode** (which *heats* the cooling parts to
melt ice). Some units reached 50°C (122°F), some equipment caught fire, and stores threw away fresh and frozen
food. Reports pointed to **Danfoss** refrigeration controllers (the Danish industrial company); more than 400
stores were hit (Carrefour: 80; Intermarché/Netto under Les Mousquetaires: 300+; Monoprix: ~5% of stores;
Leclerc and Coopérative U also confirmed). Losses could reach several million euros.

**CERT-FR alert [CERTFR-2026-ALE-012](https://cert.cyber.gouv.fr/alerte/CERTFR-2026-ALE-012/)**: numerous
compromises of **AK-SM** and **AK-SC** controllers; updated Oct 13 to also name **XWEB supervisors** from
**Copeland/Dixell**. Advice: disconnect the controllers or restrict who can reach them; check insurance terms
before cutting the data controllers send to refrigeration contractors; update firmware, set security level to
**Strict**, change default passwords. Attack campaigns were probably still ongoing as of the alert.

## IPinfo's Internet-scan findings (João Tomé)

IPinfo ran weekly IPv4 scans (18 scans, Mar 30 – Oct 7, 2026, plus Oct 14) connecting to usual web ports and
recording what answers. Five days before the attack (Oct 6–7 sweep), **2,528 addresses** showed a **Danfoss
StoreView dashboard** — the web page stores/technicians use to manage the controllers, open to anyone who typed
the address.

- **France had more exposed fridge dashboards than the rest of the world combined**: 1,331 of 2,528 (53%),
  vs 1,197 across the other 72 countries/territories. Next: Poland (179), US (101), Portugal (92), Belgium (85).
- **85% ran software with known security flaws** (1,136 of 1,331): 527 older controllers Danfoss no longer
  supports, 280 missing the 2023 fixes, 329 missing the 2025 fixes. Only 195 had every known fix. (Elsewhere the
  flawed share was 84% — France didn't patch worse, it just had far more of these systems online.)
- **Most had been exposed for at least six months**: 1,019 of the 1,331 French dashboards were open at the same
  address on March 30. The fully-updated share rose only from 14% to 24% over those months (under two points a
  month).
- **98% were on telecom providers' networks** (not data centers/clouds) — controllers plugged into the store's own
  Internet connection, with access opened for a technician or head office.
- **After the attack**: only 316 of the 1,331 were still online Oct 14 (a 76% drop, vs a normal weekly churn of
  3–7%); Censys saw a similar 71% drop. Unplugged rather than patched: unsupported controllers fell 527 → 64,
  fully-updated 195 → 54.

## The two generations of controller

- **Older (Flash-based) dashboard — AK-SM 800**: Danfoss declared it **end of life in 2023**; that same year
  **Synacktiv published a login bypass** for the AK-SM 800 / AK-SC 255/355 family (a way in without the
  password), with Danfoss's advice to restrict network access.
- **Newer — AK-SM 800A**: the dashboard shows its firmware build date. 242 dashboards showed **May 19, 2023**
  (firmware 3.3 build date). Firmware older than 3.3 misses three 2023 fixes, including the critical
  [CVE-2023-25915](https://nvd.nist.gov/vuln/detail/CVE-2023-25915); older than 4.2 also miss the
  [2025 login bypass (ICS Advisory ICSA-25-140-03)](https://www.cisa.gov/news-events/ics-advisories/icsa-25-140-03);
  older than 4.3.1 miss two more 2025 fixes.

## Dixell/Copeland XWEB

The same scan found **1,611 XWEB dashboards in 66 countries** — only 70 in France; Italy (where Dixell is based)
had 467. Judging by build dates, only 180 of 752 newer **XWEB PRO** units had the February 2026 fixes
([ICSA-26-057-10](https://www.cisa.gov/news-events/ics-advisories/icsa-26-057-10)); the other 859 were older
models with no Copeland software update since **2018**. After the attack, French operators unplugged XWEB
dashboards too: 70 → 20 still online (71% drop) vs a normal 2–9% weekly churn; elsewhere the count fell only at
the usual rate.

## Method notes

Dashboards were identified with two fingerprints: the newer interface by page title; the older one by web server +
Flash loader page (AK-SM 800). 16 devices sharing the older web server but not being Danfoss (network cards in
backup power units, building controllers, thermostats) were removed, along with two addresses answering on almost
every port (honeypots). Independent count by Baptiste Robert: 2,752 Danfoss systems online, 1,590 in France.
Censys found 1,825 newer French dashboards on Oct 11 (61% of its worldwide total). Counts are IPv4-only minimums.

## What the data can and can't say

The scans can't say *how* attackers got in or who they were, and opening a dashboard from the Internet doesn't
prove anyone broke in through it. What they show: five days before the attack, France had more of these dashboards
open to anyone than the rest of the world combined, most behind on updates — and after the attack, most went
offline within days.

## Lessons for OT/ICS operators

- **Store-facing controllers should not be reachable from the public Internet.** Remote contractor access belongs
  behind a secure VPN; allowlisting contractor IPs is a stopgap, not a fix.
- **A factory reset alone isn't enough**: an exposed controller that no longer gets updates will likely be
  compromised again.
- **EOL hardware is the real risk**: the AK-SM 800 generation was already unsupported and had a published
  login bypass two years before the attack, yet ~527 of them sat open in France.
- **Defrost-mode abuse** is a reminder that "physical" effects (heat, fires, food loss) are now a realistic
  outcome of a software bug or breach in retail OT — the attack vector is boring (a web dashboard left open for a
  technician), the impact is physical.

## References

- [France's Supermarket Fridges Were Vulnerable Online for Months (IPinfo, João Tomé)](https://ipinfo.io/blog/france-fridges-hack)
- [CERT-FR alert CERTFR-2026-ALE-012](https://cert.cyber.gouv.fr/alerte/CERTFR-2026-ALE-012/)
- [CVE-2023-25915 (NVD)](https://nvd.nist.gov/vuln/detail/CVE-2023-25915)
- [ICS Advisory ICSA-25-140-03 (CISA)](https://www.cisa.gov/news-events/ics-advisories/icsa-25-140-03)
- [ICS Advisory ICSA-26-057-10 (XWEB PRO, CISA)](https://www.cisa.gov/news-events/ics-advisories/icsa-26-057-10)
- [Synacktiv: Danfoss SM800/SC255/SC355 auth bypass (2023)](https://www.synacktiv.com/sites/default/files/2023-10/synacktiv-danfoss-sm800-sc255-sc355-auth-bypass.pdf)
- [Claroty: Freeze the Controller, Defrost the Food (2025 vulnerabilities)](https://claroty.com/team82/research/freeze-the-controller-defrost-the-food-uncovering-vulnerabilities-in-danfoss-refrigeration-controllers)
- [Censys: Frostbitten in France](https://censys.com/blog/frostbitten-in-france-a-danfoss-storeview-internet-exposure-report/)
- [Danfoss security advisories](https://www.danfoss.com/en/service-and-support/coordinated-vulnerability-disclosure/danfoss-security-advisories/)
