---
title: Kubernetes Dynamic Resource Allocation (DRA) and the Device Management Working
  Group
diataxis: Explanation
domain: Cloud-Native
topic: Container-Orchestration
source: Kubernetes Blog
source_url: https://kubernetes.io/blog/2026/06/24/wg-device-management-spotlight-2026/
date: 2026-07-13
keywords:
- knowledge-base
- Container-Orchestration
- Cloud-Native
- explanations
---
# Kubernetes Dynamic Resource Allocation (DRA) and the Device Management Working Group

## Overview

The Kubernetes Device Management Working Group addresses a fundamental limitation in how Kubernetes handles specialized hardware. Their cornerstone project, **Dynamic Resource Allocation (DRA)**, graduated to **General Availability (GA)** in Kubernetes 1.34, marking a shift from treating devices as opaque integers to a structured, declarative API for hardware-aware scheduling.

## The Problem: Legacy Device Plugin Model

The traditional Device Plugin API treats devices as simple integer counts:

- You can request "2 GPUs" but cannot specify which GPUs
- No way to describe GPU memory requirements, interconnect topology, or partitioning needs
- No support for time-sharing or post-scheduling device allocation
- Inadequate for modern AI/ML workloads that span multiple nodes with specific hardware requirements

## The Solution: Dynamic Resource Allocation (DRA)

DRA replaces the rigid device plugin model with a **four-stage framework**:

### 1. Modeling (ResourceSlice API)

Vendors use the `ResourceSlice` API to advertise granular capabilities and capacity of their hardware. Unlike the legacy model where a device was just an integer, DRA allows drivers to publish fine-grained device attributes:

```yaml
apiVersion: resource.k8s.io/v1beta1
kind: ResourceSlice
metadata:
  name: gpu-node-1
node: worker-node-1
driver: gpu.nvidia.com
pool:
  name: pool-1
  generation: 1
resources:
  - name: gpu
    allocatable:
      - count: 4
        attributes:
          - name: product
            valueString: "NVIDIA A100"
          - name: memory
            valueString: "80Gi"
```

### 2. Requesting (ResourceClaim API)

Users define specific hardware needs through the `ResourceClaim` API:

```yaml
apiVersion: resource.k8s.io/v1beta1
kind: ResourceClaim
metadata:
  name: gpu-claim
spec:
  resources:
    requests:
      - name: gpu
        selection:
          - resourceSelector:
              nodeSelector:
                nodeSelectorTerms:
                  - matchExpressions:
                      - key: gpu.nvidia.com/product
                        operator: In
                        values: ["A100", "H100"]
```

### 3. Scheduling

The Kubernetes scheduler matches workload requirements against available hardware using the structured parameters. This is an **NP-hard** scheduling problem — the scheduler must consider:

- Device compatibility and capabilities
- Topology awareness (NUMA nodes, PCIe proximity)
- Multi-node workloads and distributed training
- Time-sharing and partitioning constraints

### 4. Actuation

Once a match is made, the system handles the "handshake" that prepares and secures the device for the Pod's use. This includes:

- Driver-level device preparation
- Container runtime integration
- Security isolation and access control
- Post-start device attachment (for devices that can be allocated after pod start)

## Key Participants

| Chair | Organization | Role |
|-------|-------------|------|
| Kevin Klues | NVIDIA | Distinguished Engineer, kubelet maintainer since 2019 |
| Patrick Ohly | Intel | Tech Lead for SIG Testing & SIG Instrumentation |
| John Belamaric | Google | Co-chair of SIG Architecture |

## Evolution Timeline

- **2019/2020:** Initial DRA work begins (Kevin Klues, Patrick Ohly)
- **2020:** First DRA KEP written ("classic DRA")
- **2020-2023:** Second KEP for "structured parameters DRA"
- **2023:** Community interest in DRA picks up significantly
- **2024 (KubeCon EU):** Device Management Working Group formally established
- **2024-2025:** Consensus built around new design with Tim Hockin
- **Kubernetes 1.34:** DRA graduated to GA
- **2026:** NVIDIA GPU DRA driver becomes community project

## DRA vs. Legacy Device Plugin Comparison

| Feature | Device Plugin | DRA |
|---------|--------------|-----|
| Device specification | Integer count | Structured attributes |
| GPU memory requirements | ❌ | ✅ |
| Interconnect topology | ❌ | ✅ |
| Device partitioning | ❌ | ✅ |
| Time-sharing | ❌ | ✅ |
| Post-start allocation | ❌ | ✅ |
| Multi-node workloads | Limited | ✅ |
| Scheduler integration | Basic | Advanced |

