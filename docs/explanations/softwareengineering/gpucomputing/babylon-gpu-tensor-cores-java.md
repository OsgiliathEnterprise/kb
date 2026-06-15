---
title: Exploiting GPU Tensor Cores from Java using Babylon
diataxis: Explanation
domain: Software-Engineering
topic: GPU-Computing
source: ''
source_url: https://inside.java/2026/06/10/hat-tensors-computation
keywords:
- knowledge-base
- GPU-Computing
- Software-Engineering
- explanations
---
# Exploiting GPU Tensor Cores from Java using Babylon

## Overview

OpenJDK Project Babylon introduces a mechanism for Java code to run directly on GPUs and other accelerators via **code reflection** — the ability to compile Java bytecode to accelerator-native instructions at runtime. A new extension to the HAT (Hardware Acceleration Toolkit) programming model enables explicit tensor-core programming, allowing Java programs to achieve near-native performance for matrix-multiply computations on hardware with accelerated MMA (Matrix Multiply-Accumulate) support, such as NVIDIA GPUs.

## Project Babylon Background

### What is Project Babylon?

Project Babylon is one of the most architecturally ambitious initiatives in the OpenJDK ecosystem. Its core mechanism, called **code reflection**, enables:

1. Java bytecode compiled to GPU-native instructions at runtime
2. Zero-copy data transfer between JVM heap and accelerator memory
3. Transparent fallback to CPU execution when GPU unavailable

### The HAT Programming Model

HAT (Hardware Acceleration Toolkit) is the GPU layer built on top of Babylon. It provides:

- A Java-native API for accelerator programming
- Automatic kernel generation from Java methods
- Memory management abstractions for accelerator buffers

## Tensor Core Extension

### The Problem

Standard GPU compute shaders are general-purpose but don't exploit specialized tensor cores designed for matrix operations. Tensor cores can deliver **10-100x throughput** for matrix multiplication compared to standard CUDA cores, but require explicit programming via MMA (Matrix Multiply-Accumulate) intrinsics.

### The Solution

The HAT tensor core API extends the programming model with:

1. **Explicit tensor-core primitives** — Java methods annotated for tensor core execution
2. **Generic fallback** — Computations automatically fall back to standard GPU shaders on hardware without tensor cores
3. **Type-safe matrix operations** — Compile-time verification of matrix dimensions and data types

### Key API Concepts

```java
// Hypothetical API surface (based on the article's direction)
@TensorCoreKernel
public class MatrixMultiply {
    @MMAOperand(MMAOperand.Type.A)
    private Tensor2D<float4> matrixA;

    @MMAOperand(MMAOperand.Type.B)
    private Tensor2D<float4> matrixB;

    @MMAOutput
    private Tensor2D<float4> result;

    public void compute() {
        // Compiler generates tensor core instructions
        result = mma(matrixA, matrixB);
    }
}
```

### Generic Processing for Non-Tensor Hardware

The design ensures that the same Java code runs on:

- **NVIDIA GPUs with tensor cores** — Uses explicit MMA instructions
- **NVIDIA GPUs without tensor cores** — Falls back to standard CUDA cores
- **AMD/Intel GPUs** — Falls back to standard compute shaders
- **CPU** — Falls back to vectorized CPU execution via Vector API

This generic approach is critical for Java's "write once, run anywhere" philosophy extended to accelerators.

## Performance Characteristics

### Near-Native Performance

The article demonstrates that Java programs using the HAT tensor core API can achieve performance close to native CUDA/C++ implementations for matrix-multiply workloads. Key factors:

- **Zero-copy memory access** — Babylon's code reflection eliminates data transfer overhead
- **Direct tensor core dispatch** — No intermediate computation graph or runtime overhead
- **JIT compilation** — HotSpot generates optimized kernel code at runtime

### Benchmark Context

While exact benchmark numbers require the full technical article at the OpenJDK site, the key finding is that **Java can compete with native GPU programming languages** for tensor operations when the hardware acceleration layer is properly designed.

## Use Cases

### Machine Learning on the JVM

- Training and inference of neural networks directly in Java
- Custom layer implementations without leaving the JVM
- Integration with existing Java ML frameworks (DL4J, Smile, etc.)

### Scientific Computing

