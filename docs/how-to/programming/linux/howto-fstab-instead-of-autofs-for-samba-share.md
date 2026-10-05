---
title: How to Serve a Samba Share from an Encrypted Drive with fstab Instead of autofs
diataxis: How-to Guide
domain: programming
topic: linux
source: DEV.to Tech News
source_url: https://dev.to/jantolentino/using-fstab-instead-of-autofs-for-a-samba-share-18a0
date: 2026-09-27
keywords:
- knowledge-base
- linux
- programming
- how-to
---
# How to Serve a Samba Share from an Encrypted Drive with fstab Instead of autofs

A home NAS on a Raspberry Pi 4 (Fedora Server) serving an external BTRFS drive encrypted with a passphrase. The `autofs` + `crypttab` approach works until it doesn't: after weeks, Samba started failing with `make_connection_snum: canonicalize_connect_path failed for service SharedDrive`.

## Root cause: a race condition

The failure mode is a **race between Samba and autofs**. External drives unmount after inactivity (power saving), and the encrypted drive needs its passphrase to unlock again. `autofs` remounts on access — but Samba can try to resolve the share path *before* autofs finishes unlocking and mounting, so the path doesn't exist yet and the connection fails. The timing issue is inherent to lazy mounting: any service that probes paths at startup or under load can lose the race.

## Goal

Mount the encrypted drive deterministically **at boot**, well before Samba starts, eliminating the race entirely — while keeping the passphrase out of interactive prompts via `crypttab`.

## Steps

### 1. Remove the autofs configuration

```bash
sudo dnf remove autofs
sudo rm /etc/auto.jantolentino_Drive
```

(`crypttab` stays: it securely caches the LUKS passphrase so the drive can unlock unattended.)

### 2. Create a permanent mount point

```bash
sudo mkdir -p /mnt/jantolentino_Drive
```

### 3. Add the fstab entry

```fstab
# /etc/fstab
/dev/mapper/jantolentino_Drive /mnt/jantolentino_Drive btrfs defaults,nofail 0 2
```

The `nofail` option is important: it prevents the system from hanging during boot if the drive isn't connected. The LUKS mapper device (`/dev/mapper/<name>`) is what crypttab exposes once unlocked, so fstab mounts the *decrypted* volume directly.

### 4. Point Samba at the static mount point

```ini
[jantolentino_share]
  comment = SharedDrive
  path = /mnt/jantolentino_Drive
```

### 5. Reboot and verify

```bash
sudo systemctl status smb.service   # active, no canonicalize_connect_path errors in journalctl -u smb
```

## Middle ground: on-demand mounting without autofs

If you want lazy mounting (save resources when the drive is idle) but not the race condition, RHEL/Fedora offer `x-systemd.automount`: keep the fstab entry and let systemd mount it on first access via a generated `.automount` unit — no separate autofs service to configure:

```fstab
/dev/mapper/jantolentino_Drive /mnt/jantolentino_Drive btrfs defaults,nofail,x-systemd.automount 0 2
```

```bash
sudo systemctl daemon-reload
sudo systemctl start jantolentino_Drive.automount   # unit named after the mount point
```

This still mounts on first access, so a service that probes paths at startup can race it — for Samba specifically (which resolves share paths per connection), eager boot-time mounting remains the safer choice. The trade-off to weigh: `autofs`/systemd-automount conserve resources and bandwidth when many shares are rarely used; static fstab mounts keep every share resident regardless of use.

## Why this beats autofs here

| | autofs + crypttab | fstab + crypttab |
|---|---|---|
| Mount timing | Lazy, on first access (races with Samba) | Deterministic at boot, before Samba starts |
| Drive unmounted after idle | Remounts on next access (needs passphrase again) | Stays mounted; `nofail` covers the absent-drive case |
| Failure mode | Intermittent `canonicalize_connect_path failed` under load | Boot-time mount failure visible in journal, not silent at request time |

The general lesson: when a service needs a path to exist *reliably* (not just eventually), prefer eager boot-time mounting over lazy on-demand mounting — and use `nofail` so an absent optional device degrades gracefully instead of wedging the boot.

## References

- [Using fstab instead of autofs for a samba share (DEV.to)](https://dev.to/jantolentino/using-fstab-instead-of-autofs-for-a-samba-share-18a0)
- [man 5 fstab](https://www.kernel.org/doc/html/latest/admin-guide/files/fstab.html)
- [RHEL: Mounting file systems on demand (systemd.automount)](https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/10/html/managing_file_systems/mounting-file-systems-on-demand)
