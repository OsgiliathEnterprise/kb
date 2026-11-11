---
title: 'Auditing AppArmor Unix Socket Rules: Both Sides of the Conversation'
diataxis: How-to Guide
domain: security-privacy
topic: configuration-auditing
source: DEV.to Tech News
source_url: https://dev.to/stark_zhuang_df5076f35c68/apparmor-unix-socket-rules-need-both-sides-46d4
date: 2026-11-11
keywords:
- knowledge-base
- configuration-auditing
- security-privacy
- how-to
---
# Auditing AppArmor Unix Socket Rules: Both Sides of the Conversation

Unix domain sockets are the default control channel for local services — they bypass network inspection, lean on filesystem permissions, and abstract-namespace sockets don't even appear as files. AppArmor mediates them with fine-grained rules, but **a profile that allows only one side of a conversation is not a complete policy**. This note turns the `apparmor.d(5)` mediation model into an audit procedure.

## Why one-sided rules fail

AppArmor unix rules match on three independent signals:

1. **Socket type/address** — filesystem path (`/run/myservice/*.sock`), abstract name (`@myapp*` — abstract addresses start with `@` and have no directory entry), or anonymous sockets.
2. **Peer label** — the AppArmor label of the other process. The address alone never proves the peer is trusted.
3. **Operation** — `create, bind, listen, connect, accept, send, receive, getattr, setattr, shutdown`.

Per the man page, rules are **union-accumulated** and become more restrictive only as you add address + label detail; an unspecified address component matches autobind, abstract *and* anonymous sockets. Two classic traps:

- A compromised client allowed to `connect` anywhere can reach a more privileged service's `listen` path if the server side accepts from any peer.
- Path wildcards behave like file-path patterns: `*` does **not** cross `/`, so a pattern copied from a filesystem path into an abstract-socket rule silently stops matching (abstract names have their own representation).

## The audit procedure

### Step 1 — Inventory local control channels

For every unix socket on the host record: socket path or abstract name · listener process and its profile · expected client processes and labels · operations each client needs · credentials (UID/GID/pid) passed over the socket · filesystem permissions and mount views.

### Step 2 — Require rules on both ends

Server profile must constrain **accept by peer label**; client profile must constrain **connect by address and peer label**:

```text
# server (/etc/apparmor.d/usr.lib.myservice)
unix (bind, listen, accept) addr="/run/myservice/control.sock",
unix (receive, send) peer=(label=/usr/bin/myclient),

# client (/etc/apparmor.d/usr.bin.myclient)
unix (connect, send, receive)
     addr="/run/myservice/control.sock" peer=(label=usr.lib.myservice),
```

Remove broad rules that let any peer reach a privileged operation. If a service has multiple client classes, separate the privileged endpoint from the management endpoint, or enforce application-level authorization — **AppArmor constrains who may talk; the server still validates what is said**.

### Step 3 — Test with real peer labels

Connecting as root to a socket owned by root does not exercise the policy if both processes share one label (same-label connections are often permitted implicitly). Run the client **under its own profile**, attempt the connection, and capture `audit.log` denials. Review server accept-path and client connect-path tests independently. Also exercise helpers and short-lived processes that **inherit the client label**.

### Step 4 — Verify the failure mode, not just the block

Mediation **fails closed on memory-allocation failure** — correct as a default, but during a resource spike a service may see `ENOMEM` or an ambiguous "connection denied". Confirm logs name the profile and the denying rule **without dumping message payloads or credentials**.

### Step 5 — Gate deployments on runtime policy checks

A profile that *loaded* is not a profile that is *enforcing*:

```bash
aa-status --json | jq .          # which profile confines which process
cat /sys/module/apparmor/parameters/enabled
apparmor_parser -Q <profile>     # check the loaded policy matches the file
auditlog -f /var/log/audit/audit.log | grep DENIED
```

Record the test result together with the service version and host image.

## Where the profile ends

Unix socket mediation does **not** protect data after a trusted process receives it, does not replace filesystem permissions, service authentication, or least-privilege process identities. The achievable goal: make the local conversation explicit — *this* client label may connect to *this* address, *this* server may accept from *that* label, and no unrelated process may inherit the path. Small boundary; it is often the one separating an exposed management plane from the rest of the host.

## Cross-links

- `cloud-infrastructure/docker/howto-harden-containers-with-seccomp-and-lsm-security-options.md` — AppArmor in the container-LSM context
- `security-privacy/file-permissions/howto-linux-acl-setfacl-getfacl-grant-revoke.md` — the filesystem layer socket paths still depend on
- `security-privacy/configuration-auditing/howto-config-baseline-lightweight-hids-cron.md` — scheduled re-validation pattern for policy drift

## References

- DEV.to: *AppArmor Unix Socket Rules Need Both Sides* — [dev.to/stark_zhuang_df5076f35c68/apparmor-unix-socket-rules-need-both-sides-46d4](https://dev.to/stark_zhuang_df5076f35c68/apparmor-unix-socket-rules-need-both-sides-46d4)
- `apparmor.d(5)` Unix socket rules (man page 4.0/5.0): [apparmor.net/man/5.0/apparmor.d/](https://apparmor.net/man/5.0/apparmor.d/)
- AppArmor documentation: [apparmor.net](https://www.apparmor.net/)
- Regression-test notes for socket mediation: [gitlab.com/apparmor/apparmor tests/regression/apparmor/README.md](https://gitlab.com/apparmor/apparmor/-/blob/master/tests/regression/apparmor/README.md)
- Historical caveat — coarse network rules did not restrict AF_UNIX in older kernels: [ruderich.org note on AppArmor and UNIX sockets](https://ruderich.org/simon/notes/apparmor-does-not-restrict-unix-sockets-in-regular-kernels)
