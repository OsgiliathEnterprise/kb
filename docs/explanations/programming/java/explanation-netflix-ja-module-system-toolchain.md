---
title: 'Netflix ja: Module-System-Native CLI Toolchain for Modern Java'
diataxis: Explanation
domain: programming
topic: java
source: Netflix TechBlog
source_url: https://netflixtechblog.com/leave-the-class-path-in-the-rearview-mirror-67a85b15b6be
date: 2026-09-20
keywords:
- knowledge-base
- java
- programming
- explanations
---
# Netflix ja: Module-System-Native CLI Toolchain for Modern Java

Netflix's JVM Ecosystem Team (Danny Thomas) previewed **`ja`** — a family of composable, module-system-native command-line tools that make the JPMS `module-info.java` descriptor into a *complete project description*, replacing the classpath-centric workflow with a module-first one. The toolchain is explicitly designed to be agent-friendly: coding agents can locate dependencies, symbols, and sources without LSPs or MCP indexing.

## Core Design Philosophy

The Java Module System (JEP 261) arrived after build tools like Maven/Gradle had already established strong project models. The module descriptor became "just another description of the project to keep in agreement." `ja` inverts this: **the module descriptor IS the project**.

```java
/**
 * @mainClass com.example.application.Main
 */
module com.example.application {
    requires com.example.framework; // @1.2.3
}
```

Dependency versions sit beside `requires` directives; metadata (main class, access requirements) lives in doc tags on the module declaration. No separate build file needed.

## The Four Standalone Tools

Each tool is independently usable without adopting `ja`:

| Tool | Purpose | Key Detail |
|------|---------|------------|
| **jig** | Version resolution, compilation, assembly; Maven bridge | Outputs standard module-system args for `javac`/`java`/`javadoc`/`jlink`; standalone module proxy + publishing commands |
| **jfmt** | Source formatting per Oracle Code Conventions (adapted) | Built on `google-java-format`, tuned for modern Java syntax; targets whitespace/import-ordering issues common in agent-written code |
| **jist** | Source-aware symbol search (`grep`-style) | Searches class files + associated sources without IDE indexing, LSPs, or MCPs; interoperates via an argument-file contract with other build tools |
| **jdocserver** | Locally browsable API documentation | Generates pages on demand for a JDK or `ja` workspace |

All four implement Java's `Tool` or `ToolProvider` interfaces (`javax.tools.Tool`, `java.util.spi.ToolProvider`), allowing in-process execution. They are intended to be installed alongside standard JDK tools like `jdeps`, `jlink`, and `jshell`.

## Tool Discovery and Orchestration

`ja` itself is an orchestration layer using the platform's tool discovery capabilities:

- **OptionChecker** (`javax.tools.OptionChecker`) + optional custom metadata → discovers which module-system options each tool supports
- Resolves arguments on behalf of tools, providing seamless transition from source-path modules to standard JDK tooling
- No lock-in: compose any subset of the four tools in your own workflow

## Maven as Foundation (Not Replacement)

`ja` does not abandon Maven Central. It uses Maven's verified group namespaces to derive **canonical module coordinates**:

```
pkg:maven/com.netflix/com.netflix.tools.ja
```

Discovery strategy for existing artifacts:
1. **Explicit relocation POM** at the canonical coordinate → follows to original location
2. **Namespace walk** from root using common Maven artifact conventions (infers coordinates from module names)
3. **Bundled alias list** for popular modules lacking reverse-DNS names (e.g., `joda-time`)

Survey data: of the 1,000 most popular Maven Central artifacts, only 232 had explicit module definitions and 248 declared automatic module names — the remaining 520 expressed no module name opinion. The `jig` module proxy presents resolved modules using filename-based naming conventions, making even unnamed automatic modules safe.

## Integrity by Default

The toolchain aligns with OpenJDK's **Integrity by Default** policy (JEP draft 8305968) and JEP 500 ("Prepare to Make Final Mean Final"):

