---
title: Scaling Real-Time APIs to 100k+ Concurrent Connections with WebSockets, SSE,
  and Redis Pub/Sub
diataxis: How-to Guide
domain: programming
topic: web-realtime
source: DEV.to Tech News
source_url: https://dev.to/dzakiamriz/scaling-real-time-apis-to-100k-concurrent-connections-websockets-sse-and-redis-pubsub-5hhm
date: 2026-08-28
keywords:
- knowledge-base
- web-realtime
- programming
- how-to
---
# Scaling Real-Time APIs to 100k+ Concurrent Connections with WebSockets, SSE, and Redis Pub/Sub

A single Node.js process handles roughly **10k–50k concurrent WebSocket connections** (depending on memory/CPU). Beyond that you must scale out horizontally — which introduces the **sticky session problem**: a client connected to server A may need events triggered by a client on server B. Without a shared message bus, those events are lost.

## Goal architecture: three layers

1. **Client connection layer** — WebSocket or SSE endpoints terminated by a fleet of stateless API servers.
2. **Message broker layer** — Redis Pub/Sub (or Kafka/NATS) relaying messages between servers.
3. **Persistence layer** (optional) — message history / offline delivery.

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "c1",
      "type": "rectangle",
      "x": 40,
      "y": 160,
      "width": 170,
      "height": 80,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#a5d8ff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "Client A\n(WebSocket/SSE)",
        "fontSize": 13,
        "fontFamily": 1
      }
    },
    {
      "id": "s1",
      "type": "rectangle",
      "x": 290,
      "y": 160,
      "width": 170,
      "height": 80,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#c4e0f2",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "Server 1\n(stateless)",
        "fontSize": 13,
        "fontFamily": 1
      }
    },
    {
      "id": "r1",
      "type": "rectangle",
      "x": 540,
      "y": 160,
      "width": 200,
      "height": 80,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#f9e0a3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "Redis Pub/Sub\n(fan-out broker)",
        "fontSize": 13,
        "fontFamily": 1
      }
    },
    {
      "id": "s2",
      "type": "rectangle",
      "x": 820,
      "y": 160,
      "width": 170,
      "height": 80,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#c4e0f2",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "Server 2\n(stateless)",
        "fontSize": 13,
        "fontFamily": 1
      }
    },
    {
      "id": "c2",
      "type": "rectangle",
      "x": 1070,
      "y": 160,
      "width": 170,
      "height": 80,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#a5d8ff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "Client B\n(WebSocket/SSE)",
        "fontSize": 13,
        "fontFamily": 1
      }
    },
    [
      {
        "id": "a1",
        "type": "arrow",
        "x": 210,
        "y": 200,
        "width": 80,
        "height": 0,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [
          [
            0,
            0
          ],
          [
            80,
            0
          ]
        ]
      }
    ],
    [
      {
        "id": "a2",
        "type": "arrow",
        "x": 460,
        "y": 200,
        "width": 80,
        "height": 0,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [
          [
            0,
            0
          ],
          [
            80,
            0
          ]
        ]
      }
    ],
    [
      {
        "id": "a3",
        "type": "arrow",
        "x": 740,
        "y": 200,
        "width": 80,
        "height": 0,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [
          [
            0,
            0
          ],
          [
            80,
            0
          ]
        ]
      }
    ],
    [
      {
        "id": "a4",
        "type": "arrow",
        "x": 990,
        "y": 200,
        "width": 80,
        "height": 0,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [
          [
            0,
            0
          ],
          [
            80,
            0
          ]
        ]
      }
    ],
    {
      "id": "note1",
      "type": "text",
      "x": 290,
      "y": 260,
      "width": 700,
      "height": 40,
      "text": {
        "content": "Client A -> Server 1 publishes to channel; ALL servers (incl. Server 1) subscribe and forward\nto their local clients. Connection is decoupled from message origin.",
        "fontSize": 13,
        "fontFamily": 1,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent"
      }
    }
  ]
}
```

When Client A sends a message, Server 1 publishes it to a Redis channel. All servers (including Server 1) subscribe and forward the message to their local interested clients. This decouples the connection from the message origin.

## Protocol choice: WebSocket vs SSE

| Criterion | WebSockets | SSE |
|-----------|-----------|-----|
| Direction | Bidirectional | Unidirectional (server → client) |
| Transport | Own protocol after handshake | Rides on HTTP (HTTP/2 multiplexing friendly) |
| Reconnection | Manual | Automatic (`Last-Event-ID`) |
| Firewalls/proxies | Can be blocked | Simpler — plain HTTP |
| Best for | Chat, collaborative editing, games | Live feeds, notifications, tickers |

Rule of thumb: **WebSockets** for bidirectional low-latency apps; **SSE** for one-way streaming where you want less code and better proxy compatibility. For bidirectional over SSE you need a companion POST endpoint (SSE + POST).

## Production Node.js example (`ws` + `ioredis`)

```javascript
import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import Redis from 'ioredis';

