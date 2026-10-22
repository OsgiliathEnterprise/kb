---
title: gRPC Client-Server Message Flow over HTTP/2
diataxis: Explanation
domain: cloud-infrastructure
topic: grpc
source: ''
---
---
created: 2026-10-17
type: explanation
title: "gRPC Client-Server Message Flow over HTTP/2"
domain: cloud-infrastructure
topic: grpc
source: "Ebook: gRPC: Up and Running by Kasun Indrasiri & Danesh Kuruppu"
source_book_id: calibrebook_217
source_chapter: "Chapter 1: Introduction to gRPC"
tags: [grpc, http2, protobuf, marshaling, wire-protocol, binary-serialization]
visibility: private

concise: true---

# gRPC Client-Server Message Flow over HTTP/2

## The round trip

1. The client library **marshals** the RPC into a **protobuf binary format** and sends it over **HTTP/2**.
2. The server **unmarshals** the received message back into a typed object, executes the requested procedure, and sends the response back the same way.
3. The client unmarshals the response — to application code it simply looks like a method return value.

## Key concepts

- **Marshaling** (serialization): converting an in-memory object into a byte representation for transmission. **Unmarshaling** (deserialization) is the reverse. gRPC's default marshaling is protocol buffers.
- **HTTP/2**: a high-performance binary message protocol with **bidirectional messaging** support — both client and server can send messages on the same connection, which is what enables gRPC's streaming call types.
- Binary on the wire means no text parsing cost and smaller payloads than the binary→text→binary round trip of REST over HTTP/1.x.

## Why it matters

- The application never touches transport or bytes: the generated stub/skeleton handles marshal/unmarshal, and developers work with typed request/response objects.
- The wire format (frame structure, headers, trailers) is a deeper topic — the book covers message framing and header/trailer metadata in its dedicated protocol chapter.

## Related notes

- [[howto-implement-run-grpc-server-go]]
- [[howto-build-grpc-client-java-blocking-stub]]
- [[explanation-evolution-of-ipc-rpc-soap-rest-grpc]]