## Future Directions

The working group is exploring:

- **Health monitoring** for allocated devices
- **Topology-aware scheduling** improvements
- **AI skills** to reduce maintainer burnout
- **AI-assisted triage** of failing tests
- **Operational tooling** for Kubernetes device management

## Getting Involved

- **Meetings:** Biweekly on Tuesdays (8:30 AM PT) and Wednesdays (9:00 AM CET)
- **Slack:** `#wg-device-management` on Kubernetes Slack
- **Hands-on:** The NVIDIA GPU DRA driver is now a community project

## Excalidraw Diagram

```excalidraw
* Excalidraw below
* You can draw in the message, and call draw_excalidraw to update the drawing
* When you send messages, include the drawing in the response to me so that I can see your drawings
* I can edit settings with Excalidraw+ settings, or draw text by starting lines with '> '

{"type":"default","values":{"appScale":1.0,"pageId":"p1","pages":{"p1":{"id":"p1","type":"tumbleweed","name":"Page 1","width":2200,"height":2200,"gridSize":20,"backgroundImageSrc":null,"backgroundImageSelectedZoomLevel":0,"isEmpty":false},"page2":{"id":"page2","type":"tumbleweed","name":"Page 2","width":2200,"height":2200,"gridSize":20,"backgroundImageSrc":null,"backgroundImageSelectedZoomLevel":0,"isEmpty":true}},"exportPadding":120,"toView":null,"gridSettings":{"customSize":20,"circular":false,"type":"square","dashed":true},"viewBackgroundColor":"#FFFFFF","theme":"dark","strokeColor":"#e6422c","backgroundColor":"#FFFFFF","fontSize":20,"font":"Cascadia","strokeWidth":2,"roughness":0,"seed":117588423,"view":null,"gridMode":false,"gridModeEnabled":false,"gridStep":5,"gridCounter":3}}
text {"id":"1","x":500.0,"y":100.0,"text":"DRA Four-Stage Framework","fontSize":24,"fontFamily":1,"type":"text","strokeColor":"#e6422c","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"aV","seed":149553083,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"2","x":100.0,"y":250.0,"text":"1. Modeling","fontSize":20,"fontFamily":1,"type":"text","strokeColor":"#457b9d","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"aW","seed":154724707,"groupIds":["aQ"],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"3","x":100.0,"y":290.0,"text":"ResourceSlice API","fontSize":16,"fontFamily":1,"type":"text","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"aX","seed":134999955,"groupIds":["aQ"],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"4","x":100.0,"y":320.0,"text":"Vendor publishes","fontSize":14,"fontFamily":1,"type":"text","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"aY","seed":150582691,"groupIds":["aQ"],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"5","x":100.0,"y":345.0,"text":"device attributes","fontSize":14,"fontFamily":1,"type":"text","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"aZ","seed":163038390,"groupIds":["aQ"],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"6","x":400.0,"y":250.0,"text":"2. Requesting","fontSize":20,"fontFamily":1,"type":"text","strokeColor":"#457b9d","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"ba","seed":277501699,"groupIds":["aR"],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"7","x":400.0,"y":290.0,"text":"ResourceClaim API","fontSize":16,"fontFamily":1,"type":"text","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bb","seed":163038403,"groupIds":["aR"],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"8","x":400.0,"y":320.0,"text":"User specifies","fontSize":14,"fontFamily":1,"type":"text","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bc","seed":163038404,"groupIds":["aR"],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"9","x":400.0,"y":345.0,"text":"hardware needs","fontSize":14,"fontFamily":1,"type":"text","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bd","seed":163038405,"groupIds":["aR"],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"10","x":700.0,"y":250.0,"text":"3. Scheduling","fontSize":20,"fontFamily":1,"type":"text","strokeColor":"#457b9d","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"be","seed":163038406,"groupIds":["aS"],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"11","x":700.0,"y":290.0,"text":"Kubernetes Scheduler","fontSize":16,"fontFamily":1,"type":"text","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bf","seed":163038407,"groupIds":["aS"],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"12","x":700.0,"y":320.0,"text":"Matches requirements","fontSize":14,"fontFamily":1,"type":"text","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bg","seed":163038408,"groupIds":["aS"],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"13","x":700.0,"y":345.0,"text":"to available hardware","fontSize":14,"fontFamily":1,"type":"text","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bh","seed":163038409,"groupIds":["aS"],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"14","x":1000.0,"y":250.0,"text":"4. Actuation","fontSize":20,"fontFamily":1,"type":"text","strokeColor":"#457b9d","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bi","seed":163038410,"groupIds":["aT"],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"15","x":1000.0,"y":290.0,"text":"Device Handshake","fontSize":16,"fontFamily":1,"type":"text","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bj","seed":163038411,"groupIds":["aT"],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"16","x":1000.0,"y":320.0,"text":"Driver prepares","fontSize":14,"fontFamily":1,"type":"text","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bk","seed":163038412,"groupIds":["aT"],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"17","x":1000.0,"y":345.0,"text":"and secures device","fontSize":14,"fontFamily":1,"type":"text","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bl","seed":163038413,"groupIds":["aT"],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
arrow {"id":"18","x":350.0,"y":280.0,"binding":{"elementID":"aQ","focus":0.5,"gap":50,"startHeadId":null},"lastPos":{"x":350.0,"y":280.0},"points":"[0,0],[1,0]","startArrowSharpness":0.25,"endArrowSharpness":0.25,"startPoints":[[0,0],[1,0]],"endPoints":[[0,0],[1,0]],"startBinding":null,"endBinding":null,"startArrowhead":null,"endArrowhead":"arrow","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bm","seed":163038414,"groupIds":[],"roundness":{"type":2},"status":"active","strokeSharpness":"sharp","optionsId":"default"}
arrow {"id":"19","x":650.0,"y":280.0,"binding":{"elementID":"aR","focus":0.5,"gap":50,"startHeadId":null},"lastPos":{"x":650.0,"y":280.0},"points":"[0,0],[1,0]","startArrowSharpness":0.25,"endArrowSharpness":0.25,"startPoints":[[0,0],[1,0]],"endPoints":[[0,0],[1,0]],"startBinding":null,"endBinding":null,"startArrowhead":null,"endArrowhead":"arrow","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bn","seed":163038415,"groupIds":[],"roundness":{"type":2},"status":"active","strokeSharpness":"sharp","optionsId":"default"}
arrow {"id":"20","x":950.0,"y":280.0,"binding":{"elementID":"aS","focus":0.5,"gap":50,"startHeadId":null},"lastPos":{"x":950.0,"y":280.0},"points":"[0,0],[1,0]","startArrowSharpness":0.25,"endArrowSharpness":0.25,"startPoints":[[0,0],[1,0]],"endPoints":[[0,0],[1,0]],"startBinding":null,"endBinding":null,"startArrowhead":null,"endArrowhead":"arrow","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bo","seed":163038416,"groupIds":[],"roundness":{"type":2},"status":"active","strokeSharpness":"sharp","optionsId":"default"}
text {"id":"21","x":500.0,"y":450.0,"text":"Legacy: \"Give me 2 GPUs\"","fontSize":18,"fontFamily":1,"type":"text","strokeColor":"#e6422c","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bp","seed":163038417,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"22","x":500.0,"y":500.0,"text":"DRA: \"Give me A100/H100 with 80Gi memory,","fontSize":18,"fontFamily":1,"type":"text","strokeColor":"#457b9d","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bq","seed":163038418,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"23","x":500.0,"y":525.0,"text":"NVLink topology, partitioned for training\"","fontSize":18,"fontFamily":1,"type":"text","strokeColor":"#457b9d","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"br","seed":163038419,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"24","x":500.0,"y":600.0,"text":"GA in Kubernetes 1.34","fontSize":16,"fontFamily":1,"type":"text","strokeColor":"#2c2d34","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bs","seed":163038420,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
```

## References

- [Original Article: Spotlight on WG Device Management](https://kubernetes.io/blog/2026/06/24/wg-device-management-spotlight-2026/)
- [Kubernetes DRA Documentation](https://kubernetes.io/docs/concepts/scheduling-eviction/dynamic-resource-allocation/)
- [Device Management Working Group](https://www.kubernetes.dev/community/community-groups/wg/device-management/)
- [DRA GA Announcement (Kubernetes 1.34)](https://kubernetes.io/blog/2025/09/01/kubernetes-v1-34-dra-updates/)
- [NVIDIA GPU DRA Driver](https://github.com/NVIDIA/k8s-dra-driver)
