---
title: How to Run Spring Batch Jobs with a MongoDB Job Repository (Spring Boot 4.1)
diataxis: How-to Guide
domain: programming
topic: java
source: Spring Blog
source_url: https://spring.io/blog/2026-06-21/spring-boot-41-and-spring-batch
date: 2026-09-06
keywords:
- knowledge-base
- java
- programming
- how-to
---
# How to Run Spring Batch Jobs with a MongoDB Job Repository (Spring Boot 4.1)

Spring Batch was designed assuming a SQL database for job state. Recent Spring Batch versions decoupled the `JobRepository` from JDBC, and **Spring Boot 4.1 ships first-class autoconfiguration** (`spring-boot-starter-batch-data-mongodb`) so document-store users get the same zero-config experience JDBC users always had — no more keeping a relational database around just to store batch metadata.

This note walks through a complete example: Batch state in **MongoDB**, data read from `customers.csv`, written into a PostgreSQL `customers` table, all services launched by a `compose.yaml`.

## Goal

- Store the Spring Batch `JobRepository` in MongoDB via the new 4.1 starter.
- Read `customers.csv` from the classpath; write rows to a PostgreSQL `customers` table.
- Run everything against services defined in `compose.yaml` at the project root.

## Step 1 — Bring up the infrastructure with compose

The `compose.yaml` starts:

- **MongoDB as a single-node replica set** — Batch's MongoDB support needs transactions, and transactions need a replica set (a plain standalone mongod is not enough).
- **PostgreSQL** for the destination table.
- Optionally a **Grafana LGTM** container for observability later.

## Step 2 — Configure Spring Boot

```properties
# application.properties
spring.mongodb.host=localhost
spring.mongodb.port=27017
spring.mongodb.database=mydatabase
spring.batch.data.mongodb.schema.initialize=true

spring.datasource.url=jdbc:postgresql://localhost/mydatabase
spring.datasource.username=myuser
spring.datasource.password=secret
```

Key details:

- `spring.batch.data.mongodb.schema.initialize=true` tells the new starter to create the collections (and indexes) the `JobRepository` needs — the MongoDB equivalent of what JDBC autoconfiguration has done for SQL users.
- Spring Boot's SQL init (`spring.sql.init.mode=always`) runs the Postgres schema on startup, so the destination table is self-serve too.

## Step 3 — Define the job (two steps in sequence)

```java
@Bean
Job job(@Qualifier(STEP_RESET) Step stepReset, @Qualifier(STEP_FILES_TO_DB) Step stepFilesToDb) {
    return new JobBuilder("etl", this.repository)
        .start(stepReset)
        .next(stepFilesToDb)
        .incrementer(new RunIdIncrementer())
        .build();
}
```

- **`reset`** — a `Tasklet` (single chunk of work, no item read/write) that wipes the destination table so reruns start from a clean slate. Tasklets are the right tool for "just do one thing between steps".
- **`files-to-db`** — the chunked step: reader → processor → writer.
- **`RunIdIncrementer`** bumps a `run.id` parameter on each launch so Spring Batch treats every invocation as a *new job instance* instead of refusing to re-run a "completed" one. Small detail, big difference for repeatable ETL jobs.

## Step 4 — Build the chunk pipeline (reader → processor → writer)

Reader pulls rows out of `customers.csv`:

```java
@Bean
FlatFileItemReader<Customer> customerReader(@Value("classpath:customers.csv") Resource csv) {
    return new FlatFileItemReaderBuilder<Customer>()
        .name("customer-reader")
        .resource(csv)
        .delimited(c -> c.delimiter(",").names("id", "name", "email"))
        .fieldSetMapper(fs -> new Customer(
            fs.readInt("id"),
            fs.readString("name"),
            fs.readString("email")))
        .build();
}
```

Writer pushes each chunk into Postgres with `ON CONFLICT DO NOTHING` so reruns don't blow up on primary-key collisions:

```java
@Bean
JdbcBatchItemWriter<Customer> customerJdbcBatchItemWriter(DataSource dataSource) {
    return new JdbcBatchItemWriterBuilder<Customer>()
        .assertUpdates(true)
        .dataSource(dataSource)
        .sql("INSERT INTO customers(id, name, email) VALUES (:id, :name, :email) on conflict do nothing")
        .beanMapped()
        .itemPreparedStatementSetter((item, ps) -> {
            ps.setInt(1, item.id());
            ps.setString(2, item.name());
            ps.setString(3, item.email());
        })
        .build();
}
```

The step ties them together with a tiny pass-through processor (a natural place to add transformation/enrichment later) and a **chunk size of 10**. Fault tolerance is one line: `faultTolerant()` plus a retry policy — Spring Batch retries items that throw `IllegalArgumentException` up to ten times before failing the chunk, and the framework does all the bookkeeping. That bookkeeping is precisely what now lives in MongoDB.

## Step 5 — Run and verify

Launch the app; the job runs: `reset` clears Postgres, `files-to-db` streams the CSV through the chunk pipeline into Postgres. Every step transition, item count, exit status, and execution timestamp lands in **MongoDB** — open `mongosh` and you'll see the familiar Batch collections (`BATCH_JOB_INSTANCE`, `BATCH_JOB_EXECUTION`, `BATCH_STEP_EXECUTION`) as documents instead of tables.

## Bonus: lazy DataSource connections (new in 4.1)

By default Spring Boot initializes the DataSource and creates a connection whenever a transaction starts, even if you may never use it. The new property avoids that penalty:

```properties
spring.datasource.connection-fetch=lazy
```

## Why this matters

The historical coupling between Spring Batch and a relational database was always a pragmatic compromise, not a design ideal — the framework needs somewhere durable to remember what it did, and SQL was the path of least resistance. With `JobRepository` properly decoupled and Boot 4.1 shipping first-class MongoDB autoconfiguration, teams running on document stores no longer need a JDBC database just for the batch tier.

## Related notes

- [Performance Improvements in JDK 26](../../../explanations/programming/java/explanation-jdk-26-performance-improvements.md)
- [ZGC: A Decade of Redefining Java Performance](../../../explanations/programming/java/explanation-zgc-decade-of-low-latency-gc.md)

## References

- [MongoDB-backed Spring Batch jobs and more in Spring Boot 4.1 (Spring Blog)](https://spring.io/blog/2026-06-21/spring-boot-41-and-spring-batch)
- [Spring Batch :: Spring Boot reference documentation](https://docs.spring.io/spring-boot/4.1/reference/io/spring-batch.html)
