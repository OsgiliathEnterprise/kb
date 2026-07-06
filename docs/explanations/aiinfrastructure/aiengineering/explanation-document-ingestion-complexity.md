---
title: 'Document Ingestion: The Hidden Complexity Before Embeddings'
diataxis: Explanation
domain: AI-Infrastructure
topic: AI-Engineering
source: DEV.to (surajrkhonde)
source_url: https://dev.to/surajrkhonde/phase-1-document-ingestion-the-hidden-complexity-before-embeddings-28bd
date: 2026-07-06
keywords:
- knowledge-base
- AI-Engineering
- AI-Infrastructure
- explanations
---
# Document Ingestion: The Hidden Complexity Before Embeddings

## Overview

**Document ingestion** is the critical first phase in any RAG (Retrieval-Augmented Generation) system — the process of taking raw documents and transforming them into a format suitable for embedding and retrieval. This phase is often underestimated, yet it determines the quality of every downstream operation. This note covers the full document ingestion pipeline, from raw file parsing to embedding-ready chunks.

---

## The Document Ingestion Pipeline

A production-grade document ingestion pipeline consists of these stages:

### 1. Document Parsing

Raw documents come in many formats (PDF, DOCX, HTML, Markdown, images). The parser must extract structured text while preserving semantic relationships (headings, tables, lists, code blocks).

**Key challenges:**
- PDFs with scanned images require OCR (Tesseract, AWS Textract)
- PDFs with embedded fonts may lose formatting during text extraction
- Tables in PDFs often become unreadable when flattened to plain text
- HTML documents may contain scripts, styles, and navigation noise

**Common parsers:**
- `PyPDF2`, `pdfplumber` (Python PDF libraries)
- `unstructured` (multi-format document parsing)
- `Apache Tika` (enterprise-grade, supports 1000+ formats)
- `LangChain's DocumentLoaders` (abstraction layer)

### 2. Text Cleaning and Normalization

Raw extracted text contains noise that degrades embedding quality:

```python
# Example: cleaning extracted text
import re

def clean_text(text: str) -> str:
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text)
    # Remove URLs
    text = re.sub(r'http\S+', '', text)
    # Remove special characters (keep Unicode for international text)
    text = re.sub(r'[^\w\s\.\,\!\?\;\:\-\(\)\[\]\{\}\/\&\@]', '', text)
    # Normalize Unicode
    text = unicodedata.normalize('NFKC', text)
    return text.strip()
```

**Cleaning priorities:**
1. Remove navigation/footer/header duplicates (common in multi-page PDFs)
2. Normalize whitespace and line breaks
3. Handle encoding issues (UTF-8 BOM, mixed encodings)
4. Strip tracking pixels, ads, and non-content elements

### 3. Text Chunking

The most impactful decision in ingestion is **how to split text into chunks**. Poor chunking leads to lost context; good chunking preserves it.

**Chunking strategies:**

| Strategy | Description | Best For |
|----------|-------------|----------|
| Fixed-size | Split by character/token count | Simple documents |
| Semantic | Split by sentence/paragraph boundaries | Technical docs |
| Recursive | Try paragraph, then sentence, then character splits | Mixed content |
| Overlapping | Overlap chunks by N tokens | Preserving context |

**Recursive character chunking** (most common in LangChain):

```python
from langchain.text_splitter import RecursiveCharacterTextSplitter

splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,       # Maximum tokens per chunk
    chunk_overlap=200,     # Overlap between chunks
    separators=[
        "\n\n",            # Primary: paragraph breaks
        "\n",              # Secondary: line breaks
        " ",               # Tertiary: word boundaries
        ""                 # Fallback: character-level
    ]
)

chunks = splitter.split_text(raw_document)
```

**Key parameters:**
- `chunk_size`: 500-2000 tokens (balance between context and retrieval precision)
- `chunk_overlap`: 10-20% of chunk_size (prevents boundary context loss)
- `separators`: ordered list of split points (tried in order)

### 4. Metadata Enrichment

Each chunk should carry metadata for filtering and context:

```python
from langchain.schema import Document

chunk = Document(
    page_content=chunk_text,
    metadata={
        "source": "document.pdf",
        "page": 42,
        "section": "3.2 Database Design",
        "heading_hierarchy": ["Chapter 3", "3.2 Database Design"],
        "document_type": "technical_manual",
        "language": "en",
        "word_count": 856,
        "created_at": "2026-07-06T10:00:00Z"
    }
)
```

**Useful metadata fields:**
- Source document and page number (for provenance)
- Section/heading hierarchy (for context reconstruction)
- Document type (for filtering)
- Language (for language-specific embeddings)
- Custom tags (for domain-specific filtering)

### 5. Embedding Generation

Convert text chunks to vector embeddings:

```python
from langchain.embeddings import OpenAIEmbeddings

embedder = OpenAIEmbeddings(model="text-embedding-3-small")
embeddings = embedder.embed_documents(chunks)
# Returns: list of 1536-dimensional vectors
```

**Embedding model selection:**
- `text-embedding-3-small`: 1536 dims, fast, cost-effective
- `text-embedding-3-large`: 3072 dims, better accuracy, slower
- `all-MiniLM-L6-v2`: Open-source, 384 dims, local execution
- `bge-large-en-v1.5`: Open-source, 1024 dims, multilingual

### 6. Storage

Store embeddings in a vector database:

```python
from langchain.vectorstores import Chroma

vectorstore = Chroma.from_documents(
    documents=chunks,
    embedding=embedder,
    persist_directory="./chroma_db"
)
```

**Vector database options:**
- **Chroma**: Local, Python-native, good for prototyping
- **Pinecone**: Managed, scalable, production-ready
- **Weaviate**: Open-source, supports hybrid search
- **Qdrant**: Rust-based, fast, supports payload filtering
- **FAISS**: Facebook's library, ultra-fast, local only

---

## Common Pitfalls

1. **Chunking too aggressively**: Small chunks lose context, leading to poor retrieval results
2. **No overlap**: Boundary cuts lose important context between chunks
3. **Ignoring document structure**: Flattening headers/tables destroys semantic meaning
4. **Single embedding model**: Different domains need different embeddings
5. **No metadata**: Without metadata, retrieval can't filter by document type, date, or category
6. **Skipping cleaning**: Noisy text produces noisy embeddings
7. **Not validating**: Always test retrieval quality with sample queries before production

---

## Validation Checklist

- [ ] Document parsing preserves structure (headings, tables, code)
- [ ] Text cleaning removes noise without losing meaning
- [ ] Chunk size matches embedding model context window
- [ ] Overlap prevents boundary context loss
- [ ] Metadata is enriched and filterable
- [ ] Embeddings are validated with test queries
- [ ] Vector database supports required query types (hybrid, filtered, semantic)
- [ ] Ingestion pipeline handles errors gracefully (bad files, encoding issues)

---

## References

- [Original Article](https://dev.to/surajrkhonde/phase-1-document-ingestion-the-hidden-complexity-before-embeddings-28bd)
- [LangChain Text Splitters Documentation](https://python.langchain.com/docs/modules/data_connection/document_transformers/)
- [OpenAI Embedding Models](https://platform.openai.com/docs/guides/embeddings)
- [Chroma Documentation](https://docs.trychroma.com/)
