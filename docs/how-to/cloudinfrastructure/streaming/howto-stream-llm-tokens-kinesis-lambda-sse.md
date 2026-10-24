---
title: How to Stream LLM Tokens Through Kinesis Data Streams into SSE (Claude + Lambda)
diataxis: How-to Guide
domain: cloud-infrastructure
topic: streaming
source: DEV.to Tech News
source_url: https://dev.to/dineshgowtham/how-to-stream-claude-agent-events-with-kinesis-data-streams-explained-simply-c2o
date: 2026-10-23
keywords:
- knowledge-base
- streaming
- cloud-infrastructure
- how-to
---
# How to Stream LLM Tokens Through Kinesis Data Streams into SSE (Claude + Lambda)

A WebSocket can push each LLM token to the browser, but it carries three hidden costs:

1. **Ephemeral connection** — if the client disconnects, in-flight tokens are lost
2. **Single consumer** — only the WebSocket server receives the data; adding a logger, analytics, or backup consumer means duplicating work
3. **Scaling limits** — one server must handle every concurrent chat

A **Kinesis Data Stream** is a durable, auto-scaling pipe with millisecond latency. Each token becomes a durable record that *any number* of services can read.

## Key concepts

- **Shard** — unit of capacity: up to **1 MiB/s (≈1000 records/s) writes** and **2 MiB/s reads** per shard
- **Enhanced fan-out (EFO)** — gives each consumer **dedicated throughput** (2 MB/s per shard, over an HTTP/2 retrieval API), avoiding the shared 2 MiB read pool. EFO only works when the consumer is **registered by ARN**; unregistered reads fall back to the shared pool with a ~200 ms latency penalty. *(Verified against AWS docs: EFO = up to 2 MB/s dedicated per shard; shard iterators expire 5 minutes after being returned.)*
- **Iterator** — pointer to where a consumer starts reading. **Expires after 5 minutes**; refresh regularly.

## Step 1: create the stream and register the consumer

```ts
import {
  KinesisClient,
  CreateStreamCommand,
  RegisterStreamConsumerCommand,
} from "@aws-sdk/client-kinesis";

const kinesis = new KinesisClient({ region: "us-east-1" });
const STREAM_NAME = "claude-token-stream";
const CONSUMER_NAME = "claude-lambda-consumer";

async function createStream() {
  await kinesis.send(
    new CreateStreamCommand({ StreamName: STREAM_NAME, ShardCount: 2 })
  );
}

async function registerConsumer() {
  // Registering by ARN enables enhanced fan-out
  await kinesis.send(
    new RegisterStreamConsumerCommand({
      StreamARN: `arn:aws:kinesis:us-east-1:123456789012:stream/${STREAM_NAME}`,
      ConsumerName: CONSUMER_NAME,
    })
  );
}

// Run once (or guard with existence checks)
await createStream();
await registerConsumer();
```

> Tip: after creating the stream, wait ~1 minute for it to become **ACTIVE** before registering the consumer, or the registration fails.

## Step 2: the producer — proxy Lambda that calls Claude and pushes tokens

```ts
import { KinesisClient, PutRecordCommand } from "@aws-sdk/client-kinesis";

const kinesis = new KinesisClient({ region: "us-east-1" });
const CLAUDE_API = "https://api.anthropic.com/v1/complete";
const STREAM_NAME = process.env.STREAM_NAME;

export const handler = async (event) => {
  const body = JSON.parse(event.body);
  const { prompt, userId } = body;

  const response = await fetch(CLAUDE_API, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": process.env.CLAUDE_API_KEY },
    body: JSON.stringify({ model: "claude-3-5-sonnet-20241001", prompt, max_tokens_to_sample: 1024, stream: true }),
  });

  // Each line of the raw stream is a JSON fragment with one token
  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const lines = decoder.decode(value).split("\n").filter((l) => l.trim());
    for (const line of lines) {
      const token = JSON.parse(line).completion;
      // Partition by userId so per-chat ordering is preserved
      await kinesis.send(
        new PutRecordCommand({
          StreamName: STREAM_NAME,
          PartitionKey: userId,
          Data: Buffer.from(token),
        })
      );
    }
  }

  return { statusCode: 200, body: JSON.stringify({ message: "Chat started" }) };
};
```