- `ALL-UNNAMED` access is discouraged; runtime access requirements are declared as module metadata
- Libraries record required access via doc tags:

```java
/**
 * @enableFinalFieldMutation com.example.framework
 */
module com.example.framework {
}
```

- The consuming application must explicitly authorize:

```bash
ja require com.example.framework@1.2.3 \
  --enable-final-field-mutation com.example.framework
```

Without authorization, dependency resolution **fails** with an unsatisfied access requirement. Native access follows the same model via `@enableNativeAccess`.

### Integrity Mechanisms

- **Persistent hashes**: resolved binary dependencies are hashed into a `module-info.hash` file; subsequent resolutions verify and reject changed artifacts
- **Explicit code generation**: annotation processing is treated as a visible step — generated sources sit alongside regular module source, visible in code review, allowing assembly without executing generator code

## Requirements and Availability

- Requires **JDK 25+**
- Installer creates a `ja`-enabled copy of an existing JDK (non-destructive)
- Installation scripts for macOS, Linux, Windows
- Licensed under **Apache 2.0**
- Standalone artifacts available on Maven Central
- Latest release at preview: v0.21.5 (Sept 18, 2026), rapid iteration across Sept 17–18

## Why This Matters for Coding Agents

The article's central argument: Java developers were "exceptionally well served by graphical tools" — IDEs handle formatting, navigation, docs, and compiled views. This completeness meant less pressure to expose equivalent capabilities through small composable CLI tools. **That gap becomes immediately apparent when coding agents work with Java**: agents frequently struggle to locate dependencies, documentation, and sources without an IDE.

`ja` fills this by providing:
- `jig` → dependency resolution + build (replaces "what do I need to compile?")
- `jfmt` → deterministic formatting (eliminates style drift in agent output)
- `jist` → symbol search without indexing (answers "where is X defined/used?")
- `jdocserver` → API docs on demand (answers "what does this method do?")

## Architecture Diagram

