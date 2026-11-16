---
title: From Empty Folder to Live URL — Full-Stack App on AWS Fargate (Vue 3 + Express
  + DynamoDB)
diataxis: Tutorial
domain: cloud-infrastructure
topic: aws
source: DEV.to Tech News
source_url: https://dev.to/aws-builders/from-empty-folder-to-live-url-a-beginners-full-stack-app-on-aws-fargate-3e6g
date: 2026-08-30
keywords:
- knowledge-base
- aws
- cloud-infrastructure
- tutorials
---
# From Empty Folder to Live URL — Full-Stack App on AWS Fargate (Vue 3 + Express + DynamoDB)

A beginner-oriented walkthrough that builds a movies catalog all the way to a public URL: **Vue 3** frontend, **Express** REST API storing in **DynamoDB**, two Docker containers on **ECS Fargate** behind an ALB, everything defined in code with **AWS CDK** and tested with **Playwright**. Full source: [fargate-movies-api](https://github.com/kasukur/fargate-movies-api).

## The architecture in one diagram

```
Internet ──► ALB ──────┐  /api/* ──► Fargate: Express API ────┼──► DynamoDB
                        │  /*     ──► Fargate: Nginx + Vue files│
                        └───────────────────────────────────────┘
```

One front door (ALB), two containers, one table. The ALB routes by URL path; the API container gets an IAM role that says "may read/write exactly this DynamoDB table."

## Step 1 — Design the database before writing code

DynamoDB has no JOINs, so you design keys around *the questions your app asks*. Every item has a partition key `PK` (which bucket) and sort key `SK` (position in that bucket). All three resource types share **one table**, distinguished by key prefixes:

```
Movie     PK=MOVIE#123    SK=METADATA
Director  PK=DIRECTOR#456 SK=METADATA
Genre     PK=GENRE#789    SK=METADATA
```

"Browse all movies A→Z" can't be answered by those keys, so add a **secondary index** (GSI) — the same data re-sorted another way: `GSI1PK=ENTITY#MOVIE`, `GSI1SK=TITLE#inception`. Now "all movies A→Z" is one query on `ENTITY#MOVIE`, and search is that query plus a prefix match:

```ts
const result = await ddb.send(
  new QueryCommand({
    TableName: TABLE_NAME,
    IndexName: 'GSI1',
    KeyConditionExpression: 'GSI1PK = :pk AND begins_with(GSI1SK, :prefix)',
    ExpressionAttributeValues: {
      ':pk': 'ENTITY#MOVIE',
      ':prefix': `TITLE#${prefix.toLowerCase()}`,
    },
  }),
);
```

**The "a movie has many genres" problem.** No JOINs → write a tiny extra item per genre at creation (`PK=GENRE#789, SK=MOVIE#123`) so "movies in this genre" is a simple query on the genre's bucket. But one "add movie" now writes several items; if it dies halfway you get orphans. DynamoDB's answer is a **transaction** — all writes succeed together or none happen:

```ts
await ddb.send(
  new TransactWriteCommand({
    TransactItems: [
      { Put: { TableName, Item: movieItem,
              ConditionExpression: 'attribute_not_exists(PK)' } },
      ...genreIds.map((genreId) => ({
        Put: { TableName, Item: membershipItem(genreId, movieId) },
      })),
    ],
  }),
);
```

Lesson learned the hard way: a plain single-item delete left genre pages listing a removed movie. Orphaned data in NoSQL doesn't announce itself — **design every write path that touches duplicated data as a transaction.**

## Step 2 — The Express API

Routes + Zod validation + a repository layer so DynamoDB details stay in one place:

```ts
app.use(helmet());
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: '100kb' }));
app.use(healthRouter);            // GET /health for the load balancer
app.use('/api/movies', moviesRouter);
```

Two details worth copying:
- The API **refuses** to create a movie pointing at a nonexistent director/genre, returning `422` instead of silently storing a broken reference. Relational DBs give you foreign keys for free; in DynamoDB *you are the foreign key*.
- There is **no database password anywhere**. Locally the API talks to DynamoDB Local (a fake DynamoDB in a container) with dummy credentials; on AWS the SDK picks up permissions from the IAM role attached to the running container. Same code, zero secrets, switched by one environment variable.

