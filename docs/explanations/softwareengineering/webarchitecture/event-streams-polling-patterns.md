---
title: 'Event Streams, Short Polling, and Long Polling: Real-Time Data Patterns'
diataxis: Explanation
domain: Software-Engineering
topic: Web-Architecture
source: DEV.to
source_url: https://dev.to/anubama_i/event-stream-short-polling-long-polling-54n
date: 2026-06-25
keywords:
- knowledge-base
- Web-Architecture
- Software-Engineering
- explanations
---
# Event Streams, Short Polling, and Long Polling: Real-Time Data Patterns

## Overview

When building applications that need real-time or near-real-time data updates, developers face a fundamental choice: how should the client retrieve new data from the server? This tutorial covers three core patterns—Short Polling, Long Polling, and Server-Sent Events (SSE/Event Streams)—explaining when and why to use each.

## The Polling Problem

At its core, polling is the client repeatedly asking the server whether new data is available. The challenge is balancing responsiveness with resource efficiency.

### Short Polling

**How it works:** The client sends requests at fixed intervals (e.g., every 5 seconds), and the server responds immediately with either new data or an empty response.

**Pros:**
- Simple to implement
- Predictable request patterns
- Easy to debug

**Cons:**
- High overhead: most requests return no data
- Latency: data may be up to the polling interval stale
- Wastes server resources on empty responses

**Best for:** Low-frequency updates where slight staleness is acceptable (e.g., email inbox refresh).

### Long Polling

**How it works:** The client sends a request, and the server holds it open until either new data arrives or a timeout occurs. The client then immediately sends another request.

**Pros:**
- Lower latency than short polling (data arrives as soon as it's available)
- Fewer empty responses
- Better resource utilization

**Cons:**
- More complex to implement
- Connection management overhead
- Requires careful timeout handling

**Best for:** Chat applications, real-time notifications where sub-second latency matters.

### Server-Sent Events (Event Streams)

**How it works:** The client establishes a single persistent connection to the server. The server pushes data chunks as they become available, keeping the connection open until all data is delivered.

**Pros:**
- Single connection for all updates
- Server controls the push timing
- Excellent for large datasets delivered incrementally
- Native browser support via `EventSource` API

**Cons:**
- HTTP-only (no bidirectional communication)
- Reconnection logic needed on connection loss
- Not all servers support SSE natively

**Best for:** Streaming large datasets, live dashboards, progress indicators.

## When to Use Event Streaming

Consider a scenario where a user requests 100,000 records. Loading all data at once creates a poor user experience—long wait times, frozen UI. Event streaming solves this by:

1. Keeping the connection open
2. Sending data in chunks as they're processed
3. Letting the user see results incrementally

This transforms a 30-second wait into an instant "loading..." experience with data appearing progressively.

## Comparison Table

| Pattern | Latency | Server Load | Complexity | Bidirectional |
|---------|---------|-------------|------------|---------------|
| Short Polling | High (interval) | High (many empty requests) | Low | No |
| Long Polling | Medium | Medium | Medium | No |
| Event Stream (SSE) | Low | Low | Medium | No |
| WebSockets | Lowest | Lowest | High | Yes |

## Architecture Diagram

```
excalidraw
starturl:https://excalidraw.com

Client                          Server
  |                                |
  |--- Short Poll Request -------->|
  |<-- Empty Response -------------|
  |   (wait N seconds)             |
  |--- Short Poll Request -------->|
  |<-- Data or Empty -------------|
  |                                |
  |--- Long Poll Request --------->|
  |   (connection held open)       |
  |<-- Data when available -------|
  |   (immediately re-request)     |
  |--- Long Poll Request --------->|
  |                                |
  |--- SSE Connect --------------->|
  |<-- Data Chunk 1 --------------|
  |<-- Data Chunk 2 --------------|
  |<-- ... (stream continues) ----|
  |<-- Complete ------------------|
```

## Practical Implementation Tips

### Short Polling (JavaScript)
```javascript
async function shortPoll(url, interval) {
  while (true) {
    const response = await fetch(url);
    const data = await response.json();
    if (data.hasUpdates) {
      processUpdates(data);
    }
    await new Promise(r => setTimeout(r, interval));
  }
}
```

### Long Polling (JavaScript)
```javascript
async function longPoll(url) {
  while (true) {
    const response = await fetch(url);
    const data = await response.json();
    processUpdates(data);
    // Immediately re-request
  }
}
```

### Server-Sent Events (JavaScript)
```javascript
const eventSource = new EventSource('/api/stream');
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  processUpdates(data);
};
eventSource.onerror = () => {
  console.log('Connection lost, reconnecting...');
  eventSource.close();
};
```

## Decision Framework

Use this flow to choose the right pattern:

1. **Do you need bidirectional communication?** → Use WebSockets (not covered here)
2. **Is data frequency low (&lt; 1/min)?** → Short Polling
3. **Do you need low latency updates?** → Long Polling or SSE
4. **Are you streaming large datasets?** → SSE (Event Streams)
5. **Is server resource efficiency critical?** → SSE or Long Polling

## References

- Original article: [Event Stream, Short Polling, Long Polling](https://dev.to/anubama_i/event-stream-short-polling-long-polling-54n)
- MDN: [Using Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)
- RFC 8626: [WebSub (PubSubHubbub)](https://www.rfc-editor.org/rfc/rfc8626)
