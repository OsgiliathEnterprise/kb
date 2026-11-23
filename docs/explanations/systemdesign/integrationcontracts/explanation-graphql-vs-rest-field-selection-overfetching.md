---
title: 'GraphQL vs REST: Field Selection, Over-Fetching, and Null Propagation'
diataxis: Explanation
domain: system-design
topic: Integration-Contracts
source: DEV.to Tech News
source_url: https://dev.to/systemdesignsimple/graphql-vs-rest-over-fetching-and-asking-for-fields-14og
date: 2026-11-23
keywords:
- knowledge-base
- Integration-Contracts
- system-design
- explanations
---
# GraphQL vs REST: Field Selection, Over-Fetching, and Null Propagation

Over-fetching is the classic GraphQL-vs-REST comparison: a fixed REST response can send whole posts (bodies included) to a profile card that shows one name and three titles. This note works through a seeded lab that quantifies the gap — and shows how narrow it gets once REST is allowed to trim too.

## The lab: one profile card, three ways

100 seeded users, 12–40 posts each, bodies 150–400 words, 500 runs (seed 49, Node 22, in-process — no network/TLS/compression modeled):

| Method | Requests | Median response bytes |
|---|---|---|
| Plain REST, full objects (page size 10) | 2 | 21,404 |
| REST with `?fields=` parameter + `limit=3` | 2 | **227** |
| GraphQL, one query | 1 | 219 |

Two REST requests ≠ two waits: when the user id is already known both calls go out concurrently (~60.2 ms vs 60.3 ms for GraphQL in their 60 ms RTT / 10 Mbps model). REST pays the second round trip only when the second call depends on the first. **Sparse fieldsets close ~99% of the byte gap** — the practical difference between the last two rows is 8 bytes.

## How GraphQL field selection works

Validation first: every selected field is checked against the schema, so a nonexistent field fails before any code runs. Then resolvers fill the response — the result has the *same shape as the query*. Caveat: selection trims the **response**, not the **database read** — a resolver that loads the full row and returns `title` still reads the whole row unless written to load less.

```js
// graphql-js 16
const schema = buildSchema(`
  type Post { title: String! body: String! }
  type User { name: String! email: String bio: String latestPosts(first: Int!): [Post!]! }
  type Query { user(id: ID!): User }
`);
const source = '{ user(id: 42) { name latestPosts(first: 3) { title } } }';
// → {"data":{"user":{"name":"Your friend","latestPosts":[{"title":"Trip photos"},...]}}}
```

## Nullability decides how far one failure spreads

When a resolver throws, the field becomes `null` and an entry lands in `errors`; if the field is non-null (`!`), the null **moves up to the nearest nullable parent**. In the schema above, `title: String!` failing on one post → post becomes null → not allowed in `[Post!]!` → `latestPosts` not allowed to be null → first nullable field is `Query.user` → response becomes `{"data":{"user":null}}` and the card loses even the name it *could* have shown. Mark fields non-null only where the data truly guarantees it, and always handle both `data` and `errors` client-side.

## REST can trim too

JSON:API §8.4 Sparse Fieldsets: a client MAY request `fields[TYPE]`; a server receiving it MUST NOT include other fields of that type. Field selection is optional for REST servers, mandatory per query in GraphQL.

## Choosing

| Option | Good for | Costs you |
|---|---|---|
| REST, fixed responses | Simple, URL-cacheable | Extra bytes / extra calls when screens differ |
| REST + fields parameter | Trimmed responses, keep URL caching | Server implements it per resource |
| GraphQL | Many clients/screens selecting nested slices of connected data | Schema, resolver batching, depth/cost limits, normalized client cache (needs globally unique ids; POST-to-one-URL breaks CDN caching — persisted queries restore stable cache keys) |

For one or two clients with stable screens: add a fields parameter + page limit to REST and keep plain URL caching. GraphQL pays off with many clients pulling different slices of the same connected graph. For service-to-service calls that need deadlines more than flexible fields, gRPC is often the better fit.

## References

- [GraphQL vs REST: over-fetching and asking for fields (DEV.to)](https://dev.to/systemdesignsimple/graphql-vs-rest-over-fetching-and-asking-for-fields-14og)
- [JSON:API §8.4 Sparse Fieldsets](https://jsonapi.org/format/#fetching-sparse-fieldsets)
- [GraphQL.org — Queries](https://graphql.org/learn/queries/)
- [Meta Engineering: GraphQL — A data query language (2015)](https://engineering.fb.com/2015-09-14/core-infra/graphql-a-data-query-language/)
- Related in KB: Choose REST, RPC, GraphQL or WebSocket
