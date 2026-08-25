---
title: isolcpus Takes CPUs Off the Scheduler, but Hardware IRQs Still Land There
diataxis: Explanation
domain: programming
topic: linux-kernel
source: DEV.to Tech News
source_url: https://dev.to/sunshoutkernel/isolcpus-takes-cpus-off-the-scheduler-hardware-irqs-still-land-there-ihe
date: 2026-08-25
keywords:
- knowledge-base
- linux-kernel
- programming
- explanations
---
# isolcpus Takes CPUs Off the Scheduler, but Hardware IRQs Still Land There

`isolcpus=` is a **scheduler** isolation hint. It stops userspace tasks landing
on the named cores. It does **not** stop hardware interrupts from firing there.
This is the missing "IRQ half" of isolation that most GRUB files get wrong:

```bash
GRUB_CMDLINE_LINUX_DEFAULT="isolcpus=0,1"
# then update-grub (or grub2-mkconfig) and reboot
```

The author watched seven tight loops leave CPU0/1 idle for processes while
`/proc/interrupts` still ticked on those cores. For DPDK, a user-space NIC, or a
cycle-accurate loop, scheduler isolation is necessary and **not sufficient**.

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "d1",
      "type": "rectangle",
      "x": 60,
      "y": 140,
      "width": 320,
      "height": 100,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#c4e0f2",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "isolcpus= set\n(removed from general scheduler)",
        "fontSize": 14,
        "fontFamily": 1
      }
    },
    {
      "id": "d2",
      "type": "rectangle",
      "x": 500,
      "y": 140,
      "width": 340,
      "height": 100,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#f9d3d3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "Hardware IRQs\nstill land on those cores",
        "fontSize": 14,
        "fontFamily": 1
      }
    },
    [
      {
        "id": "d3",
        "type": "arrow",
        "x": 380,
        "y": 190,
        "width": 120,
        "height": 0,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [
          [
            0,
            0
          ],
          [
            120,
            0
          ]
        ]
      },
      {
        "id": "d3_lbl",
        "type": "text",
        "x": 390,
        "y": 166,
        "width": 100,
        "height": 20,
        "text": "IRQ affinity unchanged",
        "fontSize": 13,
        "fontFamily": 1,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent"
      }
    ],
    {
      "id": "d4",
      "type": "rectangle",
      "x": 200,
      "y": 340,
      "width": 560,
      "height": 110,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#f9e0a3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "Latency interference: isolated cores still service\ninterrupts -> real-time / low-latency workloads degraded",
        "fontSize": 14,
        "fontFamily": 1
      }
    }
  ]
}
```

## How to see what you actually isolated

```bash
cat /proc/cmdline            # isolcpus=0,1 must be present
grep PREEMPT /boot/config-$(uname -r) || true
taskset -cp 1               # a known userspace pid; should NOT be 0 or 1
watch -n1 'grep -E "^ *[0-9]" /proc/interrupts | head'
```

If IRQs still increment on CPU0/1, isolation is incomplete — which is expected
with classic `isolcpus=`.

## The modern split

- `isolcpus=domain` / cpusets / cgroup cpuset — userspace
- `isolcpus=managed_irq` or manual `irqaffinity` / `/proc/irq/*/smp_affinity` —
  interrupts
- `nohz_full=` — tick reduction; another knob, not a substitute

`isolcpus` is also marked deprecated in some trees in favor of cpusets; the IRQ
caveat did not go away when the docs changed the preferred interface.

## Moving IRQs by hand

```bash
# find the noisy ones (eth0, NVMe, GPU)
grep -E 'eth|nvme|enp' /proc/interrupts
# smp_affinity is a hex CPU mask. CPU2 only -> 4
echo 4 > /proc/irq/IRQNUM/smp_affinity
```

Or set the default affinity so *new* IRQs skip 0/1: `irqaffinity=2-7` on the same
GRUB line (adjust to your CPU count). Some devices ignore it (managed IRQs,
VFIO). For full isolation at the driver, bind the NIC to `vfio-pci` and poll from
a pinned thread.

## The irqbalance wildcard

Most distros run **irqbalance** as a daemon that continuously re-binds IRQs
across *all* online CPUs — including ones you isolated. If `/proc/interrupts`
shows IRQ counts wandering back onto CPU0/1 minutes after you pinned them,
check whether irqbalance is the actor (`systemctl status irqbalance`, or its
logs). Options: disable the daemon on the machine, or use its ban list
(`/etc/irqbalance.banlist` for per-IRQ exclusion) so it leaves your cores alone
while keeping general balancing elsewhere.

## When this shows up next to SR-IOV

Passing a VF into KVM does not pin host IRQs for you. `intel_iommu=on iommu=pt`
is a different checklist. Typical datapath box:

1. IOMMU on, VFs created, `vfio-pci` bound.
2. `isolcpus` **and** IRQ affinity so the poll thread is not preempted by the
   host NIC's own interrupt.
3. Confirm with `/proc/interrupts`, not `top`.

## References

- [isolcpus and IRQs (dev.to)](https://dev.to/sunshoutkernel/isolcpus-takes-cpus-off-the-scheduler-hardware-irqs-still-land-there-ihe)
- [irqbalance (official source tree)](https://github.com/Irqbalance/irqbalance)