## Step 3: the consumer Lambda (Node.js 22) — read with EFO, forward via SSE

```ts
import {
  KinesisClient,
  GetRecordsCommand,
  GetShardIteratorCommand,
} from "@aws-sdk/client-kinesis";

const kinesis = new KinesisClient({ region: "us-east-1" });
const STREAM_NAME = process.env.STREAM_NAME;
const CONSUMER_ARN = process.env.CONSUMER_ARN; // EFO consumer ARN

const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));

export const handler = async (event, context) => {
  const shards = await kinesis
    .send(new DescribeStreamCommand({ StreamName: STREAM_NAME }))
    .then((resp) => resp.StreamDescription.Shards);

  for (const shard of shards) {
    const iteratorCmd = new GetShardIteratorCommand({
      StreamName: STREAM_NAME,
      ShardId: shard.ShardId,
      ShardIteratorType: "LATEST",   // start at newest token
      ConsumerARN: CONSUMER_ARN,     // enables enhanced fan-out
    });
    let iterator = await kinesis.send(iteratorCmd).then((r) => r.ShardIterator);

    while (true) {
      try {
        const { Records, NextShardIterator } = await kinesis.send(
          new GetRecordsCommand({ ShardIterator: iterator, Limit: 100 })
        );
        iterator = NextShardIterator;

        if (Records.length === 0) { await wait(200); continue; }

        for (const rec of Records) {
          const token = Buffer.from(rec.Data).toString("utf-8");
          await forwardTokenSSE(token);
        }
      } catch (err) {
        if (err.name === "ProvisionedThroughputExceededException") {
          for (let attempt = 1; attempt <= 5; attempt++) {
            await wait(Math.pow(2, attempt) * 100); // 200ms, 400ms, ...
          }
        } else if (err.name === "ExpiredIteratorException") {
          const fresh = await kinesis.send(iteratorCmd);
          iterator = fresh.ShardIterator;
        } else {
          throw err;
        }
      }
    }
  }
};

async function forwardTokenSSE(token: string) {
  const clientUrl = process.env.CLIENT_SSE_ENDPOINT;
  await fetch(clientUrl, {
    method: "POST",
    headers: { "Content-Type": "text/event-stream" },
    body: `data: ${token}\n\n`,
  });
}
```

Key lines: `ShardIteratorType: "LATEST"` starts at the newest token (live chat); `ConsumerARN` is what actually enables EFO (without it you pay the ~200 ms shared-pool latency); the `while (true)` loop keeps the Lambda busy until its timeout — set the timeout to match your latency budget.

## Gotchas (verified)

| Issue | Why it hurts | How to avoid |
| --- | --- | --- |
| Shard write limit (1 MiB/s) | Token bursts exceed capacity → throttling | Start with 2–4 shards; monitor `WriteProvisionedThroughputExceeded` |
| Iterator expiration (5 min) | Stale iterator → `ExpiredIteratorException` on `GetRecords` | Refresh every loop iteration, or catch and request a new one |
| Empty `GetRecords` | Kinesis is eventually consistent; records appear milliseconds later | Loop with a short sleep (~200 ms) when no records |
| Missing `stream: true` | Claude waits until the whole answer is ready | Always enable streaming on the completion call |
| Constant partition key | All chats share one shard → hit the 1 MiB/s ceiling | Partition by `userId` |
| Missing `Content-Type: text/event-stream` | Browser buffers the response; stream appears broken | Set the exact header on the SSE endpoint |

## End-to-end flow

