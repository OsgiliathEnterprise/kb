---
title: 'How to Deploy ML Models to AWS SageMaker: Step-by-Step Guide'
diataxis: Explanation
domain: AI-Infrastructure
topic: AI-Engineering
source: DEV.to
source_url: https://dev.to/shresthapandey/how-to-deploy-your-ml-model-to-aws-step-by-step-guide-af9
date: 2026-06-25
keywords:
- knowledge-base
- AI-Engineering
- AI-Infrastructure
- explanations
---
# How to Deploy ML Models to AWS SageMaker: Step-by-Step Guide

## Overview

Deploying a trained ML model to production is often the hardest part of the ML lifecycle. This guide walks through deploying a scikit-learn model to AWS SageMaker, covering model packaging, S3 storage, inference script creation, endpoint deployment, testing, and cleanup.

## Prerequisites

- AWS account with SageMaker enabled
- A trained model saved as `model.pkl` (or `.joblib`)
- `requirements.txt` with your dependencies
- Python 3.8+ installed
- AWS CLI configured (`aws configure`)

## Step 1: Save Your Model

Serialize your trained model using `joblib` (recommended for scikit-learn models):

```python
import joblib
joblib.dump(model, 'model.pkl')
```

Create a `requirements.txt` file listing all dependencies:

```
sklearn==1.2.0
pandas==1.5.0
numpy==1.23.0
```

Keep both files in the same folder.

## Step 2: Upload to S3

Use the `boto3` SDK to create an S3 bucket and upload your model artifacts:

```python
import boto3

s3 = boto3.client('s3')
bucket_name = 'my-unique-ml-bucket-12345'  # Make this globally unique

s3.create_bucket(
    Bucket=bucket_name,
    CreateBucketConfiguration={'LocationConstraint': 'us-east-1'}
)

s3.upload_file('model.pkl', bucket_name, 'models/model.pkl')
s3.upload_file('requirements.txt', bucket_name, 'models/requirements.txt')

model_s3_path = f's3://{bucket_name}/models/model.pkl'
```

> **Note:** S3 bucket names must be globally unique across all AWS accounts. Include your account ID or a random suffix.

## Step 3: Write Your Inference Script

Create `inference.py` with four required functions that SageMaker calls during inference:

```python
import json
import joblib
import numpy as np
import os

model = None

def model_fn(model_dir):
    """Load the model from the model directory."""
    return joblib.load(os.path.join(model_dir, 'model.pkl'))

def input_fn(input_data, content_type):
    """Parse the input request."""
    if content_type == 'application/json':
        data = json.loads(input_data)
        return np.array(data['features'])
    raise ValueError(f"Unsupported content type: {content_type}")

def predict_fn(input_data, model):
    """Run inference on the input data."""
    return model.predict(input_data)

def output_fn(prediction, content_type):
    """Format the prediction response."""
    return json.dumps({'predictions': prediction.tolist()})
```

These four functions form the inference contract:
- `model_fn`: Called once at startup to load the model
- `input_fn`: Called per request to parse incoming data
- `predict_fn`: Called per request to run inference
- `output_fn`: Called per request to format the response

## Step 4: Deploy Using Python SDK

Deploy the model as a SageMaker endpoint:

```python
from sagemaker.sklearn.model import SKLearnModel
from sagemaker import get_execution_role

sklearn_model = SKLearnModel(
    model_data=model_s3_path,
    role=get_execution_role(),
    instance_type='ml.m5.large',
    entry_point='inference.py',
    py_version='py3'
)

sklearn_model.deploy(
    initial_instance_count=1,
    instance_type='ml.m5.large',
    endpoint_name='my-model-endpoint'
)
```

Deployment takes 5–10 minutes. You'll see status progress: `Creating → Pending → InService`.

## Step 5: Test Your Endpoint

Verify the endpoint works with a test request:

```python
import boto3
import json

runtime = boto3.client('sagemaker-runtime')
response = runtime.invoke_endpoint(
    EndpointName='my-model-endpoint',
    ContentType='application/json',
    Body=json.dumps({'features': [[5.1, 3.5, 1.4, 0.2]]})
)

result = json.loads(response['Body'].read().decode())
print(result)  # {'predictions': [...]}
```

## Step 6: Clean Up

**Critical:** Endpoints cost money even when idle. Delete them when done:

```bash
aws sagemaker delete-endpoint --endpoint-name my-model-endpoint
aws sagemaker delete-endpoint-config --endpoint-config-name my-model-endpoint
```

## IAM Permissions Required

Your IAM role needs these minimum permissions:

```json
{
    "Effect": "Allow",
    "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "sagemaker:CreateModel",
        "sagemaker:CreateEndpoint",
        "sagemaker:CreateEndpointConfig",
        "sagemaker:DescribeEndpoint",
        "ecr:BatchGetImage",
        "ecr:GetDownloadUrlForLayer"
    ],
    "Resource": "*"
}
```

## Common Errors and Fixes

| Error | Fix |
|-------|-----|
| `NoCredentialsError` | Run `aws configure` again |
| `InvalidRoleException` | IAM role needs S3 + SageMaker permissions |
| `ModelError` | Check `inference.py` for missing imports |
| Endpoint stuck on `Creating` | Wait 5–10 more minutes; check CloudWatch logs |

## Cost Breakdown

| Resource | Approximate Cost |
|----------|-----------------|
| `ml.m5.large` endpoint | ~$0.20/hour (~$144/month if 24/7) |
| S3 storage | ~$0.023/GB/month |

> **Warning:** Always delete endpoints when not in use. Idle endpoints have caused unexpected $50+ bills.

## Pre-Deployment Checklist

Before deploying, verify:
- [ ] AWS SDK version: `pip show boto3 sagemaker`
- [ ] IAM role has correct permissions
- [ ] S3 bucket region matches SageMaker region
- [ ] `inference.py` imports are correct
- [ ] Model file is accessible from S3

## Architecture Diagram

```
excalidraw
starturl:https://excalidraw.com

[Developer]
     |
     | 1. Train & save model.pkl
     v
[Local Machine]
     |
     | 2. Upload to S3
     v
[S3 Bucket: models/model.pkl]
     |
     | 3. SageMaker reads model
     v
[SageMaker Endpoint]
     |
     | 4. Receives inference requests
     v
[Inference Script: inference.py]
     |
     | 5. Returns predictions
     v
[Client Application]
```

## References

- Original guide: [How to Deploy Your ML Model to AWS](https://dev.to/shresthapandey/how-to-deploy-your-ml-model-to-aws-step-by-step-guide-af9)
- AWS SageMaker documentation: https://docs.aws.amazon.com/sagemaker/
- SageMaker Python SDK: https://sagemaker.readthedocs.io/
- AWS IAM policies: https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies.html
