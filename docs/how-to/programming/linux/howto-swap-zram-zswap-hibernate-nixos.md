---
title: Swap, ZRAM, Zswap and Hibernate on NixOS — A Two-Line Final Config
diataxis: How-to Guide
domain: programming
topic: linux
source: HackerNews
source_url: https://blog.matthewbrunelle.com/swap-zram-zswap-and-hibernate-on-nixos/
date: 2026-09-24
keywords:
- knowledge-base
- linux
- programming
- how-to
---
# Swap, ZRAM, Zswap and Hibernate on NixOS — A Two-Line Final Config

Goal: a desktop/laptop that can **suspend-then-hibernate** (ACPI S3 first, then S4 after a delay) with swap configured correctly. The end state is deliberately tiny:

```nix
boot.zswap.enable = true;
boot.kernel.sysctl."vm.swappiness" = 100;
```

Everything below explains why that's the whole config and what went wrong before arriving at it.

## Why hibernate forces a swap decision

Hibernate (S4) saves system state to disk — which requires swap space. The author's target behavior is KDE's "Standby, then hibernate": S3 suspend-to-RAM for short absences, automatic S4 after a delay so forgetting to power off doesn't drain the battery. That requirement alone rules out "no swap" configurations on workstations (the server-vs-workstation conflation muddles most online advice).

## Swap file vs swap partition — the hibernate wrinkle

- **Swap files complicate hibernate**: at resume, `initramfs` must locate the swap space *before* filesystems are mounted. On UEFI systems the location is saved into an EFI variable when hibernation starts.
- Desktop setup (simple): a dedicated swap partition:

```nix
swapDevices = [
  {device = "/dev/disk/by-uuid/f2fc399a-9703-450b-88df-5671b776fc71";}
];
```

