---
title: The Best Way to Clean Up Test Data with Spring and Hibernate
diataxis: How-to Guide
domain: Programming
topic: Java & Spring
source: VladMihalcea
source_url: https://vladmihalcea.com/clean-up-test-data-spring/
date: 2026-05-17
keywords:
- knowledge-base
- Java & Spring
- Programming
- how-to
---
# The Best Way to Clean Up Test Data with Spring and Hibernate

## Summary
The best way to clean up test data when using Spring and Hibernate. While it's very common to use `@Transactional` for test isolation, this approach has limitations — particularly when testing code that spawns new threads or uses `@Async`. This article covers robust test data cleanup strategies.

## Why This Matters
Test data cleanup is critical for test isolation and reliability. The common `@Transactional` approach rolls back all changes after each test, but fails when tested code uses separate transactions, async processing, or external services.

## Key Points
- `@Transactional` on test methods rolls back changes but doesn't work with async/threaded code
- Alternative strategies: explicit cleanup, database cleaning frameworks, testcontainers with fresh databases
- Hibernate session management affects test data visibility
- Proper cleanup prevents test flakiness and cross-test data contamination

## How to Clean Up Test Data

### Strategy 1: @Transactional (Simple Cases)
```java
@SpringBootTest
@Transactional  // Rolls back after each test
class MyServiceTest {
    // All database changes are automatically rolled back
}
```
**Limitation**: Doesn't work with `@Async`, `@Schedule`, or code that opens new transactions.

### Strategy 2: Explicit Cleanup with @AfterEach
```java
@SpringBootTest
class MyServiceTest {
    @Autowired
    private UserRepository userRepository;
    
    @AfterEach
    void cleanup() {
        userRepository.deleteAll();
    }
}
```

### Strategy 3: Database Cleaner Framework
```java
// Add dependency: com.github.database-rider:rider-core
@SpringBootTest
@DBUnit(cleanTables = true)  // Cleans tables after each test
class MyServiceTest {
    // Database is automatically cleaned
}
```

### Strategy 4: Testcontainers with Fresh Databases
```java
@SpringBootTest
@Testcontainers
class MyServiceTest {
    @Container
    static MySQLContainer<?> mysql = new MySQLContainer<>("mysql:8.0");
    
    // Each test run gets a fresh database
}
```

## Common Pitfalls
- **@Transactional with async code**: Changes made in async threads are NOT rolled back — use explicit cleanup
- **Hibernate session cache**: Even after database cleanup, Hibernate session may hold stale entities — clear session between tests
- **Shared test data**: Static `@BeforeAll` data persists across tests — clean it explicitly
- **Foreign key constraints**: Delete child entities before parent entities, or use `DELETE CASCADE`

## Related Topics
- [[tutorial-replace-deprecated-genericgenerator|Replace Deprecated @GenericGenerator]]

## References
- 📰 Original: [The best way to clean up test data with Spring and Hibernate](https://vladmihalcea.com/clean-up-test-data-spring/) via VladMihalcea (2026-05-17)