- Linear algebra operations (SVD, eigenvalue decomposition)
- Image processing and computer vision pipelines
- Climate and physics simulations

### Data Analytics

- Large-scale matrix operations for recommendation systems
- Real-time feature engineering in data pipelines
- Graph analytics with adjacency matrix operations

## Excalidraw Diagram

```
excalidraw://v1
{
  "type": "drawing",
  "elements": [
    {
      "id": "jvm",
      "type": "rectangle",
      "x": 50,
      "y": 50,
      "width": 200,
      "height": 100,
      "strokeColor": "#535bf2",
      "fillColor": "#eeeaff",
      "label": "JVM\n(Java Bytecode)"
    },
    {
      "id": "babylon",
      "type": "rectangle",
      "x": 300,
      "y": 50,
      "width": 200,
      "height": 100,
      "strokeColor": "#27ae60",
      "fillColor": "#e8f8f0",
      "label": "Project Babylon\n(Code Reflection)"
    },
    {
      "id": "hat",
      "type": "rectangle",
      "x": 550,
      "y": 50,
      "width": 200,
      "height": 100,
      "strokeColor": "#e67e22",
      "fillColor": "#fef5e7",
      "label": "HAT + Tensor Core API"
    },
    {
      "id": "gpu",
      "type": "rectangle",
      "x": 550,
      "y": 200,
      "width": 200,
      "height": 100,
      "strokeColor": "#e74c3c",
      "fillColor": "#fdedec",
      "label": "GPU Tensor Cores\n(MMA Instructions)"
    },
    {
      "id": "cpu",
      "type": "rectangle",
      "x": 300,
      "y": 200,
      "width": 200,
      "height": 100,
      "strokeColor": "#95a5a6",
      "fillColor": "#f4f6f6",
      "label": "CPU Fallback\n(Vector API)"
    },
    {
      "id": "arrow1",
      "type": "arrow",
      "x1": 250,
      "y1": 100,
      "x2": 300,
      "y2": 100,
      "strokeColor": "#333"
    },
    {
      "id": "arrow2",
      "type": "arrow",
      "x1": 500,
      "y1": 100,
      "x2": 550,
      "y2": 100,
      "strokeColor": "#333"
    },
    {
      "id": "arrow3",
      "type": "arrow",
      "x1": 650,
      "y1": 150,
      "x2": 650,
      "y2": 200,
      "strokeColor": "#333",
      "label": "Tensor cores"
    },
    {
      "id": "arrow4",
      "type": "arrow",
      "x1": 400,
      "y1": 150,
      "x2": 400,
      "y2": 200,
      "strokeColor": "#999",
      "label": "Fallback"
    }
  ]
}
```

## Current Status

- **Project Babylon** — Active OpenJDK project, early implementation phase
- **HAT tensor core API** — Proposed extension, technical article published June 2026
- **Full technical details** — Available at [OpenJDK Babylon articles](https://openjdk.org/projects/babylon/articles/hat-tensors/hat-tensors)

## Implications

This work represents a paradigm shift: Java applications can now leverage GPU tensor cores **without leaving the JVM**. For organizations with Java-centric stacks, this eliminates the need for separate Python/C++ ML pipelines and enables end-to-end Java ML workflows.

## Cross-References

- [JDK 26 Performance Improvements](../JDK-26-Improvements/jdk-26-performance-improvements.md) — Related JVM performance work
- [Vector API (JEP 537)](../Vector-API/jep-537-vector-api-twelfth-incubator.md) — CPU-side vectorization
- [G1 Default GC (JEP 523)](../G1-Default-GC/jep-523-g1-default-gc-all-environments.md) — JDK 27 GC changes

## References

- [Original article: Exploiting GPU Tensor Cores from Java using Babylon](https://inside.java/2026/06/10/hat-tensors-computation)
- [OpenJDK Project Babylon — HAT Tensors](https://openjdk.org/projects/babylon/articles/hat-tensors/hat-tensors)
- [Project Babylon Overview](https://openjdk.org/projects/babylon/)
- [Java Code Geeks: Project Babylon Code Reflection](https://www.javacodegeeks.com/2026/04/project-babylon-code-reflection-and-what-it-means-for-ml-on-the-jvm.html)