## Step 3 — The Vue 3 frontend

Vite for build, Pinia for state, Vue Router for pages. A small store:

```ts
export const useMoviesStore = defineStore('movies', {
  state: () => ({ movies: [], directors: [], genres: [], loading: false, error: null }),
  actions: {
    async fetchMovies(search?: string) {
      this.loading = true;
      try { this.movies = (await api.listMovies(search)).items; }
      finally { this.loading = false; }
    },
    async addMovie(payload) {
      const movie = await api.createMovie(payload);
      this.movies = [movie, ...this.movies];
      return movie;
    },
  },
});
```

## Steps 4–6 — Containers, CDK, and automated proof

- **Step 4:** wrap both apps in Docker (API + Nginx serving the built Vue files).
- **Step 5:** describe the whole cloud setup (~200 lines) in TypeScript via **CDK** — VPC, ALB with path-based routing, two Fargate services, IAM role scoped to one table. Infrastructure becomes a reviewable, re-runnable file instead of console clicks.
- **Step 6:** prove it works automatically with **Playwright** end-to-end tests against the deployed URL.

## Why Fargate (and this exact stack)?

The "why these services" rationale that the beginner walkthrough skips, worth knowing before you commit:

- **Fargate vs. Lambda.** Fargate removes the Lambda constraints that matter for long-running HTTP services: no 15-minute execution limit, full control over the runtime/container, and a warm process that suits a persistent Express server. Lambda is still better for spiky, event-driven functions; Fargate is the sweet spot for always-on containerized APIs without managing EC2.
- **Cost model.** Pairing Fargate with DynamoDB **PAY_PER_REQUEST** keeps the whole stack opex-only: the ECS service auto-scales task count on CPU/memory utilization, and DynamoDB scales read/write capacity on demand — no capacity planning, no downtime for scaling.
- **Single table is the AWS-recommended default, not a stylistic choice.** AWS's own table-design best practices state that general DynamoDB design principles recommend keeping the number of tables to a minimum and that "in the majority of cases, we recommend that you consider using a single table" — with a hard quota of 10,000 tables per account if you go the other way. The one-table design in this tutorial is the canonical pattern, not a beginner shortcut.
- **CDK project hygiene.** Follow the standard layout — `bin/` for the entry point, `lib/` for stack/construct definitions, `cdk.json` for config. Reusable constructs plus type-safe infra give you reviewable, testable infrastructure and automatic CloudFormation generation, and CDK constructs bake in many best practices (e.g., least-privilege IAM when you use `table.grantReadWriteData(taskRole)` instead of hand-writing policies).

## Key takeaways for beginners

1. **Design DynamoDB keys from your app's questions**, not from an ER diagram; use a GSI for each distinct access pattern and transactions for multi-item writes.
2. **You are the foreign key** in NoSQL — validate references explicitly (return `422`) or you'll store broken links.
3. **IAM role on the container = zero secrets**: same code runs against DynamoDB Local locally and real AWS in prod, switched by one env var.
4. **CDK makes the cloud a file** you can read, review, and re-run; Playwright turns "it works" into an automated assertion.

## References

- [From Empty Folder to Live URL: A Beginner's Full-Stack App on AWS Fargate (DEV.to)](https://dev.to/aws-builders/from-empty-folder-to-live-url-a-beginners-full-stack-app-on-aws-fargate-3e6g)
- [fargate-movies-api repository](https://github.com/kasukur/fargate-movies-api)
- [Best practices for DynamoDB table design — AWS Developer Guide (single-table recommendation, table quotas)](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-table-design.html)
- [Building Serverless Application with AWS CDK: ECS Fargate & DynamoDB (DEV.to — Fargate-vs-Lambda rationale, PAY_PER_REQUEST, CDK project structure)](https://dev.to/clarizalooktech/building-serverless-application-with-aws-cdk-ecs-fargate-dynamodb-1eha)

## Related
- [[howto-s3-exfiltration-incident-response]]
