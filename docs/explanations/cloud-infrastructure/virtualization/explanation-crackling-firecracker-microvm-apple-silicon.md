---
title: 'Crackling: one microVM API over Firecracker (Linux) and Apple Virtualization.framework
  (macOS)'
diataxis: Explanation
domain: Cloud & Infrastructure
topic: Virtualization
source: HackerNews
source_url: https://encore.dev/blog/firecracker-apple-silicon
date: 2026-08-21
keywords:
- knowledge-base
- Virtualization
- Cloud & Infrastructure
- explanations
---
# Crackling: One MicroVM API Over Two Hypervisors

## Summary
Encore builds every backend application inside a **Firecracker** microVM in production. Firecracker drives **KVM**, so it needs a Linux host with `/dev/kvm` — which no Mac has. Since the maintainers have no plans to support macOS (they turned down a working proof-of-concept on Apple's `Virtualization.framework`), Encore engineers spent four years building the build system on a shared remote Linux box. To run the *same* build system on their own M-series laptops while keeping Firecracker in production, they built **crackling**: a single microVM API that drives **Firecracker on Linux** and **Apple's `Virtualization.framework` (VZ) on macOS**, booting the *same* OCI images on both.

The core insight: the two hypervisors have little in common, so the value is not in a thin shim but in (1) a **hypervisor-agnostic core crate**, (2) rebuilding the **Linux image toolchain to run on macOS**, and (3) understanding the **one capability Apple will not let third parties have** — capturing a running VM's state.

## Architecture

### Hypervisor-agnostic core
- `MachineSpec` describes a machine: `vcpus`, `mem`, `kernel`, `rootfs`, `extra_disks`, `nics`, `vsock`, plus per-backend extras. `MachineState` tracks it at runtime.
- Both backends implement a `MachineBackend` trait: `start`, `shutdown`, `pause`, `resume`, `snapshot`, `wait`, `dispose`, and (where available) `connect_vsock`.
- **Backend dispatch is static** — only one backend exists per target (chosen at compile time). The trait gives a shared contract and lets tests substitute an in-memory backend.
- A `Feature` enum makes each backend report what it supports before any machine exists: `Snapshot`, `SnapshotRestore`, `Mmds`, `VirtioFs`, `Rosetta`, `TapNetwork`, `NatNetwork`, `MemoryBalloon`, `Entropy`, `Vsock`, `Adoption`. Requests for an unavailable feature fail at the API boundary with the unsupported feature *named*.

| Capability | Firecracker (Linux) | VZ (macOS) |
|-----------|--------------------|-----------|
| Host tap network | yes | no |
| Built-in NAT device | no | yes |
| virtiofs sharing | no | yes |
| Rosetta x86-in-arm64 | no | yes |
| Snapshot capture + restore | yes | capture only |
| Machine adoption (outlives process) | yes (systemd scope) | no (in-process) |
| MMDS metadata service | yes | no |

### Threading: the one thread Apple's framework insists on
The whole macOS backend hangs on a strict constraint: `VZVirtualMachine`, `VZVirtualMachineConfiguration`, and the device objects are `!Send + !Sync`, and **every VM call and completion handler must run on the serial dispatch queue that created the VM**. The rest of the daemon is **tokio**, which moves futures between worker threads at will — so no arrangement can hold a VM object across an `await` point and satisfy both constraints.

The resolution:
- Create and access **every** VM on one **process-global serial `DispatchQueue`**. The VM registry is reachable only from closures dispatched onto that queue, so access stays serialized and the objects never reach tokio's threads.
- The async side is an ordinary `Send + Sync + Clone` handle that dispatches a closure carrying only `Send` data, then awaits the reply.
- The dispatch API requires `Send + 'static` closures, so the **compiler** prevents a `!Send` VM object from being captured. The registry and reactor still need **hand-written `Send`/`Sync` impls**; the queue invariant depends on them.
- `VZVirtualMachineConfiguration` is `!Send` too, so lowering is **two phases**: `MachineSpec` → a structure of only `Send` data on tokio → a `VZVirtualMachineConfiguration` on the queue. A completion handler receives a raw `NSError` pointer valid only for the block's duration, so it is converted to an **owned error on the queue** before replying. Dropping the last handle dispatches a `dispose` on the queue (the framework requires release on its own queue).

```rust
// crates/crackling-vz/src/reactor.rs — every VM lives on one serial queue
reactor().queue.exec_async(move || {
    match build_configuration(&cfg) {
        Ok(vm_cfg) => {
            // SAFETY: the reactor's own serial queue is passed; the VM is
            // stored and only ever used from this queue henceforth.
            let vm = unsafe {
                VZVirtualMachine::initWithConfiguration_queue(
                    VZVirtualMachine::alloc(), &vm_cfg, &reactor().queue)
            };
            let id = shared.id;
            if let Ok(mut g) = reactor().state.vms.lock() {
                g.insert(id, ReactorVm { vm, shared });
            }
            let _ = reply.send(Ok(()));
        }
        Err(e) => { /* mark Failed, then */ let _ = reply.send(Err(e)); }
    }
});
```

### Building a bootable Linux image without Linux
Booting required replacing the Linux-only image pipeline. macOS has no root, no loop mount, no `cpio` binary, and the kernel tree's `extract-vmlinux` is written for x86 `bzImage`, not an arm64 kernel.
- Neither hypervisor boots until it has an **uncompressed** kernel image. The arm64 `vmlinuz` is usually an **EFI zboot** file — a small EFI executable wrapping a compressed payload the firmware would normally decompress. With no firmware present, crackling unwraps it itself: the `MZ` at offset 0 and the `zimg` signature at offset 4 identify the format; the header gives the payload offset, size, and compression (only `gzip` is handled).
- Handing VZ a **compressed** kernel fails at start with a **generic `VZErrorInternal`** and no detail. The fix is to check for the **`ARMd` signature at offset 0x38** (which identifies a raw arm64 `Image`) and reject a compressed kernel *before* trying to boot.
- The rootfs is applied **entirely in userspace** (OCI layers, honoring `.wh.` whiteout entries in-process, no cleanup pass). Pulling needs a **custom platform resolver** because the default keys off the host OS and never matches a `linux/arm64` image requested from a Mac.
- The initramfs is a **newc-format cpio archive inside a gzip stream**, generated in pure Rust; by default the rootfs stays in RAM until the VM stops.
- The image is unpacked and normalized **once**, writes a `.built` sentinel, and is published by **atomic rename** so a crash leaves the existing cache untouched. Each VM clones the cached rootfs with `clonefile` on APFS, a per-file `FICLONE` reflink on supporting Linux filesystems, or a plain copy elsewhere.

```rust
// crates/crackling-image/src/kernel.rs — unwrap an EFI zboot arm64 kernel
// "MZ" at offset 0 and the "zimg" signature at offset 4.
if bytes.len() > 64 && &bytes[0..2] == b"MZ" && &bytes[4..8] == b"zimg" {
    let payload_offset = u32::from_le_bytes(bytes[8..12].try_into().unwrap()) as usize;
    let payload_size   = u32::from_le_bytes(bytes[12..16].try_into().unwrap()) as usize;
    let comp_end = bytes[24..32].iter().position(|&b| b == 0).unwrap_or(8);
    let compression = std::str::from_utf8(&bytes[24..24 + comp_end]).unwrap_or("");
    let end = payload_offset.checked_add(payload_size)
        .filter(|&e| e <= bytes.len())
        .ok_or_else(|| ImageError::Kernel("zboot payload out of range".into()))?;
    let raw = match compression {
        "gzip" => gunzip(&bytes[payload_offset..end])?,
        other  => return Err(ImageError::Kernel(format!("unsupported zboot compression: {other:?}"))),
    };
}
```

### Getting a shell inside the VM (vsock agent)
Both platforms provide **vsock**. Alpine's `virt` kernel ships `AF_VSOCK` as loadable modules, so the guest `/init` loads `vsock`, `vmw_vsock_virtio_transport_common`, and `vmw_vsock_virtio_transport` before anything can listen. Those modules carry a **vermagic** string that must match the running kernel exactly; a mismatch fails at load with nothing useful downstream (the VM boots, the agent never comes up, the host waits forever).
- Every VM runs the **same agent**: a static **musl** binary (`aarch64-unknown-linux-musl` on Mac, `x86_64-unknown-linux-musl` for amd64 hosts) that listens on `AF_VSOCK` with a small framed protocol — an **8-byte header** followed by either an encoded control frame or raw bytes for bulk data, one connection per operation.
- The protocol supports `exec` with streamed stdout/stderr, an interactive `shell` on a PTY, `cp` in both directions, and `forward` (a connection tunnelled to a guest port).
- The guest keeps **no SSH daemon** and no manual network config; outbound networking is a separate opt-in and inbound is only via a control-plane `forward` authenticated with a **per-VM token generated at boot**.
- On macOS the host end of the transport is a `VZVirtioSocketDevice` fd that must be **`dup(2)`ed immediately**, because the framework closes the original when the Objective-C object deallocates. On Linux it is a Unix socket with a text handshake, and the reply is **read one byte at a time** so a buffered read never swallows payload bytes past the newline.

### Apple does not let third parties snapshot a VM
Firecracker captures memory + device state natively (`PUT /snapshot/create`); a spec with `restore_from` spawns a fresh VMM, checks the snapshot's host fingerprint, loads it paused, and resumes without booting.
On Apple, `VZVirtualMachine` exposes `saveMachineStateToURL` and the configuration's `validateSaveRestoreSupport` *appears* to support it — the validator even returns **successfully**. But the save fails with `VZErrorInternal`, even on a minimal VM carrying little more than a vsock device. The reason: running a VM needs `com.apple.security.virtualization` (any developer can sign it), while **saving** one additionally needs **`com.apple.private.virtualization`**, which Apple does **not** grant to third-party apps. The validator does not check for the second entitlement, so the framework *reports the operation as supported, fails when you call it, and returns the same generic internal error* a bad kernel produces. This is the one capability Apple will not let you have — and it is invisible until you actually invoke the save.

```
$ crackling run --image alpine:3.20
  running   alpine:3.20
$ crackling exec 0c1f8f3c-... uname -a
  Linux (none) 6.6.142-0-virt ... aarch64 Linux
$ crackling shell 0c1f8f3c-...
  ~ # cat /etc/alpine-release
  3.20.10
```

## Why This Matters
- A **single microVM API** lets the *same* OCI images boot on both a Linux datacenter (Firecracker) and a developer's Mac (VZ), collapsing a four-year shared-remote-machine workflow into a native laptop loop.
- The pattern of a **hypervisor-agnostic core + static compile-time backend + explicit capability enumeration** is a reusable template for "one API over N backends" (networking stacks, storage, rendering) where backends disagree on capabilities.
- The **serial-dispatch-queue + hand-written `Send`/`Sync`** technique is the canonical way to bridge a `!Send + !Sync` Objective-C/FFI object into an async Rust runtime — the compiler enforces the invariant at the closure boundary.
- The **entitlement trap** is a general lesson: a framework's *capability-checking* API (`validateSaveRestoreSupport`) can report "supported" for an operation the app's *signature* cannot actually perform. Test the real operation, not just the validator.

## Cross-Hardware Trade-off Diagram (Excalidraw)
```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "title",
      "type": "rectangle",
      "x": 120, "y": 20,
      "width": 560, "height": 44,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#f9d3d3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "crackling: one microVM API over two hypervisors", "fontSize": 16, "fontFamily": 1 }
    },
    {
      "id": "core",
      "type": "rectangle",
      "x": 250, "y": 110,
      "width": 300, "height": 70,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#aaf",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "crackling core (hypervisor-agnostic)\nMachineSpec + MachineBackend trait\nstatic compile-time backend dispatch", "fontSize": 13, "fontFamily": 1 }
    },
    {
      "id": "linux",
      "type": "rectangle",
      "x": 60, "y": 250,
      "width": 220, "height": 110,
      "strokeColor": "#30665c",
      "backgroundColor": "#c4e0c5",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "Firecracker (Linux)\nhost tap + MMDS\nsnapshot create+restore\nmachines outlive daemon\n(systemd scope + pidfd)", "fontSize": 13, "fontFamily": 1 }
    },
    {
      "id": "macos",
      "type": "rectangle",
      "x": 520, "y": 250,
      "width": 220, "height": 110,
      "strokeColor": "#e52727",
      "backgroundColor": "#f9e0a8",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "Virtualization.framework (macOS)\nbuilt-in NAT + virtiofs + Rosetta\nserial DispatchQueue (!Send+!Sync)\nsnapshot: capture only\n(no private entitlement)", "fontSize": 13, "fontFamily": 1 }
    },
    {
      "id": "agent",
      "type": "rectangle",
      "x": 250, "y": 430,
      "width": 300, "height": 70,
      "strokeColor": "#bf8401",
      "backgroundColor": "#fff3b0",
      "fillStyle": "solid",
      "strokeWidth": 3,
      "roundness": { "type": 3 },
      "text": { "content": "same in-guest agent on both\nAF_VSOCK framed protocol\nexec / shell / cp / forward", "fontSize": 13, "fontFamily": 1 }
    },
    {
      "id": "arrow-core-linux",
      "type": "arrow",
      "x": 300, "y": 180,
      "width": 0, "height": 70,
      "strokeColor": "#30665c",
      "strokeWidth": 2,
      "startArrowhead": null,
      "endArrowhead": "arrow",
      "points": [[0, 0], [0, 70]]
    },
    {
      "id": "arrow-core-macos",
      "type": "arrow",
      "x": 500, "y": 180,
      "width": 0, "height": 70,
      "strokeColor": "#e52727",
      "strokeWidth": 2,
      "startArrowhead": null,
      "endArrowhead": "arrow",
      "points": [[0, 0], [0, 70]]
    },
    {
      "id": "arrow-linux-agent",
      "type": "arrow",
      "x": 170, "y": 360,
      "width": 0, "height": 70,
      "strokeColor": "#30665c",
      "strokeWidth": 2,
      "startArrowhead": null,
      "endArrowhead": "arrow",
      "points": [[0, 0], [0, 70]]
    },
    {
      "id": "arrow-macos-agent",
      "type": "arrow",
      "x": 630, "y": 360,
      "width": 0, "height": 70,
      "strokeColor": "#e52727",
      "strokeWidth": 2,
      "startArrowhead": null,
      "endArrowhead": "arrow",
      "points": [[0, 0], [0, 70]]
    }
  ]
}
```

## References
- [Encore — We rebuilt the Linux microVM stack on Apple Silicon](https://encore.dev/blog/firecracker-apple-silicon) (Ivan Cernja, 2026-08-18)
- [Firecracker — upstream does not plan to support macOS](https://github.com/firecracker-microvm/firecracker/discussions/5019)
- [Apple — Virtualization.framework (VZ)](https://developer.apple.com/documentation/virtualization)
- [Apple — Running Intel binaries in Linux VMs with Rosetta](https://developer.apple.com/documentation/virtualization/running-intel-binaries-in-linux-vms-with-rosetta)
- [ARM64 booting — `ARMd` magic at offset 0x38](https://docs.kernel.org/arch/arm64/booting.html)
- [virtio-fs](https://virtio-fs.gitlab.io/) · [musl libc](https://musl.libc.org/) · [tokio](https://tokio.rs/)
