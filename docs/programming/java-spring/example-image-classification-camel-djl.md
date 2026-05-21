---

title: "Building an Image Classification Pipeline with Apache Camel & DJL"
description: "Building an Image Classification Pipeline with Apache Camel & DJL"
tags: [example,casestudy, Programming]
date: 2026-05-18
sidebar_label: "Building an Image Classification Pipeline with Apache Camel"

---



# Building an Image Classification Pipeline with Apache Camel & DJL

## Summary
A pure-Java, on-premise image classification pipeline using Apache Camel 4.4.0 and the Deep Java Library (DJL) 0.28.0. This eliminates the need for separate Python microservices, REST calls, and serialization overhead while leveraging familiar Enterprise Integration Patterns (EIP).

## Why This Matters
Bridging Python-based computer vision examples with JVM production systems typically requires separate microservices. This approach demonstrates how DJL enables engine-agnostic deep learning inference directly in Java, using ResNet (MXNet) pre-trained on ImageNet with 1,000+ categories.

## Pipeline Architecture (4-Stage Route)

### Stage 1: File Ingestion
Watches for JPEGs, consumes them, and moves processed files with timestamps.
```java
from("file:data/input?include=.*\\.(jpg|jpeg|JPG|JPEG)&noop=false&move=../classified/${date:now:yyyyMMdd-HHmmss}-${file:name}")
```

### Stage 2: Image to Bytes
Converts `File` to `byte[]` so DJL can construct an internal `Image` object.
```java
.process(exchange -> {
    File imageFile = exchange.getIn().getBody(File.class);
    exchange.getIn().setBody(Files.readAllBytes(imageFile.toPath()));
})
```

### Stage 3: DJL Inference
Single URI handles model loading, preprocessing, tensor conversion, and forward pass.
```java
.to("djl:cv/image_classification?artifactId=ai.djl.mxnet:resnet:0.0.1")
```

### Stage 4: Content-Based Routing
Dispatches to the correct formatter based on the engine/model return type.
```java
.choice()
    .when(body().isInstanceOf(ai.djl.modality.Classifications.class))
        .bean(new ClassificationsFormatter(), "format")
    .when(body().isInstanceOf(java.util.Map.class))
        .bean(new MapResultsFormatter(), "format")
    .otherwise()
        .bean(new FallbackFormatter(), "format")
.end()
```

## Key Gradle Dependencies
```groovy
dependencies {
    // Apache Camel
    implementation 'org.apache.camel:camel-core:4.4.0'
    implementation 'org.apache.camel:camel-main:4.4.0'
    implementation 'org.apache.camel:camel-file:4.4.0'
    implementation 'org.apache.camel:camel-djl:4.4.0'
    
    // DJL & MXNet Engine
    implementation platform('ai.djl:bom:0.28.0')
    implementation 'ai.djl:api'
    implementation 'ai.djl.mxnet:mxnet-engine'
    implementation 'ai.djl.mxnet:mxnet-model-zoo'
    runtimeOnly 'ai.djl.mxnet:mxnet-native-mkl:1.9.1:win-x86_64' // CPU-optimized
}
```

## Procedure / How-To: Running the Pipeline

1. **Set up the project** with the Gradle dependencies above
2. **Create `ImageClassificationRoutes.java`** with the 4-stage route
3. **Implement formatter beans:**
   - `ClassificationsFormatter` — handles standard DJL `Classifications` output (top 5 predictions with confidence scores)
   - `MapResultsFormatter` — handles MXNet variants returning `Map<String, Float>`
   - `FallbackFormatter` — catches unexpected types ("fail softly" production pattern)
4. **Run:** `gradlew clean run`
5. **Drop JPEGs** in `data/input/` → Inference runs → Results saved to `data/output/` → Original archived to `data/classified/`

## Production Best Practices
- **Model Warm-up:** First inference triggers loading & JIT compilation. Warm up on startup to avoid latency spikes
- **Memory Allocation:** Image models are memory-intensive; allocate **500MB–1GB JVM heap**
- **Scaling:**
  - *Horizontal:* Multiple Camel instances watching separate directories
  - *Vertical:* GPU acceleration via DJL's GPU engine support

## Common Pitfalls
- **Skipping model warm-up:** First inference can take several seconds, causing timeout errors in production
- **Insufficient JVM heap:** Image classification models need significant memory; default heap settings may cause OOM errors
- **Ignoring engine compatibility:** DJL supports multiple engines (MXNet, PyTorch, TensorFlow) — ensure the native library matches your platform

## Related Topics
- [howto-spring-weekly-may-12-2026](Spring Weekly May 12, 2026)

## References
- 📰 [Building an Image Classification Pipeline With Camel and DJL](https://dzone.com/articles/image-classification-pipeline-camel-djl) via DZone (2026)
