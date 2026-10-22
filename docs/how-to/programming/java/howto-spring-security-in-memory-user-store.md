---
title: How to Declare an In-Memory User Store with InMemoryUserDetailsManager
diataxis: How-to Guide
domain: programming
topic: java
source: ''
---
---
created: 2026-09-17
type: howto
title: "How to Declare an In-Memory User Store with InMemoryUserDetailsManager"
domain: programming
topic: java/Spring-Boot
source: "Ebook: Spring in Action, Sixth Edition by Craig Walls"
source_book_id: calibrebook_398
source_chapter: "Chapter 5: Securing Spring (5.2.1)"
tags: [java, spring-boot, spring-security, user-details-service, in-memory]
visibility: private
ai_tool_candidate: true

concise: true---

# How to Declare an In-Memory User Store with InMemoryUserDetailsManager

For a handful of static users (tests, demos), declare them directly in the security configuration as an `InMemoryUserDetailsManager` bean — no database, no user table.

## Input parameters
- List of users: username + password + authorities per user
- A `PasswordEncoder` bean (see related note on encoder selection)

## Procedure
1. Build a list of Spring Security `User` objects (username, **encoded** password, authority list):
   ```java
   @Bean
   public UserDetailsService userDetailsService(PasswordEncoder encoder) {
     List<UserDetails> usersList = new ArrayList<>();
     usersList.add(new User("buzz", encoder.encode("password"),
         Arrays.asList(new SimpleGrantedAuthority("ROLE_USER"))));
     usersList.add(new User("woody", encoder.encode("password"),
         Arrays.asList(new SimpleGrantedAuthority("ROLE_USER"))));
     return new InMemoryUserDetailsManager(usersList);
   }
   ```
2. Note the password is passed through `encoder.encode(...)` at bean-creation time — never store raw passwords in code.

## Error handling / gotchas
- **Rebuild required for user changes**: adding/removing/editing a user means editing Java, recompiling, redeploying. Use this only when users are truly static; otherwise back the `UserDetailsService` with a repository (see related tutorial note).
- The bean must implement/return `org.springframework.security.core.userdetails.UserDetails` — do not confuse Spring Security's `User` class with your own domain `User` entity (same simple name, different packages: `org.springframework.security.core.userdetails.User`).

## Verification
- Log in as `buzz` or `woody` with password `password` → authenticated.
- Unknown username → login failure (`UsernameNotFoundException` path).
