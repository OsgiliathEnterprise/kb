---
title: 'S3 Vectors: RAG Without Vector Database'
diataxis: Explanation
domain: Cloud & Infrastructure
source: DZone
source_url: https://feeds.dzone.com/link/23558/17344321/build-rag-without-vector-database
keywords:
- knowledge-base
- Cloud & Infrastructure
- explanations
---
# S3 Vectors: Building RAG Without a Vector Database

## Overview

Amazon S3 Vectors eliminates the need for external vector databases (Pinecone, Weaviate, pgvector) by providing native, serverless vector storage directly within S3.

- **Status:** GA since December 2025
- **Scale:** Up to 2 billion vectors per index across 31+ AWS regions
- **Architecture:** 3 phases, 2 services (S3 Vectors + Amazon Bedrock), zero infrastructure
- **Cost:** Pay-per-use; up to 90% cheaper than managed alternatives at scale
- **Latency:** ~100ms (frequent queries), &lt;1s (infrequent queries)

## Comparison: S3 Vectors vs Managed Vector DB

| Feature | S3 Vectors | Managed Vector DB |
|---------|-----------|-------------------|
| Infrastructure | None - fully serverless | Clusters, shards, replicas |
| Scale | 2B vectors/index, 10K indexes/bucket | Varies, often requires re-sharding |
| Query Latency | ~100ms (frequent), &lt;1s (infrequent) | ~10-50ms |
| Cost Model | Pay per PUT + storage + query | Hourly/monthly compute + storage |
| Metadata Filtering | Up to 50 keys | Full query language |
| Best For | RAG, agent memory, semantic search | High-QPS production search |

**Tradeoff:** S3 Vectors trades single-digit-millisecond latency for zero operational overhead and dramatically lower costs.

## Vector Database Fundamentals

A vector database stores and retrieves **embeddings** — numerical representations of data in vector space. Unlike traditional databases that look up records by exact match, vector databases implement **Approximate Nearest Neighbor (ANN)** algorithms to find records semantically similar to a given input.

### Distance Metrics
| Metric | Best For | Notes |
|--------|----------|-------|
| **Cosine Similarity** | Text embeddings, semantic search | Measures angle between vectors, ignores magnitude; most common for text |
| **Euclidean (L2)** | Image embeddings, spatial data | Measures straight-line distance; sensitive to vector magnitude |
| **Dot Product** | Pre-normalized vectors | Fast computation; equivalent to cosine when vectors are unit-normalized |

### ANN vs. Exact Nearest Neighbor
- **KNN (Exact):** Guarantees finding the true nearest neighbors but scales poorly (O(n·d) per query)
- **ANN (Approximate):** Trades small accuracy loss for dramatic speedup using indexing structures (HNSW, IVF, PQ)
- S3 Vectors uses ANN internally, achieving ~100ms latency at billion-vector scale

### Common Use Cases
- Similarity search and semantic search
- Retrieval-augmented generation (RAG)
- Recommendation engines
- Multi-modal search (text → image, image → text)
- Object detection and anomaly detection

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
