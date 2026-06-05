---
title: The Best Way to Replace the Deprecated @GenericGenerator
diataxis: Tutorial
domain: Programming
topic: Java & Spring
source: VladMihalcea
source_url: https://vladmihalcea.com/replace-deprecated-genericgenerator/
date: 2026-05-17
keywords:
- knowledge-base
- Java & Spring
- Programming
- tutorials
---
# The Best Way to Replace the Deprecated @GenericGenerator

## Summary
The best way to replace the deprecated `@GenericGenerator` annotation when upgrading your application to Hibernate 7. The `@GenericGenerator` was a Hibernate-specific annotation for custom identifier generation that has been deprecated in favor of JPA-standard alternatives.

## Why This Matters
If you're migrating to Hibernate 7 or Jakarta Persistence, `@GenericGenerator` will cause compilation warnings or errors. Understanding the replacement patterns ensures smooth upgrades without identifier generation bugs.

## Key Points
- `@GenericGenerator` is deprecated in Hibernate 7
- JPA-standard `@GeneratedValue` with `@SequenceGenerator` or `@TableGenerator` are the replacements
- Custom identifier generators should implement `IdentifierGenerator` interface directly
- Migration requires reviewing all entity classes using `@GenericGenerator`

## How to Replace @GenericGenerator

### Strategy 1: Use @SequenceGenerator (Recommended for PostgreSQL/Oracle)
```java
// Before (deprecated)
@Entity
@GenericGenerator(name = "my-gen", strategy = "sequence",
    parameters = @Parameter(name = "sequence_name", value = "my_seq"))
public class MyEntity {
    @Id
    @GeneratedValue(generator = "my-gen")
    private Long id;
}

// After (JPA standard)
@Entity
public class MyEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "my-gen")
    @SequenceGenerator(name = "my-gen", sequenceName = "my_seq", allocationSize = 1)
    private Long id;
}
```

### Strategy 2: Use @TableGenerator (For databases without sequence support)
```java
@Entity
public class MyEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.TABLE, generator = "my-gen")
    @TableGenerator(name = "my-gen", table = "id_generators",
        pkColumnName = "gen_name", valueColumnName = "gen_value",
        allocationSize = 50)
    private Long id;
}
```

### Strategy 3: Custom Identifier Generator
```java
// Implement IdentifierGenerator directly
public class MyCustomGenerator implements IdentifierGenerator {
    @Override
    public Object generate(SharedSessionContractImplementor session, Object object) {
        // Custom generation logic
        return UUID.randomUUID().toString();
    }
}

// Register in Hibernate configuration
// hibernate.id.new_generator_mappings=true
```

## Common Pitfalls
- **allocationSize mismatch**: Default allocationSize is 50 — if your database sequence increments by 1, set `allocationSize = 1` or you'll get unique constraint violations
- **Mixed strategies**: Don't mix `@GenericGenerator` and `@SequenceGenerator` in the same entity — pick one approach
- **Existing sequences**: When migrating, ensure your database sequences are at the correct current value to avoid ID collisions

## Related Topics
- [[howto-clean-up-test-data-spring|Clean Up Test Data with Spring and Hibernate]]
- [[howto-mysql-query-optimization-releem|MySQL Query Optimization with Releem]]

## References
- 📰 Original: [The best way to replace the deprecated GenericGenerator](https://vladmihalcea.com/replace-deprecated-genericgenerator/) via VladMihalcea (2026-05-17)
