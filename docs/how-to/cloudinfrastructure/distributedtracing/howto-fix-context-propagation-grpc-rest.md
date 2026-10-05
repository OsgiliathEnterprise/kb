---
title: How to Fix Context Propagation Across gRPC and REST — Four Boundaries That
  Split Every Trace
diataxis: How-to Guide
domain: cloud-infrastructure
topic: distributed-tracing
source: DEV.to Tech News
source_url: https://dev.to/freddie_thompson_e0488262/context-propagation-across-grpc-and-rest-one-broken-hop-splits-every-trace-2j9k
date: 2026-10-05
keywords:
- knowledge-base
- distributed-tracing
- cloud-infrastructure
- how-to
---
# How to Fix Context Propagation Across gRPC and REST — Four Boundaries That Split Every Trace

Symptom: your trace shows `api-gateway` calling `orders`, then stops. `orders` definitely called `inventory`, but `inventory` appears as a separate, **parentless** trace. The context didn't propagate. It breaks at four specific boundaries, and each needs a different fix (OpenTelemetry, Python shown).

## Boundary 1: protocol translation (HTTP ↔ gRPC)

W3C Trace Context travels as the `traceparent` HTTP header. gRPC uses **metadata, not headers**, and the mapping is *not* automatic unless an instrumented interceptor does it. Two gotchas:

- **gRPC metadata keys MUST be lowercase.** A capitalised key is silently dropped by some implementations and raises in others — a fun way to lose context on one language's client only.
- The failure is **asymmetric**: a Go client → Python server may work while the reverse doesn't, which makes it look like a language bug rather than a casing bug.

```python
class _MetadataSetter:
    def set(self, carrier, key, value):
        # gRPC metadata keys MUST be lowercase
        carrier.append((key.lower(), value))

class TracingClientInterceptor(grpc.UnaryUnaryClientInterceptor):
    def intercept_unary_unary(self, continuation, client_call_details, request):
        with _tracer.start_as_current_span(
            client_call_details.method, kind=SpanKind.CLIENT
        ) as span:
            metadata = list(client_call_details.metadata or [])
            propagate.inject(metadata, setter=_SETTER)
            new_details = client_call_details._replace(metadata=metadata)
            response = continuation(new_details, request)
            code = getattr(response, "code", lambda: None)()
            if code not in (None, grpc.StatusCode.OK):
                span.set_attribute("rpc.grpc.status_code", str(code))
            return response

class TracingServerInterceptor(grpc.ServerInterceptor):
    def intercept_service(self, continuation, handler_call_details):
        ctx = propagate.extract(
            list(handler_call_details.invocation_metadata or []), getter=_GETTER
        )
        token = otel_context.attach(ctx)
        try:
            return continuation(handler_call_details)
        finally:
            # Detaching is NOT optional. A leaked context attaches to whatever
            # request the worker thread handles next -> spans from request B
            # parented under request A.
            otel_context.detach(token)
```

## Boundary 2: message queues (Kafka / SQS)

A trace crossing a queue has a **producer** and **consumer** that may run hours apart. Parent-child is the *wrong* relationship — use a **link**. Making the consumer a child produces traces with multi-hour gaps that break every latency percentile you compute from span duration.

```python
def consume(msg):
    parent_ctx = propagate.extract(list(msg.headers or []), getter=_GETTER)
    parent_span = trace.get_current_span(parent_ctx)
    links = []
    sc = parent_span.get_span_context()
    if sc.is_valid:
        links.append(Link(sc))          # a link, not a parent
    with _tracer.start_as_current_span(
        f"process {msg.topic}", kind=SpanKind.CONSUMER, links=links
    ) as span:
        span.set_attribute("messaging.kafka.partition", msg.partition)
        span.set_attribute("messaging.kafka.offset", msg.offset)
        handle(msg)
```

## Boundary 3: thread pools and async

Context lives in a context-local. Hand work to a thread pool and the new thread has a fresh, empty one — every span inside a pool task becomes a new root, so your trace loses everything that happens in a background worker (usually the slow part you were trying to see). `asyncio.create_task` copies context automatically; **`loop.run_in_executor`, raw `Thread`, and most third-party pools do not** — which is why a trace can break inside a database driver you didn't write.

```python
class ContextPreservingExecutor(ThreadPoolExecutor):
    def submit(self, fn, /, *args, **kwargs):
        ctx = contextvars.copy_context()
        return super().submit(partial(ctx.run, fn), *args, **kwargs)
```

