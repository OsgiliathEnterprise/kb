---
title: 'Spring Batch 6.1: @JobParameter, PageableItemReader, JSON Lines Marshalling,
  and the Breaking Changes'
diataxis: Explanation
domain: programming
topic: java
source: Spring Blog
source_url: https://spring.io/blog/2026/11/19/spring-batch-6-1-0-available-now
date: 2026-11-20
keywords:
- knowledge-base
- java
- programming
- explanations
---
# Spring Batch 6.1: What Changed and How to Migrate

Spring Batch 6.1 is GA on Maven Central (2026-11-19), on top of 6.0, with new features **and several source/binary breaking changes**. This note distills the release into what matters when upgrading. Baseline dependency upgrades: Spring Framework 7.1.0, Spring Integration 7.2.0, Spring Data 2026.1.0, Spring LDAP 4.2.0, Spring AMQP 4.2.0, Spring Kafka 4.2.0, Micrometer 1.18.0.

## API ergonomics

### `@JobParameter` replaces SpEL job-parameter injection

Injecting job parameters into job/step-scoped beans used to require `@Value("#{jobParameters['inputFile']}")` — runtime-evaluated SpEL, easy to typo. The new annotation defaults the parameter name to the annotated field/parameter name:

```java
@Bean
@StepScope
public FlatFileItemReader<Foo> fooReader(@JobParameter String inputFile) {
    return new FlatFileItemReaderBuilder<Foo>()
            .resource(new FileSystemResource(inputFile))
            .build();
}
```

Explicit name: `@JobParameter("input.file.name")`. When the name is omitted on a method/constructor parameter, compile with the `-parameters` flag (default in Spring Boot Maven/Gradle plugins). For job/step-scoped beans only.

### `PageableItemReader` — type-safe alternative to `RepositoryItemReader`

`RepositoryItemReader` invokes a repository method reflectively by name; `PageableItemReader` takes a function from Spring Data `Pageable` to `Slice`, checked at compile time:

```java
PageableItemReader<Customer> reader = new PageableItemReaderBuilder<Customer>()
        .query(customerRepository::findAll)
        .sort(Sort.by(Sort.Direction.ASC, Customer::getId))  // type-safe property ref
        .pageSize(100)
        .name("customerReader")
        .build();
```

Type-safe property references (`Customer::getId`) eliminate string-based property names entirely.

### Resource location patterns

`MultiResourceItemReaderBuilder` now accepts patterns directly (e.g. `"classpath:data/input/file-*.txt"`) — no pre-resolving and injecting resources; `ResourcesItemReaderBuilder` gets the same capability.

### MongoDB job repository collection prefix

Like the JDBC table prefix, enabling several apps on one MongoDB database or environment isolation:

```java
@EnableBatchProcessing
@EnableMongoJobRepository(collectionPrefix = "MY_APP_")
class MyJobConfiguration { }
```

Defaults to `BATCH_`, so existing applications are unaffected.

## JSON Lines without Jackson lock-in

`JsonLineMapper` previously mapped JSON Lines entries only to `Map<String, Object>` and only via Jackson. It is now generic, delegating to a `JsonObjectUnmarshaller` — map lines to any type (domain class, record), with Jackson and Gson implementations provided:

```java
record Trade(String isin, int quantity, double price, String customer) {}

FlatFileItemReader<Trade> reader = new FlatFileItemReaderBuilder<Trade>()
        .name("tradeReader")
        .resource(resource)
        .lineMapper(new JsonLineMapper<>(new JacksonJsonObjectUnmarshaller<>(Trade.class)))
        .build();
```

Writer-side counterpart, new in 6.1: `JsonLineAggregator` delegating to a `JsonObjectMarshaller` (Jackson/Gson) for `FlatFileItemWriter`.

## Restructuring and performance

- **Async processing moved to `spring-batch-core`**: `AsyncItemProcessor`, `AsyncItemWriter`, and `ChunkTaskExecutorItemWriter` now live in `org.springframework.batch.core.step.item`. You can use async item processing and local chunking *without* pulling in `spring-batch-integration` and its transitive dependencies (old classes remain as deprecated subclasses).
- **`RepositoryItemWriter` flushing**: flush the Spring Data repository after each chunk, either by naming a save-and-flush method (`saveAllAndFlush`) or overriding the new `flush` method in a subclass.
- **JDBC DAOs migrated to `JdbcClient`**; query reductions such as `JdbcJobExecutionDao#synchronizeStatus(StepExecution)` saving one query (some perf fixes are backported to 6.0.6).

## Breaking changes checklist (upgrade blockers)

1. **Mutually exclusive builder methods are compile-time-safe**: return types of some `FlatFileItemReaderBuilder`, `FlatFileItemWriterBuilder`, `JdbcBatchItemWriterBuilder` methods changed — source *and* binary incompatible.
2. **Avro requires trusted classes**: `AvroItemReader`/`AvroItemWriter` jobs with `SpecificRecord` or plain Java item types fail at runtime unless the item type is explicitly trusted.
3. **JDBC DAO no-arg constructors removed** (JdbcClient migration) — source and binary incompatible.
4. **`JsonLineMapper` raw type changed** — breaking only if you call `mapLine` directly on the raw type; code that just passes the mapper to a reader needs a recompile. The no-arg and `JsonMapper` constructors are deprecated for removal in 7.0.

## Deprecations

Apache Derby support, legacy date/time converters, the `spring-batch-integration` copies of the async classes, and several `JobRepository`/`JobExplorer`/`JobInstanceDao` count methods. Full list in the 6.1 "What's new" reference section.

## References

- [Spring Batch 6.1 is now GA! — Spring Blog](https://spring.io/blog/2026/11/19/spring-batch-6-1-0-available-now) (original announcement)
- [Release notes v6.1.0 — GitHub](https://github.com/spring-projects/spring-batch/releases/tag/v6.1.0)
- [What's new in 6.1 — reference documentation](https://docs.spring.io/spring-batch/reference/6.1/whatsnew.html)
