---
title: 'Java Sealed Classes and Exhaustive Pattern Matching: The Breaking-Change Trap'
diataxis: Explanation
domain: programming
topic: java
source: neilmadden.blog
source_url: https://neilmadden.blog/2026/04/24/java-sealed-classes-and-exhaustive-pattern-matching/
date: 2026-10-19
keywords:
- knowledge-base
- java
- programming
- explanations
---
# Java Sealed Classes and Exhaustive Pattern Matching: The Breaking-Change Trap

Java 17 ([JEP 409](https://openjdk.org/jeps/409)) introduced **sealed types**, which let you explicitly list the allowed subtypes of an interface or base class. If you know functional programming languages with algebraic datatypes, view a sealed interface as the Java equivalent of a datatype declaration:

```java
public sealed interface SealedType {
    record TypeA() implements SealedType {}
    record TypeB() implements SealedType {}

    static SealedType of(String type) {
        return switch (type) {
            case "A" -> new TypeA();
            case "B" -> new TypeB();
            default -> throw new IllegalArgumentException();
        };
    }
}
```

(Haskell/ML equivalent: `data SealedType = TypeA | TypeB`. Inner classes are implicitly added to the permitted subtypes if no explicit list is given.)

## Exhaustiveness checking: the default clause disappears

Because the compiler knows exactly what the possible cases are, it can check that a switch covers them all:

```java
void main(String[] args) {
    var val = SealedType.of(args[0]);
    System.out.println(switch (val) {
        case SealedType.TypeA() -> "A";
        case SealedType.TypeB() -> "B";
        // no default clause needed
    });
}
```

If you have covered all cases, you **don't need a `default` clause**. If you forget one (and have no `default`), you get a **compile-time error**. That's the win: every use site of the type is forced to cover every case.

## The trap: a new kind of breaking change

The catch is that exhaustiveness checking turns *adding a case* into a breaking change for every consumer. Add `TypeC` to the sealed type and every consumer's exhaustive switch suddenly fails to compile. If you **export** a sealed type in your API, adding a new subtype is a **major version bump under SemVer** — the opposite of the usual Java story where adding to an enum/interface is safe.

## Compile-time or runtime error?

Here's the subtlety the article drills into. The compile-time error only happens **when you compile the consumer**. If the consumer is not recompiled when the sealed type changes, you get a **runtime exception** instead:

```java
// SealedType now has TypeC; only SealedType.java was recompiled, Main was not
% java Main C
Exception in thread "main" java.lang.MatchException
        at Main.main(Main.java:3)
```

`java.lang.MatchException` (introduced with pattern matching in Java 21) is thrown when a switch over a sealed type encounters a case it wasn't compiled to handle. The [Javadoc](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/MatchException.html) notes this separate-compilation issue, along with corner-cases around `null` in patterns. So the "static guarantee" of sealed types **evaporates the moment compilation units are decoupled** — exactly the situation across module boundaries.

## The practical conclusion

Sealed types are **most useful within the implementation of a component**, where you typically recompile everything together and get the nice exhaustiveness guarantees with real compile-time safety. They are **less useful when exposed in a public API** offered to other components: across module boundaries you may just be introducing new ways to break code, often detectable only at runtime.

A real-world case the author flagged while reviewing [JEP 524](https://openjdk.org/jeps/524) (preview support for PEM-encoded cryptographic objects): it bakes a sealed interface into a public API and recommends clients pattern-match against it — a very high chance of breakage if a new case is ever added.

## Guidance

1. **Inside a module**: sealed types + exhaustive switches are a great fit — you control the recompile boundary, so the compile-time guarantee holds.
2. **In a public API**: either keep the sealed set *frozen* (never add cases — treat it as a closed union you version deliberately) or prefer an open interface, so adding types stays non-breaking.
3. **Never assume** exhaustiveness checking protects downstream consumers you don't control — separate compilation downgrades the guarantee to a `MatchException` at runtime.
4. **Review JEPs** that push sealed types into public APIs: each new case is now a SemVer-major event for every downstream exhaustive switch.

Related: How to rewrite instanceof chains as pattern-matching switches — the everyday refactoring this note builds on; Simulating pattern matching with lambda case handlers — for targets before pattern matching is available.

## Diagram

[explanation-java-sealed-classes-exhaustive-pattern-matching.excalidraw](explanation-java-sealed-classes-exhaustive-pattern-matching.svg) — sealed type → exhaustive checking, and the recompiled-vs-not decision that turns a compile error into a runtime `MatchException`.

## References

- [Java sealed classes and exhaustive pattern matching](https://neilmadden.blog/2026/04/24/java-sealed-classes-and-exhaustive-pattern-matching/) — Neil Madden, Apr 24, 2026
- [JEP 409: Sealed Classes and Interfaces](https://openjdk.org/jeps/409)
- [JEP 524: PEM-Encoded Cryptographic Objects (preview)](https://openjdk.org/jeps/524)
- [java.lang.MatchException (Javadoc)](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/MatchException.html)

## Further Reading (added 2026-10-19 by KB Zookeeper audit)

- [Sealed Classes and Exhaustive Pattern Matching: How They Change API Design, Not Just Syntax - Java Code Geeks](https://www.javacodegeeks.com/2026/04/sealed-classes-and-exhaustive-pattern-matching-how-they-change-api-design-not-just-syntax.html) — Sealed classes and exhaustive pattern matching are stable in Java 17 and 21. Most articles show the syntax.
- [🚀 Mastering Sealed Classes & Switch Pattern Matching in Java: Write Safer, Smarter Code!](https://medium.com/@masha.komarkofffa/mastering-sealed-classes-switch-pattern-matching-in-java-write-safer-smarter-code-8700e69a3f6f) — 🚀 Mastering Sealed Classes & Switch Pattern Matching in Java Introduction 🚀 Java 17 introduced sealed classes, and now, with enhanced switch pattern matching…
- [Java sealed classes: permits, non-sealed and pattern matching](https://www.theserverside.com/tip/Use-sealed-classes-in-Java-to-control-your-inheritance) — Learn how Java sealed classes control inheritance with sealed, permits, final and non-sealed, and how closed hierarchies enable exhaustive pattern mat
