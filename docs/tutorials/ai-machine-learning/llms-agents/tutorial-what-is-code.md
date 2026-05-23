---
title: What Is Code? (Unmesh Joshi, Thoughtworks)
diataxis: Tutorial
domain: AI & Machine Learning
topic: LLMs & Agents
source: MartinFowler
source_url: https://martinfowler.com/articles/what-is-code.html
date: 2026-05-18
keywords:
- knowledge-base
- LLMs & Agents
- AI & Machine Learning
- tutorials
---
# What Is Code? (Unmesh Joshi, Thoughtworks)

## Summary
As LLMs commoditize code generation, Unmesh Joshi (Distinguished Engineer at Thoughtworks) argues that the enduring value of code lies not in its role as machine instructions, but as a **conceptual model of the problem domain**. The mechanical act of writing instructions is declining in centrality; explicit conceptual modeling and vocabulary discovery are rising in importance.

## Why This Matters
With AI coding assistants generating code at unprecedented speed, teams risk accumulating **cognitive debt** — when LLMs generate plausible, compiling code faster than the team builds understanding of the underlying conceptual model. This article provides a framework for understanding what actually remains valuable about code in the AI era.

## Two Aspects of Code

### 1. Instructions to a Machine (Being Commoditized)
Code directs computation, data movement, storage, and execution. LLMs excel at this — generating syntactically correct, functionally working code from natural language prompts.

### 2. Conceptual Model of the Problem Domain (Enduring Value)
The "design" aspect containing concepts, boundaries, and relationships for humans and tools to reason with. This is where the real work happens.

> "The activity we call coding is where these two aspects meet. We are shaping the concepts, names, boundaries, and relationships through which the system is understood."

## Key Concepts

### Vocabulary & Conceptual Modeling
- Code makes conceptual models explicit through **shared domain vocabulary**
- Software development operates at the intersection of **business domains** (retail, finance, healthcare) and **technical domains** (web, infrastructure, AI)
- Coding is fundamentally an **act of translation**: Concepts → types, relationships → interfaces, rules → invariants, workflows → compositions
- Frameworks and libraries are **codified vocabularies** that capture common usage patterns
- Right abstractions are rarely obvious upfront; they emerge through iterative refactoring

### Bounded Contexts & Local Vocabularies
- Universal high-level frameworks fail for complex business domains because vocabulary isn't stable across instances
- **Bounded Contexts (DDD):** Define explicit boundaries where a specific vocabulary and model are valid
- **Discovery Requires Collaboration:** Close, continuous work between developers, domain experts, and users is mandatory
- **Agile & TDD:** Provide iterative feedback loops to discover/refine vocabulary
- **Ubiquitous Language:** Formalizes a shared, continuously tested vocabulary against working software

### Programming Languages as Thinking Tools
- Active coding is essential for deep thinking; passive review of generated code is insufficient
- Language constraints actively shape architectural reasoning (e.g., Go's channels, Java's OOP, Rust's ownership)
- When syntax becomes too verbose, **pseudo-formal specifications** clarify thinking and serve as implementation/test foundations

### Cognitive Debt
- Accumulates when LLMs generate plausible, compiling code faster than the team builds understanding
- The problem is not that the LLM generated code — the problem is that the code introduced vocabulary faster than the developers built understanding

### Code as Context/Harness for LLMs
- Well-structured code with clear semantics **is** the primary context/harness for LLMs
- Reduces prompt dependency, prevents model lock-in, and ensures reliable output regardless of the underlying LLM
- Executable code, tests, types, and invariants act as **guardrails** that constrain LLMs and fix mistakes

## Procedure / How-To: Managing Cognitive Debt in AI-Assisted Development

1. **Establish Domain Vocabulary First**
   - Before generating code, collaboratively define the domain vocabulary with domain experts
   - Create a shared glossary of terms, their meanings, and their relationships
   - Use DDD techniques (Event Storming, Domain Storytelling) to discover bounded contexts

2. **Design Abstractions Before Generation**
   - Define types, interfaces, and invariants before asking LLMs to generate code
   - Use pseudo-formal specifications for complex logic
   - Establish naming conventions that reflect domain vocabulary

3. **Iterative Code Review with Understanding**
   - Don't just check if code compiles — check if vocabulary aligns with domain model
   - Review generated code for consistency with established abstractions
   - Use TDD to validate that generated code meets domain expectations

4. **Build a Strong Abstraction Layer**
   - Invest in framework/library design that captures domain vocabulary
   - Create external DSLs where natural language maps well to domain operations
   - Maintain tests and invariants that constrain LLM output

## Key Configuration / Commands
```text
# Pseudo-formal specification example (from the article):
Begin(T, coord):
  R(T) := HLC(coord).now()
  writeSet(T) := {}

Read(T, N, key):
    N.HLC.tick(R(T))
    return latest committed version of key with ts <= R(T)

Write(T, N, key, value):
    N.HLC.tick(R(T))
    if LatestCommittedVersion(key).ts > R(T):
        abort T
    place provisional intent for (key, value)
    writeSet(T) := writeSet(T) union {key}
```

## Common Pitfalls
- **Speed without understanding:** Generating code faster than the team can build domain knowledge creates cognitive debt
- **Vague prompts:** Inconsistent vocabulary in prompts forces the model to guess, producing unreliable output
- **Passive code review:** Reviewing generated code without active coding doesn't build the conceptual understanding needed
- **Skipping abstraction design:** Jumping straight to code generation without defining types, interfaces, and invariants

## Related Topics
- [[structured-prompt-driven-development-spdd|Structured-Prompt-Driven Development (SPDD)]]
- [[tutorial-interrogatory-llm|Bliki: Interrogatory LLM]]

## References
- 📰 [What Is Code?](https://martinfowler.com/articles/what-is-code.html) via MartinFowler (May 12, 2026)
- 🔍 [AWS Automated Reasoning Explained](https://aws.amazon.com/what-is/automated-reasoning/)
- 🔍 [Formal Reasoning Meets LLMs - ACM CACM](https://cacm.acm.org/research/formal-reasoning-meets-llms-toward-ai-for-mathematics-and-verification/)
