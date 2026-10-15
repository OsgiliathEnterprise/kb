---
title: The Cluster Joined Fine — Its Heartbeat Was on the Wrong Network (Proxmox /
  corosync Near-Miss)
diataxis: Explanation
domain: cloud-infrastructure
topic: networking
source: DEV.to Tech News
source_url: https://dev.to/captkay/the-cluster-joined-fine-its-heartbeat-was-on-the-wrong-network-45hp
date: 2026-10-15
keywords:
- knowledge-base
- networking
- cloud-infrastructure
- explanations
---
# The Cluster Joined Fine — Its Heartbeat Was on the Wrong Network (Proxmox / corosync Near-Miss)

A Proxmox VE cluster can **join successfully while its heartbeat (corosync) traffic is pinned to the wrong network interface** — and keep looking perfectly healthy until the day that interface's path is the only one left between two nodes. This note explains why the failure is latent, how to tell which link is actually carrying quorum traffic, and why a cluster that "works" can still be one network change away from self-fencing.

## Why "it joined" is not the same as "it is wired right"

Proxmox cluster membership runs on **corosync**, which sends its heartbeat on a specific interface configured in `corosync.conf` — by default it picks an interface whose name or address matches its expectations (often the management/LAN interface). The join protocol completes as long as the two nodes can talk on that link at join time. Nothing afterwards re-verifies that the link is the one you *intended*:

- The management network and the "redundant" second network may both be reachable — so the cluster has no reason to complain.
- All the user-visible symptoms (VMs running, replication working, GUI responsive) flow over the interface you *meant* to use, masking the fact that quorum votes ride the other one.
- The misconfiguration only becomes an incident the day the shared path is tested: a switch upgrade, a VLAN change, a link flap, or a rack move. At that point the nodes stop seeing each other, lose quorum, and **self-fence** — the healthy side is not "fixed", it is the side that has to be re-joined.

The failure mode is therefore a **latent configuration debt**: the cluster is simultaneously functional and one network event away from a full outage.

## How to see which link is actually carrying the heartbeat

The diagnostic sequence that exposes the truth:

1. **Read the configured link** in `corosync.conf` (`--link0` / the `link0_addr` setting). This is the interface corosync *says* it uses.
2. **Verify the running state** with `pve corosync status` / `pcs status` — it shows the current link addresses per node. Compare with what you intended; a mismatch between intent and config is the whole story.
3. **Confirm the traffic itself**: watch the two candidate interfaces (e.g. `ethtool -s` counters or `tcpdump` for the corosync/multicast ports) while a membership event happens (reboot a node, or `pcs` quorum activity). The link whose counters move is the one doing the work.

A common concrete case: two nodes on a 10 GbE "data" network and a 1 GbE management network. corosync quietly rides the 1 GbE. Everything looks fine — until the 1 GbE switch is replaced and the cable is not re-plugged the same way.

## The fix, and why it is a configuration change, not a workaround

Pin the heartbeat explicitly to the intended link:

```bash
# In /etc/corosync/corosync.conf (and via the pve UI under Cluster → Settings):
totem {
    link0_addr: 10.10.0.0/24   # the interface you actually want
}
```

Then re-verify with the same three-step check, and **restart the cluster stack** so the new link takes effect. The change is small precisely because the problem was never a capacity issue — it was an *addressing* issue: quorum was being voted over a path you had classified as "management" in your head but that you had made single-homed.

## Why this matters for HA design

- **Quorum traffic is a first-class network dependency**, not an implementation detail. Design the link it rides with the same redundancy you would give storage replication.
- **Self-fencing is the safe default**: when the heartbeat path dies, Proxmox chooses to make the uncertain node unavailable rather than risk a split brain. That is correct — but it means a single point of failure on the *heartbeat path* is a single point of failure for the *whole cluster's liveness*.
- **Latent bugs are found by network changes, not by monitoring.** A dashboard that shows "cluster healthy" is reporting liveness, not correctness of the path. The audit question is: *which interface is voting, and what happens to that path?*
- **The generalisation beyond Proxmox**: any membership protocol (corosync, etcd, ZFS replication, Kubernetes node heartbeats) has a "which network does it actually use" question whose answer drifts from intent over time. Periodically diff *intended* path against *observed* traffic — the join succeeded, but that was only the first day.

## Key takeaways

- A successful join proves connectivity on **one** link, not that the right link is configured — verify `link0_addr` against intent, and verify the *traffic* against the config.
- Latent misconfiguration + single-homed heartbeat path = a future self-fencing incident; fix it while the cluster is calm, not during the switch upgrade.
- Treat quorum traffic as a designed network dependency: pin it explicitly, monitor the right counters, and audit the path before any network change.
- "Healthy" dashboards measure liveness, not path correctness.

## Related notes

- `cloud-infrastructure/incident-response/explanation-telstra-ntp-timing-loop-incident.md` — a latent timing loop that became an outage when it finally fired
- `cloud-infrastructure/networking/explanation-dns-over-tls-tls-1-3-protocol-analysis.md`
- `cloud-infrastructure/incident-response/howto-design-network-monitoring-with-sentinel.md`

## References

- [The cluster joined fine — its heartbeat was on the wrong network (DEV.to)](https://dev.to/captkay/the-cluster-joined-fine-its-heartbeat-was-on-the-wrong-network-45hp)
