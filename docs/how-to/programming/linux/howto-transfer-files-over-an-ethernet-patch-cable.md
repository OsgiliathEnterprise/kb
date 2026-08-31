---
title: Transfer Files Over an Ethernet Patch Cable (Point-to-Point IPv6 + socat)
diataxis: How-to Guide
domain: programming
topic: linux
source: HackerNews
source_url: https://maurycyz.com/misc/etherfiles/
date: 2026-08-31
keywords:
- knowledge-base
- linux
- programming
- how-to
---
# Transfer Files Over an Ethernet Patch Cable (etherfiles)

A dead-simple way to move large files between two machines a few meters apart: connect them with an ordinary Ethernet patch cable and do a bit of IP configuration. No switch, no router, no cloud, no USB cable — just point-to-point wiring. A nothing-special patch cable reliably hits **~900 Mbit/s (~6.7 GB/min)**, far faster than USB flash or cloud storage for multi-GB transfers.

## Setup (Linux)

```bash
# On sender...
ip address add dev eth0 fd42:dead:beef::1/48
ip link set dev eth0 up

# On receiver...
ip address add dev eth0 fd42:dead:beef::2/48
ip link set dev eth0 up
```

After a few seconds, pings work:

```bash
# On receiver...
ping fd42:dead:beef::1
64 bytes from fd42:dead:beef::1: icmp_seq=1 ttl=64 time=0.649 ms
```

## Transfer with socat

```bash
# Receiver (listen)...
socat - TCP6-LISTEN:1234 | dd status=progress > big_file.tar.gz

# Sender (push)...
socat - 'TCP6-CONNECT:[fd42:dead:beef::2]:1234' < big_file.tar.gz
```

The commands assume Linux, but the underlying trick works everywhere. A ready-made `ethtransfer.sh` script wraps this for file copies.

## Why Ethernet specifically (vs. alternatives)

```excalidraw
{"type": "drawing", "version": 2, "source": "https://github.com/excalidraw/excalidraw", "elements": [{"id": "s1", "type": "rectangle", "x": 60, "y": 200, "width": 220, "height": 90, "strokeColor": "#1e1e1e", "backgroundColor": "#a5d8ff", "fillStyle": "solid", "strokeWidth": 2, "text": {"content": "SENDER\nip addr add fd42:dead:beef::1/48 dev eth0\nsocat - 'TCP6-CONNECT:[...::2]:1234' < file", "fontSize": 14, "fontFamily": 1}}, {"id": "cable", "type": "rectangle", "x": 340, "y": 215, "width": 160, "height": 60, "strokeColor": "#1e1e1e", "backgroundColor": "#fff3bf", "fillStyle": "solid", "strokeWidth": 2, "text": {"content": "plain Ethernet\npatch cable\n(~900 Mbit/s)", "fontSize": 14, "fontFamily": 1}}, {"id": "r1", "type": "rectangle", "x": 560, "y": 200, "width": 220, "height": 90, "strokeColor": "#1e1e1e", "backgroundColor": "#b2f2bb", "fillStyle": "solid", "strokeWidth": 2, "text": {"content": "RECEIVER\nip addr add fd42:dead:beef::2/48 dev eth0\nsocat - TCP6-LISTEN:1234 | dd > file", "fontSize": 14, "fontFamily": 1}}, [{"id": "a1", "type": "arrow", "x": 280, "y": 245, "width": 60, "height": 0, "strokeColor": "#1e1e1e", "backgroundColor": "transparent", "fillStyle": "solid", "strokeWidth": 2, "points": [[0, 0], [60, 0]]}, {"id": "a1_lbl", "type": "text", "x": 280, "y": 221, "width": 120, "height": 20, "text": {"content": "point-to-point IPv6"}, "fontSize": 13, "fontFamily": 1, "strokeColor": "#1e1e1e", "backgroundColor": "transparent"}]]}
```
- **Cloud storage:** glacially slow (slow uplink + provider throttling), transfers data twice, often costs money.
- **WiFi / LAN TCP:** multi-gigabit claims are dubious in practice — walls, interference, dropouts; rarely reached at home.
- **Removable/USB storage:** slow unless you spend a lot, and the *cable* is usually the bottleneck (only one cable+peripheral pair actually hit gigabit, at the right angle). Also copies data on/off the drive, halving effective speed. USB's host/device model makes direct device-to-device awkward — though Linux recently added `/dev/tbstreamX` for USB-C/Thunderbolt/USB4 devices.
- **Ethernet wins:** it's the only common connection that reliably reaches gigabit between two random devices with cheap cables. It's truly differential (transformers), so it resists RFI and ground-level shifts, works point-to-point without a local network, and doesn't even need TCP/IP — raw link-layer frames are fine on a switched LAN, which also makes it a clean way to move data to/from a microcontroller.

## When to use it

Any time you're moving >~10 GB between two machines that are physically close (same room / desk). It's underappreciated for non-internet applications and needs no network infrastructure at all.

## References

- [Transfer files over an Ethernet patch cable (maurycyz.com)](https://maurycyz.com/misc/etherfiles/)
- [ethtransfer.sh helper script](https://maurycyz.com/misc/etherfiles/ethtransfer.sh)