## Boundary 4: sampling decisions

If service A samples a trace out and service B makes its own independent decision, you get a child span with no parent. Always use **ParentBased** sampling so the root's decision is authoritative downstream.

## Finding the broken hop (don't hunt manually)

Query your tracing backend for **spans whose parent ID doesn't resolve**:

```python
def find_orphans(spans: list[dict]) -> dict[str, int]:
    """Group orphaned spans by service. The service that shows up is the one
    RECEIVING broken context — so the bug is in its caller or its own extract
    path. Run weekly; it catches a regression the day a new service ships
    without the interceptor."""
    known = {s["span_id"] for s in spans}
    orphans: dict[str, int] = {}
    for s in spans:
        parent = s.get("parent_span_id")
        if parent and parent not in known:
            svc = s.get("service_name", "unknown")
            orphans[svc] = orphans.get(svc, 0) + 1
    return dict(sorted(orphans.items(), key=lambda kv: -kv[1]))
```

Caveat: a parent can be legitimately missing because it was sampled out or is still in flight. Run over a **completed window** and treat the *rate* as the signal, not individual cases — a service that jumps from 2% to 60% orphans after a deploy has a propagation bug; one sitting steadily at ~3% probably just has sampling.

## Propagate more than trace context: Baggage

`traceparent` gets you the trace. **Baggage** carries application context (tenant ID, feature-flag cohort, request priority) to every downstream service without threading it through every function signature. Two warnings: baggage travels in headers to *every* hop including third parties, so it must never contain anything sensitive; and it costs bytes on every call — a few small keys are fine, a serialised user object is not.

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "t1",
      "type": "rectangle",
      "x": 40,
      "y": 60,
      "width": 200,
      "height": 90,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#c4e0f2",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "B1 protocol translation\nHTTP header <-> gRPC metadata\n(lowercase keys!)", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "t2",
      "type": "rectangle",
      "x": 300,
      "y": 60,
      "width": 200,
      "height": 90,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#d9ccff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "B2 message queues\nproducer/consumer hours apart\n=> use a LINK not parent", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "t3",
      "type": "rectangle",
      "x": 560,
      "y": 60,
      "width": 200,
      "height": 90,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#f9e0a3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "B3 thread pools / async\nnew thread = empty context\n=> copy_context()", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "t4",
      "type": "rectangle",
      "x": 300,
      "y": 260,
      "width": 200,
      "height": 90,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#f9d3d3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "B4 sampling\nindependent decisions split traces\n=> ParentBased sampler", "fontSize": 14, "fontFamily": 1 }
    },
    [
      {
        "id": "ta1",
        "type": "arrow",
        "x": 240,
        "y": 105,
        "width": 60,
        "height": 0,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [[0, 0], [60, 0]]
      }
    ],
    [
      {
        "id": "ta2",
        "type": "arrow",
        "x": 500,
        "y": 105,
        "width": 60,
        "height": 0,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [[0, 0], [60, 0]]
      }
    ],
    [
      {
        "id": "ta3",
        "type": "arrow",
        "x": 400,
        "y": 150,
        "width": 0,
        "height": 110,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [[0, 0], [0, 110]]
      }
    ]
  ]
}
```

## Quick checklist

- [ ] gRPC client + server interceptors inject/extract W3C context; metadata keys lowercased.
- [ ] `otel_context.detach(token)` in a `finally` on the server side (no leaked contexts).
- [ ] Queue consumers create spans with a **link** to the producer, not as children.
- [ ] Thread-pool / executor wrappers copy the caller's context (`contextvars.copy_context()`).
- [ ] Sampler is **ParentBased**, so downstream services inherit the root decision.
- [ ] Weekly orphan-span query (parent ID doesn't resolve) run over a completed window; watch the *rate*.

## References

- [Context Propagation Across gRPC and REST: One Broken Hop Splits Every Trace — DEV.to](https://dev.to/freddie_thompson_e0488262/context-propagation-across-grpc-and-rest-one-broken-hop-splits-every-trace-2j9k)
- [W3C Trace Context specification (traceparent / tracestate)](https://www.w3.org/TR/trace-context/)
- [OpenTelemetry Python — context propagation](https://opentelemetry-python.readthedocs.io/en/latest/getting-started/core-concepts.html)