- Laptop setup (LUKS + btrfs subvolume swap file, based on the [disko luks-btrfs-subvolumes template](https://github.com/nix-community/disko/blob/master/example/luks-btrfs-subvolumes.nix)):

```nix
fileSystems."/.swapvol" = {
  device = "/dev/disk/by-uuid/33682d1d-87c4-4166-8d3b-66d900387e42";
  fsType = "btrfs";
  options = ["subvol=swap"];
};

swapDevices = [
  {
    device = "/.swapvol/swapfile";
    size = 32 * 1024;   # MiB
  }
];
```

NixOS now understands hibernate-on-swap-file nuances (offset computation) itself, so the file-based setup works despite the initramfs ordering problem.

## The zram vs zswap distinction (the mistake that took a year to catch)

| | zram (`zramSwap.enable`) | zswap (`boot.zswap.enable`) |
|---|---|---|
| What it is | A compressed RAM block device used **as** the swap area | A compressed cache **in front of** disk-backed swap |
| Relationship to disk swap | Replaces it | Requires a real disk swap behind it |
| Right choice here? | No — wrong for hibernate + disk swap | Yes |

The author ran `zramSwap.enable` for months believing it was the recommended setup; it is actually the opposite of what [Chris Down's "Debunking zswap and zram myths"](https://chrisdown.name/2026-03-24/zswap-vs-zram-when-to-use-what.html) recommends (zswap *with* disk-backed swap). The confusion was only resolved when `boot.zswap` landed in nixpkgs ([PR #470366](https://github.com/NixOS/nixpkgs/pull/470366), April 2026) — before that, the option simply didn't exist.

## Compressor choice: lz4 → zstd

- Kernel default: `lzo` (speed/compression balance).
- NixOS default: `zstd` (best compression ratio; also good for Nix builds).
- ArchWiki leans on `lz4` (fastest, lowest latency) — but when memory is spilling to disk, **compression speed is rarely the bottleneck**; a better ratio fits more pages in the compressed pool and touches disk less.

Final config after dropping now-default settings (`boot.initrd.systemd.enable = true` is default since 26.05):

```nix
boot.zswap = {
  enable = true;
  compressor = "zstd";   # NixOS default, shown for clarity
};
boot.kernel.sysctl."vm.swappiness" = 100;
```

## Swappiness: why 100

`vm.swappiness` sets the relative cost of swapping vs filesystem paging. Chris Down's recommendation: **100 works well on SSDs**; the [kernel docs](https://docs.kernel.org/admin-guide/sysctl/vm.html#swappiness) agree you can go even higher on SSDs. It is "non-trivial to tune this value based on instinct alone" — test different values for your hardware. Open question from the article: there are no clear instructions anywhere for systematically testing/comparing swappiness values under workstation usage.

## Diagram: memory pressure path with zswap + disk swap

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "zsw-title",
      "type": "text",
      "x": 40,
      "y": 20,
      "width": 760,
      "height": 25,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "strokeStyle": "solid",
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": 81234,
      "versionNonce": 92731,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1758000000000,
      "text": "NixOS memory pressure path: RAM -> zswap (zstd) -> disk swap -> hibernate",
      "fontSize": 16,
      "fontFamily": 2,
      "textAlign": "left",
      "verticalAlign": "top",
      "baseline": 25
    },
    {
      "id": "zsw-ram",
      "type": "rectangle",
      "x": 40,
      "y": 80,
      "width": 170,
      "height": 90,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#d3f261",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": { "type": 3 },
      "seed": 82345,
      "versionNonce": 93842,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1758000000000
    },
    {
      "id": "zsw-ram-t",
      "type": "text",
      "x": 52,
      "y": 96,
      "width": 146,
      "height": 58,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": 83456,
      "versionNonce": 94953,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1758000000000,
      "text": "RAM\nhot pages live here",
      "fontSize": 14,
      "fontFamily": 2,
      "textAlign": "left",
      "verticalAlign": "top",
      "baseline": 58
    },
    {
      "id": "zsw-zswap",
      "type": "rectangle",
      "x": 300,
      "y": 80,
      "width": 190,
      "height": 90,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#a5d8ff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": { "type": 3 },
      "seed": 84567,
      "versionNonce": 95064,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1758000000000
    },
    {
      "id": "zsw-zswap-t",
      "type": "text",
      "x": 312,
      "y": 96,
      "width": 166,
      "height": 58,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": 85678,
      "versionNonce": 96175,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1758000000000,
      "text": "zswap pool (RAM)\ncompressed with zstd\nboot.zswap.enable = true",
      "fontSize": 14,
      "fontFamily": 2,
      "textAlign": "left",
      "verticalAlign": "top",
      "baseline": 58
    },
    {
      "id": "zsw-disk",
      "type": "rectangle",
      "x": 580,
      "y": 80,
      "width": 210,
      "height": 90,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#ffec99",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": { "type": 3 },
      "seed": 86789,
      "versionNonce": 97286,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1758000000000
    },
    {
      "id": "zsw-disk-t",
      "type": "text",
      "x": 592,
      "y": 96,
      "width": 186,
      "height": 72,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": 87890,
      "versionNonce": 98397,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1758000000000,
      "text": "disk swap\npartition or btrfs subvol file\nS4 hibernate writes state here",
      "fontSize": 14,
      "fontFamily": 2,
      "textAlign": "left",
      "verticalAlign": "top",
      "baseline": 72
    },
    {
      "id": "zsw-a1",
      "type": "arrow",
      "x": 210,
      "y": 125,
      "width": 90,
      "height": 0,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": { "type": 2 },
      "seed": 88901,
      "versionNonce": 99408,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1758000000000,
      "points": [[0, 0], [90, 0]],
      "lastCommittedPoint": null,
      "startBinding": null,
      "endBinding": null,
      "startArrowhead": null,
      "endArrowhead": "arrow",
      "elbowed": false
    },
    {
      "id": "zsw-a2",
      "type": "arrow",
      "x": 490,
      "y": 125,
      "width": 90,
      "height": 0,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": { "type": 2 },
      "seed": 89012,
      "versionNonce": 100519,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1758000000000,
      "points": [[0, 0], [90, 0]],
      "lastCommittedPoint": null,
      "startBinding": null,
      "endBinding": null,
      "startArrowhead": null,
      "endArrowhead": "arrow",
      "elbowed": false
    },
    {
      "id": "zsw-note",
      "type": "text",
      "x": 40,
      "y": 200,
      "width": 750,
      "height": 68,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": 90123,
      "versionNonce": 101630,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1758000000000,
      "text": "vm.swappiness = 100 (SSD): kernel prefers swapping over filesystem paging\nNOT zramSwap.enable — that is a compressed RAM block device replacing disk swap,\nthe opposite of this design",
      "fontSize": 14,
      "fontFamily": 2,
      "textAlign": "left",
      "verticalAlign": "top",
      "baseline": 68
    }
  ]
}
```

## Checklist

- [ ] Decide swap backing: partition (simplest for hibernate) vs LUKS+btrfs subvolume file (NixOS handles offsets).
- [ ] Use `boot.zswap.enable = true` — **not** `zramSwap.enable`.
- [ ] Pick compressor: NixOS default `zstd` (ratio-first); `lz4` only if you measure compression as the bottleneck.
- [ ] Set `vm.swappiness` (100 on SSDs is a solid start; test alternatives).
- [ ] Verify suspend-then-hibernate works end-to-end: S3 wakes instantly, S4 resume restores state from swap.

## References

- [Swap, ZRAM, Zswap and Hibernate on NixOS — Matthew Brunelle](https://blog.matthewbrunelle.com/swap-zram-zswap-and-hibernate-on-nixos/)
- [In Defence of Swap — Chris Down](https://chrisdown.name/2018-01-02/in-defence-of-swap.html)
- [Debunking zswap and zram myths — Chris Down](https://chrisdown.name/2026-03-24/zswap-vs-zram-when-to-use-what.html)
- [disko luks-btrfs-subvolumes template](https://github.com/nix-community/disko/blob/master/example/luks-btrfs-subvolumes.nix)
- [nixpkgs PR #470366 — boot.zswap option](https://github.com/NixOS/nixpkgs/pull/470366)
- [Linux kernel docs: vm.swappiness](https://docs.kernel.org/admin-guide/sysctl/vm.html#swappiness)
