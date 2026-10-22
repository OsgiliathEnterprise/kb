---
title: How to set up Project Reactor in a Spring Boot project (dependencies + BOM)
diataxis: How-to Guide
domain: programming
topic: java
source: ''
---
---
created: 2026-09-17
type: howto
title: "How to set up Project Reactor in a Spring Boot project (dependencies + BOM)"
domain: programming
topic: java/Reactor
source: "Ebook: Spring in Action, 6th Edition by Craig Walls"
source_book_id: calibrebook_398
source_chapter: "Chapter 11: Introducing Reactor"
tags: [reactor, spring-boot, maven, reactive-streams]
visibility: private
ai_tool_candidate: true

concise: true---

# How to set up Project Reactor in a Spring Boot project (dependencies + BOM)

## Input parameters
- Build system: Maven (Gradle equivalent: `implementation 'io.projectreactor:reactor-core'`)
- Whether the project is Spring Boot (dependency-managed) or standalone (needs BOM)

## Procedure
1. **Add reactor-core** — the main library providing `Flux` and `Mono`:
   ```xml
   <dependency>
     <groupId>io.projectreactor</groupId>
     <artifactId>reactor-core</artifactId>
   </dependency>
   ```
2. **Add reactor-test** (test scope) — provides `StepVerifier`, the standard way to assert on reactive streams:
   ```xml
   <dependency>
     <groupId>io.projectreactor</groupId>
     <artifactId>reactor-test</artifactId>
     <scope>test</scope>
   </dependency>
   ```
3. **Spring Boot projects**: omit `<version>` — Spring Boot's dependency management pins Reactor versions automatically.
4. **Standalone (non-Spring-Boot) projects**: import the Reactor BOM so all `io.projectreactor` artifacts resolve to a consistent release:
   ```xml
   <dependencyManagement>
     <dependencies>
       <dependency>
         <groupId>io.projectreactor</groupId>
         <artifactId>reactor-bom</artifactId>
         <version>2020.0.4</version>
         <type>pom</type>
         <scope>import</scope>
       </dependency>
     </dependencies>
   </dependencyManagement>
   ```

## Error handling
- **Version conflicts** between reactor-core and other reactive libraries → always import the BOM rather than pinning individual versions.
- **`reactor-test` on classpath in production code** → keep it `<scope>test</scope>`; `StepVerifier` is a test-only API.

## Verification
- Build succeeds with no version warnings for `io.projectreactor` artifacts.
- A smoke test compiles: `Flux.just(1).subscribe(System.out::println)` prints `1`.

## Related notes
- How to create reactive types (Flux/Mono)
- How to test reactive streams with StepVerifier
