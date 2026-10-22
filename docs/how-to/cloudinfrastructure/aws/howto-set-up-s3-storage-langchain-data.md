---
title: How to Set Up S3 Storage for LangChain Datasets and Artifacts
diataxis: How-to Guide
domain: cloud-infrastructure
topic: aws
source: ''
---
---
created: 2026-10-16
type: howto
title: "How to Set Up S3 Storage for LangChain Datasets and Artifacts"
domain: cloud-infrastructure
topic: aws
source: "Ebook: Generative AI with LangChain by Dr. Priyanka Singh & Hariom Singh"
source_book_id: calibrebook_590
source_chapter: "Chapter 5: LangChain and AWS Integration"
tags: [aws, s3, storage, encryption, bucket-policy, boto3]
visibility: private
ai_tool_candidate: true

concise: true---

# How to Set Up S3 Storage for LangChain Datasets and Artifacts

Organized, restricted, encrypted bucket layout for datasets, models, and results.

## Input parameters
- Bucket name (book uses `my-langchain-data`)
- Dataset/model files to store

## Steps
1. Create the bucket (console or CLI): `my-langchain-data`.
2. Organize with prefixes: `datasets/`, `models/`, `results/`.
3. Upload:
```bash
aws s3 cp my-dataset.csv s3://my-langchain-data/datasets/
aws s3 cp ./data/ s3://my-langchain-data/datasets/ --recursive
```
4. Restrict access with a bucket policy (book's example shape):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "AWS": "arn:aws:iam::ACCOUNT_ID:root" },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::my-bucket/*"
    }
  ]
}
```
5. Enable server-side encryption (SSE) and access logging.
6. Access from Python:
```python
import boto3

s3 = boto3.client('s3')
s3.download_file('my-langchain-data', 'datasets/my-dataset.csv', 'my-dataset.csv')
s3.upload_file('my-model.pkl', 'my-langchain-data', 'models/my-model.pkl')
```

## Error handling
- `NoSuchBucket` → wrong bucket name or bucket in a different region than the client.
- `AccessDenied` → IAM role/policy missing `s3:GetObject`/`s3:PutObject` for the path.
- Objects over 5 GB → use multipart upload instead of a single `upload_file`.

## Verification
- `aws s3 ls s3://my-langchain-data/ --recursive` lists all uploaded files.
- `s3.download_file` produces a local file whose content matches the source.

## Related notes
- [[howto-set-up-aws-cli-boto3-langchain-development]]
- [[howto-train-huggingface-bert-sagemaker-langchain]]
- [[howto-connect-langchain-rds-dynamodb]]
