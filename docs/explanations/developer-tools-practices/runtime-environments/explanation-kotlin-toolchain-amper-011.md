---
title: 'Kotlin Toolchain (Amper 0.11.0): Unified Multiplatform Development'
diataxis: Explanation
domain: Developer Tools & Practices
topic: Runtime Environments
source: Developpez (JetBrains)
source_url: https://jetbrains.developpez.com/actu/384657/JetBrains-annonce-que-Amper-0-11-0-est-disponible-et-devient-Kotlin-Toolchain-un-point-d-entree-unifie-vers-Kotlin-permettant-de-developper-des-applications-JVM-Android-iOS-multiplateformes/
date: 2026-07-06
keywords:
- knowledge-base
- Runtime Environments
- Developer Tools & Practices
- explanations
---
# Kotlin Toolchain (Amper 0.11.0): Unified Multiplatform Development

## Overview

**Kotlin Toolchain** (formerly Amper) 0.11.0 is JetBrains' unified entry point for Kotlin development. This release rebrands the Amper project and introduces a single, consistent interface for building Kotlin applications across all platforms — JVM, Android, iOS, and multiplatform targets. This represents a significant shift in how developers interact with the Kotlin ecosystem.

---

## What Changed

### Rebranding: Amper → Kotlin Toolchain

The project was renamed from "Amper" to "Kotlin Toolchain" to better reflect its purpose as the standard entry point for Kotlin development. The 0.11.0 release is the first under the new name.

### Unified Entry Point

Previously, Kotlin development required different tooling for different targets:
- **JVM**: Gradle/Maven with Kotlin plugin
- **Android**: Android Studio with AGP
- **iOS**: Xcode integration via Kotlin/Native
- **Multiplatform**: Separate KMP plugin configuration

Kotlin Toolchain 0.11.0 consolidates these into a single interface.

---

## Key Features

### 1. Cross-Platform Project Initialization

```bash
# Create a new multiplatform project
kotlinc init --template multiplatform

# Create a JVM-only project
kotlinc init --template jvm

# Create an Android project
kotlinc init --template android

# Create an iOS project
kotlinc init --template ios
```

### 2. Unified Build Configuration

Kotlin Toolchain introduces a single `build.kts` format that handles all platform targets:

```kotlin
// build.kts - unified configuration
kotlin {
    jvm()
    android()
    iosArm64()
    iosSimulatorArm64()
    
    sourceSets {
        commonMain.dependencies {
            implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.0")
        }
        
        jvmMain.dependencies {
            implementation("org.jetbrains.kotlinx:kotlinx-coroutines-jdk8:1.7.3")
        }
        
        androidMain.dependencies {
            implementation("androidx.core:core-ktx:1.12.0")
        }
    }
}
```

### 3. Improved IDE Integration

- **IntelliJ IDEA**: Native support for Kotlin Toolchain projects
- **Android Studio**: Seamless AGP integration
- **VS Code**: Kotlin language server extension updated

### 4. Dependency Resolution

Unified dependency management across all platforms:
- Shared dependencies resolved once
- Platform-specific dependencies managed separately
- Version conflict detection across targets

---

## Architecture

### Compilation Pipeline

```
Source Code (.kt)
    │
    ▼
┌─────────────┐
│ Kotlin Tool │
│  Chain CLI  │
└─────┬───────┘
      │
      ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  JVM Target │     │ Android     │     │ iOS Target  │
│  (JVM Byte- │     │ (Dex/Jar)   │     │ (Native)    │
│   code)     │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
```

### Platform-Specific Outputs

| Target | Output Format | Runtime |
|--------|--------------|---------|
| JVM | `.jar` / `.class` | Java Virtual Machine |
| Android | `.dex` / `.aar` | Android Runtime (ART) |
| iOS (arm64) | `.framework` | Apple Silicon |
| iOS (simulator) | `.framework` | x86_64 Simulator |
| JavaScript | `.js` | Node.js / Browser |
| Native (Linux) | ELF binary | Linux |

---

## Migration Guide

### From Gradle Kotlin DSL

Old Gradle Kotlin DSL:
```kotlin
plugins {
    kotlin("multiplatform") version "2.0.0"
}

kotlin {
    jvm()
    iosArm64()
}
```

New Kotlin Toolchain:
```kotlin
// build.kts (auto-detected by Kotlin Toolchain)
toolchain {
    targets {
        jvm()
        iosArm64()
    }
}
```

### From Maven

Old Maven:
```xml
<plugin>
    <groupId>org.jetbrains.kotlin</groupId>
    <artifactId>kotlin-maven-plugin</artifactId>
    <version>2.0.0</version>
</plugin>
```

New Kotlin Toolchain:
```bash
# Convert Maven project
kotlinc migrate --from maven
```

---

## Use Cases

### 1. Shared Business Logic

Write business logic once, deploy everywhere:

```kotlin
// shared/src/commonMain/kotlin/com/example/Domain.kt
interface Repository<T> {
    suspend fun get(id: String): T?
    suspend fun save(item: T)
}

class UserRepository(
    private val dataSource: UserDataSource
) : Repository<User> {
    override suspend fun get(id: String): User? = dataSource.getUser(id)
    override suspend fun save(item: User) = dataSource.saveUser(item)
}
```

### 2. Platform-Specific UI

Keep UI native to each platform:

```kotlin
// androidApp/src/main/kotlin/MainActivity.kt
class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val repository = UserRepository(AndroidUserDataSource(this))
        // Android-specific UI code
    }
}

// iosApp/iOSApp/ContentView.swift
struct ContentView: View {
    var body: some View {
        // iOS-specific UI code
        Text("Hello from iOS")
    }
}
```

### 3. Testing

Write tests once for shared code:

```kotlin
// shared/src/commonTest/kotlin/UserRepositoryTest.kt
@Test
fun `test user repository get`() = runTest {
    val mockDataSource = mockk<UserDataSource>()
    val repository = UserRepository(mockDataSource)
    
    every { mockDataSource.getUser("123") } returns User(id = "123", name = "Test")
    
    val user = repository.get("123")
    assertEquals("Test", user?.name)
}
```

---

## Benefits

1. **Single configuration**: One build file for all platforms
2. **Consistent tooling**: Same CLI commands across targets
3. **Easier onboarding**: New developers use one tool, not many
4. **Better dependency management**: Unified resolution prevents conflicts
5. **Simplified CI/CD**: Single build pipeline for all platforms
6. **Improved documentation**: One source of truth for Kotlin development

---

## Limitations

- **Early stage**: Version 0.11.0 is still pre-1.0
- **Gradle ecosystem**: Some Gradle plugins may not be compatible yet
- **Learning curve**: Teams familiar with Gradle need to adapt
- **Limited plugin support**: Kotlin Toolchain plugin ecosystem is growing

---

## References

- [Original Article](https://jetbrains.developpez.com/actu/384657/JetBrains-annonce-que-Amper-0-11-0-est-disponible-et-devient-Kotlin-Toolchain-un-point-d-entree-unifie-vers-Kotlin-permettant-de-developper-des-applications-JVM-Android-iOS-multiplateformes/)
- [Kotlin Multiplatform Documentation](https://kotlinlang.org/docs/multiplatform.html)
- [JetBrains Blog](https://blog.jetbrains.com/)