const app = express();
const server = http.createServer(app);

// noServer: handle the HTTP upgrade manually (auth happens here)
const wss = new WebSocketServer({ noServer: true });

// ioredis REQUIRES separate connections for pub and sub —
// a subscriber-mode connection cannot run other commands.
const redisPublisher  = new Redis({ host: 'redis-1', port: 6379, maxRetriesPerRequest: null });
const redisSubscriber = new Redis({ host: 'redis-1', port: 6379, maxRetriesPerRequest: null });

// In-memory client registry per server instance
const clients = new Map(); // clientId -> WebSocket

redisSubscriber.subscribe('chat:global');
redisSubscriber.on('message', (channel, message) => {
  if (channel === 'chat:global') {
    const { clientId, data } = JSON.parse(message);
    clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ from: clientId, data }));
      }
    });
  }
});

server.on('upgrade', (request, socket, head) => {
  // Authenticate here (JWT in query string or cookie). Don't trust Origin headers.
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

wss.on('connection', (ws, request) => {
  const clientId = new URL(request.url, 'http://localhost').searchParams.get('clientId');
  if (!clientId) { ws.close(4001, 'Missing clientId'); return; }

  clients.set(clientId, ws);

  ws.on('message', (message) => {
    // Fan out to every other server via Redis
    redisPublisher.publish('chat:global', JSON.stringify({ clientId, data: message.toString() }));
  });

  ws.on('close', () => clients.delete(clientId));
  ws.on('error', (err) => { console.error(err); ws.close(1011, 'Internal error'); });
});

server.listen(process.env.PORT || 3000);
```

### Critical engineering decisions in that code

- **Separate Redis connections for pub/sub.** `ioredis` enters subscriber mode on the subscribing connection; mixing publish and subscribe on one connection throws errors.
- **`maxRetriesPerRequest: null`.** Prevents the client from buffering commands while disconnected (memory leak risk); instead it emits errors so you can drive reconnection with exponential backoff (`ioredis` has a built-in retry strategy).
- **Backpressure.** `ws.send` buffers for slow consumers — monitor `ws.bufferedAmount` and drop or disconnect slow clients.
- **Graceful degradation.** If Redis fails, fall back to local-only broadcast (with a warning) rather than dropping all real-time functionality.

## Performance numbers (approximate, from real deployments)

| Metric | Value |
|--------|-------|
| WebSocket throughput per Node process | ~10k msg/s at &lt;5 ms latency on modest hardware |
| Redis Pub/Sub capacity | 100k+ ops/sec — becomes the bottleneck after scaling out |
| Memory per connection | ~20–50 KB (incl. buffers) → **100k connections ≈ 2–5 GB RAM per server** |
| Added latency from Redis Pub/Sub | ~0.1–0.5 ms; end-to-end stays &lt;10 ms in a well-configured cluster |

## Trade-offs to decide explicitly

- **Redis Pub/Sub vs Redis Streams.** Pub/Sub is faster and simpler but fire-and-forget: if no subscriber is present, the message is lost. Streams add persistence + consumer groups at the cost of complexity and latency. Use Streams for critical messages.
- **Sticky sessions vs broker.** LB sticky sessions avoid Redis entirely but cause uneven load and failover pain; a broker decouples nodes but adds a single point of failure (mitigate with Sentinel/Cluster).
- **SSE vs WebSockets** — see table above.

## Security checklist

1. Validate tokens during the WebSocket handshake; never rely on `Origin` headers alone.
2. Per-connection message rate limiting to prevent abuse.
3. Use WSS (TLS); terminate TLS at the load balancer to keep app-server CPU low.

## Actionable checklist

1. Choose protocol: WebSockets for bidirectional, SSE for one-way streaming.
2. Design for horizontal scaling with a broker (Redis Pub/Sub or similar).
3. Separate pub/sub Redis clients; configure retry strategies with exponential backoff.
4. Handle backpressure via `bufferedAmount`; disconnect slow consumers.
5. Graceful degradation when the broker is down.
6. Monitor: connection count, message rates, Redis latency, error rates.
7. Load test with `k6` or `wrk` at target scale (100k connections) before launch.

## References

- [Scaling Real-Time APIs to 100k+ Concurrent Connections: WebSockets, SSE, and Redis Pub/Sub](https://dev.to/dzakiamriz/scaling-real-time-apis-to-100k-concurrent-connections-websockets-sse-and-redis-pubsub-5hhm)
- [MDN: WebSockets API](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
- [MDN: Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [Redis Pub/Sub documentation](https://redis.io/docs/latest/develop/data-types/pubsub/)
- [ADR 0002: Redis Pub/Sub for scale-out routing (Spring Boot 4 real-time messaging)](https://github.com/jinwovo/realtime-messaging/blob/main/docs/adr/0002-redis-pubsub-for-scale-out-routing.md) — a worked architecture-decision record for the same three-layer pattern