1. Browser opens an SSE connection to `/chat/events`
2. API Gateway routes to a thin proxy Lambda
3. Proxy calls Claude with `stream=true`
4. Each token chunk is written to Kinesis via `PutRecord` (partition key = userId)
5. Consumer Lambda reads via EFO and forwards tokens to the browser's SSE endpoint
6. Browser renders tokens live

## Observability

A streaming pipeline has many failure modes (Claude latency, Kinesis throttling, Lambda timeouts, network hiccups) — without visibility you see "missing tokens" but not why. Emit CloudWatch metrics (namespace e.g. `ClaudeKinesisPipeline`) for throttled requests, expired iterators, and forwarded-token counts; use `PutMetricData` from the consumer Lambda.

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "k1",
      "type": "text",
      "x": 40,
      "y": 15,
      "text": { "content": "LLM token pipeline: Claude -> Kinesis (EFO) -> Lambda -> SSE", "fontSize": 16, "fontFamily": 1 }
    },
    {
      "id": "k2",
      "type": "rectangle",
      "x": 40,
      "y": 60,
      "width": 170,
      "height": 90,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#c4e0f2",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "Claude API\nstream=true\none token per line", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "k3",
      "type": "rectangle",
      "x": 260,
      "y": 60,
      "width": 190,
      "height": 90,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#d9ccff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "Proxy Lambda\nPutRecord\nPartitionKey=userId\n(per-chat ordering)", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "k4",
      "type": "rectangle",
      "x": 500,
      "y": 60,
      "width": 190,
      "height": 90,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#f9e0a3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "Kinesis stream\n2 shards\n1 MiB/s write each\n2 MiB/s read shared", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "k5",
      "type": "rectangle",
      "x": 500,
      "y": 200,
      "width": 190,
      "height": 90,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#f9d3d3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "Consumer Lambda\nGetShardIterator(ConsumerARN)\n= enhanced fan-out\niterator refresh every 5 min", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "k6",
      "type": "rectangle",
      "x": 260,
      "y": 200,
      "width": 190,
      "height": 90,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#d3f9d8",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "SSE endpoint\nContent-Type:\ntext/event-stream\nbrowser renders live", "fontSize": 14, "fontFamily": 1 }
    },
    [
      {
        "id": "ka1",
        "type": "arrow",
        "x": 210,
        "y": 105,
        "width": 50,
        "height": 0,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [[0, 0], [50, 0]]
      }
    ],
    [
      {
        "id": "ka2",
        "type": "arrow",
        "x": 450,
        "y": 105,
        "width": 50,
        "height": 0,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [[0, 0], [50, 0]]
      }
    ],
    [
      {
        "id": "ka3",
        "type": "arrow",
        "x": 595,
        "y": 150,
        "width": 0,
        "height": 50,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [[0, 0], [0, 50]]
      }
    ],
    [
      {
        "id": "ka4",
        "type": "arrow",
        "x": 500,
        "y": 245,
        "width": 50,
        "height": 0,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [[0, 0], [-50, 0]]
      }
    ]
  ]
}
```

## References

- [How to Stream Claude Agent Events with Kinesis Data Streams, Explained Simply (DEV.to)](https://dev.to/dineshgowtham/how-to-stream-claude-agent-events-with-kinesis-data-streams-explained-simply-c2o)
- [AWS: Develop enhanced fan-out consumers with the AWS SDK (dedicated throughput, 2 MB/s per shard)](https://docs.aws.amazon.com/streams/latest/dev/building-enhanced-consumers-api.html)
- [AWS: Quotas and limits (shard iterator expires 5 minutes after being returned)](https://docs.aws.amazon.com/streams/latest/dev/service-sizes-and-limits.html)
- [AWS blog: Kinesis Data Streams Adds Enhanced Fan-Out and HTTP/2](https://aws.amazon.com/blogs/aws/kds-enhanced-fanout/)