```excalidraw
{
  "type": "excalidraw",
  "version": 2,
  "source": "hermes-agent",
  "elements": [
    {
      "type": "text",
      "id": "title",
      "x": 300,
      "y": 20,
      "width": 500,
      "height": 28,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": 1,
      "version": 1,
      "versionNonce": 1,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "text": "Netflix ja Toolchain Architecture",
      "fontSize": 24,
      "fontFamily": 1,
      "textAlign": "center",
      "verticalAlign": "top",
      "baseline": 22,
      "containerId": null,
      "originalText": "Netflix ja Toolchain Architecture",
      "lineHeight": 1.25
    },
    {
      "type": "rectangle",
      "id": "module-info-box",
      "x": 350,
      "y": 70,
      "width": 400,
      "height": 60,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#a5d8ff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 3},
      "seed": 2,
      "version": 1,
      "versionNonce": 2,
      "isDeleted": false,
      "boundElements": [{"id": "module-info-text", "type": "text"}],
      "updated": 1
    },
    {
      "type": "text",
      "id": "module-info-text",
      "x": 370,
      "y": 85,
      "width": 360,
      "height": 28,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": 3,
      "version": 1,
      "versionNonce": 3,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "text": "module-info.java (Project Contract)",
      "fontSize": 20,
      "fontFamily": 1,
      "textAlign": "center",
      "verticalAlign": "middle",
      "baseline": 18,
      "containerId": "module-info-box",
      "originalText": "module-info.java (Project Contract)",
      "lineHeight": 1.25
    },
    {
      "type": "rectangle",
      "id": "ja-orchestrator",
      "x": 380,
      "y": 170,
      "width": 340,
      "height": 50,
      "angle": 0,
      "strokeColor": "#e8590c",
      "backgroundColor": "#ffd8a8",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 3},
      "seed": 4,
      "version": 1,
      "versionNonce": 4,
      "isDeleted": false,
      "boundElements": [{"id": "ja-text", "type": "text"}],
      "updated": 1
    },
    {
      "type": "text",
      "id": "ja-text",
      "x": 400,
      "y": 182,
      "width": 300,
      "height": 26,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": 5,
      "version": 1,
      "versionNonce": 5,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "text": "ja (Orchestration Layer)",
      "fontSize": 20,
      "fontFamily": 1,
      "textAlign": "center",
      "verticalAlign": "middle",
      "baseline": 18,
      "containerId": "ja-orchestrator",
      "originalText": "ja (Orchestration Layer)",
      "lineHeight": 1.25
    },
    {
      "type": "rectangle",
      "id": "jig-box",
      "x": 80,
      "y": 270,
      "width": 160,
      "height": 50,
      "angle": 0,
      "strokeColor": "#2f9e44",
      "backgroundColor": "#b2f2bb",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 3},
      "seed": 6,
      "version": 1,
      "versionNonce": 6,
      "isDeleted": false,
      "boundElements": [{"id": "jig-text", "type": "text"}],
      "updated": 1
    },
    {
      "type": "text",
      "id": "jig-text",
      "x": 95,
      "y": 282,
      "width": 130,
      "height": 26,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": 7,
      "version": 1,
      "versionNonce": 7,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "text": "jig (Build/Maven)",
      "fontSize": 16,
      "fontFamily": 1,
      "textAlign": "center",
      "verticalAlign": "middle",
      "baseline": 15,
      "containerId": "jig-box",
      "originalText": "jig (Build/Maven)",
      "lineHeight": 1.25
    },
    {
      "type": "rectangle",
      "id": "jfmt-box",
      "x": 270,
      "y": 270,
      "width": 160,
      "height": 50,
      "angle": 0,
      "strokeColor": "#7048e8",
      "backgroundColor": "#d0bfff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 3},
      "seed": 8,
      "version": 1,
      "versionNonce": 8,
      "isDeleted": false,
      "boundElements": [{"id": "jfmt-text", "type": "text"}],
      "updated": 1
    },
    {
      "type": "text",
      "id": "jfmt-text",
      "x": 285,
      "y": 282,
      "width": 130,
      "height": 26,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": 9,
      "version": 1,
      "versionNonce": 9,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "text": "jfmt (Formatter)",
      "fontSize": 16,
      "fontFamily": 1,
      "textAlign": "center",
      "verticalAlign": "middle",
      "baseline": 15,
      "containerId": "jfmt-box",
      "originalText": "jfmt (Formatter)",
      "lineHeight": 1.25
    },
    {
      "type": "rectangle",
      "id": "jist-box",
      "x": 460,
      "y": 270,
      "width": 160,
      "height": 50,
      "angle": 0,
      "strokeColor": "#e8590c",
      "backgroundColor": "#ffd8a8",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 3},
      "seed": 10,
      "version": 1,
      "versionNonce": 10,
      "isDeleted": false,
      "boundElements": [{"id": "jist-text", "type": "text"}],
      "updated": 1
    },
    {
      "type": "text",
      "id": "jist-text",
      "x": 475,
      "y": 282,
      "width": 130,
      "height": 26,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": 11,
      "version": 1,
      "versionNonce": 11,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "text": "jist (Symbol Search)",
      "fontSize": 16,
      "fontFamily": 1,
      "textAlign": "center",
      "verticalAlign": "middle",
      "baseline": 15,
      "containerId": "jist-box",
      "originalText": "jist (Symbol Search)",
      "lineHeight": 1.25
    },
    {
      "type": "rectangle",
      "id": "jdocserver-box",
      "x": 650,
      "y": 270,
      "width": 160,
      "height": 50,
      "angle": 0,
      "strokeColor": "#1971c2",
      "backgroundColor": "#a5d8ff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 3},
      "seed": 12,
      "version": 1,
      "versionNonce": 12,
      "isDeleted": false,
      "boundElements": [{"id": "jdocserver-text", "type": "text"}],
      "updated": 1
    },
    {
      "type": "text",
      "id": "jdocserver-text",
      "x": 665,
      "y": 282,
      "width": 130,
      "height": 26,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": 13,
      "version": 1,
      "versionNonce": 13,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "text": "jdocserver (Docs)",
      "fontSize": 16,
      "fontFamily": 1,
      "textAlign": "center",
      "verticalAlign": "middle",
      "baseline": 15,
      "containerId": "jdocserver-box",
      "originalText": "jdocserver (Docs)",
      "lineHeight": 1.25
    },
    {
      "type": "arrow",
      "id": "arrow-module-ja",
      "x": 550,
      "y": 130,
      "width": 0,
      "height": 40,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 2},
      "seed": 14,
      "version": 1,
      "versionNonce": 14,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "points": [[0, 0], [0, 40]],
      "lastCommittedPoint": null,
      "startBinding": {"elementId": "module-info-box", "focus": 0, "gap": 1},
      "endBinding": {"elementId": "ja-orchestrator", "focus": 0, "gap": 1},
      "startArrowhead": null,
      "endArrowhead": "arrow"
    },
    {
      "type": "arrow",
      "id": "arrow-ja-jig",
      "x": 450,
      "y": 220,
      "width": 310,
      "height": 50,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 2},
      "seed": 15,
      "version": 1,
      "versionNonce": 15,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "points": [[0, 0], [-310, 50]],
      "lastCommittedPoint": null,
      "startBinding": {"elementId": "ja-orchestrator", "focus": 0, "gap": 1},
      "endBinding": {"elementId": "jig-box", "focus": 0, "gap": 1},
      "startArrowhead": null,
      "endArrowhead": "arrow"
    },
    {
      "type": "arrow",
      "id": "arrow-ja-jfmt",
      "x": 520,
      "y": 220,
      "width": 180,
      "height": 50,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 2},
      "seed": 16,
      "version": 1,
      "versionNonce": 16,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "points": [[0, 0], [-180, 50]],
      "lastCommittedPoint": null,
      "startBinding": {"elementId": "ja-orchestrator", "focus": 0, "gap": 1},
      "endBinding": {"elementId": "jfmt-box", "focus": 0, "gap": 1},
      "startArrowhead": null,
      "endArrowhead": "arrow"
    },
    {
      "type": "arrow",
      "id": "arrow-ja-jist",
      "x": 580,
      "y": 220,
      "width": 130,
      "height": 50,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 2},
      "seed": 17,
      "version": 1,
      "versionNonce": 17,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "points": [[0, 0], [130, 50]],
      "lastCommittedPoint": null,
      "startBinding": {"elementId": "ja-orchestrator", "focus": 0, "gap": 1},
      "endBinding": {"elementId": "jist-box", "focus": 0, "gap": 1},
      "startArrowhead": null,
      "endArrowhead": "arrow"
    },
    {
      "type": "arrow",
      "id": "arrow-ja-jdocserver",
      "x": 650,
      "y": 220,
      "width": 180,
      "height": 50,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 2},
      "seed": 18,
      "version": 1,
      "versionNonce": 18,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "points": [[0, 0], [180, 50]],
      "lastCommittedPoint": null,
      "startBinding": {"elementId": "ja-orchestrator", "focus": 0, "gap": 1},
      "endBinding": {"elementId": "jdocserver-box", "focus": 0, "gap": 1},
      "startArrowhead": null,
      "endArrowhead": "arrow"
    },
    {
      "type": "rectangle",
      "id": "integrity-box",
      "x": 250,
      "y": 370,
      "width": 600,
      "height": 50,
      "angle": 0,
      "strokeColor": "#c92a2a",
      "backgroundColor": "#ffc9c9",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 3},
      "seed": 19,
      "version": 1,
      "versionNonce": 19,
      "isDeleted": false,
      "boundElements": [{"id": "integrity-text", "type": "text"}],
      "updated": 1
    },
    {
      "type": "text",
      "id": "integrity-text",
      "x": 270,
      "y": 382,
      "width": 560,
      "height": 26,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": 20,
      "version": 1,
      "versionNonce": 20,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "text": "Integrity by Default: module-info.hash + explicit access authorization",
      "fontSize": 16,
      "fontFamily": 1,
      "textAlign": "center",
      "verticalAlign": "middle",
      "baseline": 15,
      "containerId": "integrity-box",
      "originalText": "Integrity by Default: module-info.hash + explicit access authorization",
      "lineHeight": 1.25
    },
    {
      "type": "rectangle",
      "id": "maven-box",
      "x": 80,
      "y": 460,
      "width": 200,
      "height": 45,
      "angle": 0,
      "strokeColor": "#f59f00",
      "backgroundColor": "#fff3bf",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 3},
      "seed": 21,
      "version": 1,
      "versionNonce": 21,
      "isDeleted": false,
      "boundElements": [{"id": "maven-text", "type": "text"}],
      "updated": 1
    },
    {
      "type": "text",
      "id": "maven-text",
      "x": 95,
      "y": 472,
      "width": 170,
      "height": 22,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": 22,
      "version": 1,
      "versionNonce": 22,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "text": "Maven Central (bridge)",
      "fontSize": 14,
      "fontFamily": 1,
      "textAlign": "center",
      "verticalAlign": "middle",
      "baseline": 13,
      "containerId": "maven-box",
      "originalText": "Maven Central (bridge)",
      "lineHeight": 1.25
    },
    {
      "type": "rectangle",
      "id": "jdk-tools-box",
      "x": 600,
      "y": 460,
      "width": 210,
      "height": 45,
      "angle": 0,
      "strokeColor": "#868e96",
      "backgroundColor": "#e9ecef",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 3},
      "seed": 23,
      "version": 1,
      "versionNonce": 23,
      "isDeleted": false,
      "boundElements": [{"id": "jdk-tools-text", "type": "text"}],
      "updated": 1
    },
    {
      "type": "text",
      "id": "jdk-tools-text",
      "x": 615,
      "y": 472,
      "width": 180,
      "height": 22,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": 24,
      "version": 1,
      "versionNonce": 24,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "text": "JDK tools (jdeps/jlink/jshell)",
      "fontSize": 14,
      "fontFamily": 1,
      "textAlign": "center",
      "verticalAlign": "middle",
      "baseline": 13,
      "containerId": "jdk-tools-box",
      "originalText": "JDK tools (jdeps/jlink/jshell)",
      "lineHeight": 1.25
    }
  ],
  "appState": {
    "gridSize": null,
    "viewBackgroundColor": "#ffffff"
  },
  "files": {}
}
```

## Key Takeaways

1. **Module descriptor as project contract** eliminates the sync problem between `module-info.java` and build files (Maven/Gradle)
2. **Composability over monolith**: each tool is standalone; adopt incrementally
3. **Agent-first design**: `jist` specifically targets the "where is X?" problem that blocks coding agents in Java projects without IDE indexing
4. **Integrity by Default alignment**: explicit access authorization + persistent dependency hashes make supply-chain attacks harder
5. **Maven-compatible, not Maven-replacing**: uses verified namespaces for discovery; relocation POMs bridge existing artifacts

## References

- [Netflix TechBlog: Leave the Class Path in the Rearview Mirror](https://netflixtechblog.com/leave-the-class-path-in-the-rearview-mirror-67a85b15b6be)
- [Netflix/ja GitHub Repository](https://github.com/Netflix/ja)
- [JEP 261: The Java Module System](https://openjdk.org/jeps/261)
- [JEP 500: Prepare to Make Final Mean Final](https://openjdk.org/jeps/500)
- [Integrity by Default (OpenJDK draft)](https://openjdk.org/jeps/8305968)
- [RuntimeWire coverage of ja preview](https://runtimewire.com/article/netflix-ja-java-toolchain-coding-agents)
