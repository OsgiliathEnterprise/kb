---
title: 'Netflix Model Lifecycle Graph: Democratizing ML at Scale'
diataxis: Reference
domain: AI & Machine Learning
topic: ML Ops
source: https://netflixtechblog.com/democratizing-machine-learning-at-netflix-building-the-model-lifecycle-graph-5cc6d5828bb1
---
# Netflix Model Lifecycle Graph: Democratizing ML at Scale

## The Problem

As Netflix's ML investments scaled beyond personalization into Studio, Payments, and Ads, the ecosystem became fragmented. Each domain operates with distinct tech stacks, metrics, and organizational structures.

### Pain Points

- **Discovery:** Practitioners couldn't find available features or data sources
- **Lineage:** Tracking which pipelines generate data for specific models required jumping between systems
- **Impact:** Determining which A/B tests use a model, or which models break if a feature changes, was nearly impossible
- **Fragmentation:** Model registry, pipeline orchestrator, experimentation platform, feature store, dataset platform, and identity platform all operated independently

## Solution: Metadata Service (MDS)

Builds a **Model Lifecycle Graph** that indexes, connects, and unifies ML-related entities across Netflix.

## Core Abstractions

- **Component:** Any uniquely addressable object using AIP URI: `aip://<componentType>/<platformId>/<resourceId>`
- **Entity:** Component with properties (name, description, creation date, owners)
- **Entity Type:** Group of entities sharing same data shape/property constraints
- **Domain:** Functional grouping of related entity types (e.g., Models domain, Pipelines domain)
- **Provider:** Concrete implementation of a domain backed by specific source system

## Architecture: Five Stages

### 1. Event Ingestion
- Integrates via Kafka and AWS SNS/SQS
- Source systems emit **thin events** (identifier + event type only)
- Handlers for: Pipeline Orchestration, Model Registry, Feature Store, Experimentation, Datasets, Identity

### 2. Entity Enrichment (Hydration Contract)
When event arrives, MDS:
1. Validates event schema
2. Calls source system API to fetch complete current state
3. Transforms response into normalized entity

**Key design:** Events act as *notifications of change*, not logs. MDS always reconciles to latest state from source of truth.

### 3. Data Transformation & Normalization
- Heterogeneous raw events -> unified entity model
- Platform-specific IDs -> global AIP URIs
- Emails -> resolved user URIs
- Labels -> standardized tags
- Foreign keys -> entity references

### 4. Storage & Indexing
- **Datomic (Graph & Relationships):** System of record. Immutable fact model enables continuous relationship addition without losing original state
- **Elasticsearch (Discovery & Search):** Fast full-text search. Single unified index for all entity types

### 5. Knowledge Enrichment & Graph Formation
- Scheduled background jobs scan for uncached/partially resolved entities
- Hydrate relationships, materialize edges in Datomic, trigger ES re-indexing
- **Asynchronous design:** Prevents blocking real-time ingestion, enables retry logic

## Query Capabilities

- Lineage tracing (training data -> production experiments)
- Impact analysis (downstream models affected by feature changes)
- Usage discovery (A/B tests consuming a model)
- Dependency mapping & deprecation planning

## Before vs After

**Before:** Check Model Registry -> Find producing pipeline -> Check Orchestrator for A/B tags -> Query Experimentation Platform
**After:** Single graph query resolves entire chain

## Key Insights

1. **Metadata as Infrastructure:** Treating metadata as first-class infrastructure enables cross-domain ML collaboration
2. **Event-Driven Architecture:** Thin events + hydration pattern keeps source systems simple while maintaining rich graph
3. **Asynchronous Enrichment:** Background jobs enable gradual graph completion without blocking ingestion
4. **Unified Query Interface:** Single graph query replaces manual cross-tool lookups

## Architecture Diagram

```
[Source Systems] -> [Kafka/SNS] -> [Event Ingestion] -> [Entity Enrichment] -> [Datomic Graph]
                                                                        -> [Elasticsearch]
                                                                        -> [AIP Portal]
```

## Lessons for Enterprise ML

- Fragmentation is inevitable as ML scales across domains
- Metadata service unifies without replacing existing tools
- Graph-based approach enables discovery, lineage, and impact analysis
- Asynchronous design prevents blocking while maintaining freshness
