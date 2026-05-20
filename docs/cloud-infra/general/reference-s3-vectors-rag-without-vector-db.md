---
title: "S3 Vectors: RAG Without Vector Database"
description: "S3 Vectors: RAG Without Vector Database"
tags: [aws,s3,rag,vectors,serverless, General]
date: 2026-05-19
sidebar_label: S3 Vectors: RAG Without Vector Database
---



# S3 Vectors: Building RAG Without a Vector Database

## Overview

Amazon S3 Vectors eliminates the need for external vector databases (Pinecone, Weaviate, pgvector) by providing native, serverless vector storage directly within S3.

- **Status:** GA since December 2025
- **Scale:** Up to 2 billion vectors per index across 31+ AWS regions
- **Architecture:** 3 phases, 2 services (S3 Vectors + Amazon Bedrock), zero infrastructure
- **Cost:** Pay-per-use; up to 90% cheaper than managed alternatives at scale
- **Latency:** ~100ms (frequent queries), <1s (infrequent queries)

## Comparison: S3 Vectors vs Managed Vector DB

| Feature | S3 Vectors | Managed Vector DB |
|---------|-----------|-------------------|
| Infrastructure | None - fully serverless | Clusters, shards, replicas |
| Scale | 2B vectors/index, 10K indexes/bucket | Varies, often requires re-sharding |
| Query Latency | ~100ms (frequent), <1s (infrequent) | ~10-50ms |
| Cost Model | Pay per PUT + storage + query | Hourly/monthly compute + storage |
| Metadata Filtering | Up to 50 keys | Full query language |
| Best For | RAG, agent memory, semantic search | High-QPS production search |

**Tradeoff:** S3 Vectors trades single-digit-millisecond latency for zero operational overhead and dramatically lower costs.

## Implementation (~50 Lines Python)

### Step 1: Setup

```bash
# Create vector bucket
aws s3vectors create-vector-bucket --vector-bucket-name my-rag-bucket

# Create index (1024 dims for Titan Embeddings V2)
aws s3vectors create-vector-index \
  --vector-bucket-name my-rag-bucket \
  --index-name my-rag-index \
  --dimension 1024 \
  --distance-metric cosine
```

### Step 2: Ingest Documents

```python
import boto3
import json

bedrock = boto3.client("bedrock-runtime", region_name="us-west-2")
s3vectors = boto3.client("s3vectors", region_name="us-west-2")

def embed(text: str) -> list[float]:
    response = bedrock.invoke_model(
        modelId="amazon.titan-embed-text-v2:0",
        body=json.dumps({"inputText": text}),
    )
    return json.loads(response["body"].read())["embedding"]

def ingest(doc_text: str, source: str):
    chunks = chunk_text(doc_text, chunk_size=500)
    vectors = []
    for i, chunk in enumerate(chunks):
        vectors.append({
            "key": f"{source}::chunk-{i}",
            "data": {"float32": embed(chunk)},
            "metadata": {"source": source, "chunk_index": i, "text": chunk},
        })
    s3vectors.put_vectors(vectorBucketName="my-rag-bucket", indexName="my-rag-index", vectors=vectors)
```

### Step 3: Query + Generate (RAG Loop)

```python
def rag_query(question: str, top_k: int = 5) -> str:
    # 1. Embed question
    query_vector = embed(question)
    
    # 2. Find similar chunks
    results = s3vectors.query_vectors(
        vectorBucketName="my-rag-bucket",
        indexName="my-rag-index",
        topK=top_k,
        queryVector={"float32": query_vector},
        returnMetadata=True,
    )
    
    # 3. Build context from retrieved chunks
    context = "\n\n---\n\n".join(
        f"[Source: {v['metadata']['source']}]\n{v['metadata']['text']}"
        for v in results["vectors"]
    )
    
    # 4. Generate answer with LLM
    return generate_answer(question, context)
```

## Key Takeaways

- S3 Vectors is ideal for internal RAG apps, agent memory, and moderate-QPS workloads
- Zero infrastructure management makes it perfect for prototyping and production
- Cost-effective at scale due to pay-per-use model
- ~50 lines of Python for complete RAG pipeline

## Architecture Diagram

```
[User Query] -> [Embed with Bedrock] -> [S3 Vectors Query] -> [Retrieve Chunks] -> [LLM Generate] -> [Response]
```
