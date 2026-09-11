---
title: Deploying a Trained ML Model to a SageMaker Real-Time Endpoint
diataxis: How-to Guide
domain: cloud-infrastructure
topic: aws
source: DEV.to Tech News
source_url: https://dev.to/shresthapandey/how-to-deploy-your-ml-model-to-aws-step-by-step-guide-af9
date: 2026-09-11
keywords:
- knowledge-base
- aws
- cloud-infrastructure
- how-to
---
# Deploying a Trained ML Model to a SageMaker Real-Time Endpoint

A complete walkthrough for taking a trained scikit-learn model (or any joblib-serializable model) from `model.pkl` to a live SageMaker real-time inference endpoint, with the four inference-script functions SageMaker requires, the IAM permissions that block most first-timers, and the cost behavior that surprises people.

## Prerequisites

- AWS account with SageMaker enabled, AWS CLI configured (`aws configure`)
- Trained model saveable with `joblib` (`model.pkl` / `.joblib`)
- `requirements.txt` with dependencies (sklearn, pandas, numpy)
- Python 3.8+

## Step 1 — Save the model and pin dependencies

```python
import joblib
joblib.dump(model, "model.pkl")
```

`requirements.txt` (keep both files in the same folder):

```
sklearn==1.2.0
pandas==1.5.0
numpy==1.23.0
```

## Step 2 — Upload to S3

```python
import boto3

s3 = boto3.client("s3")
bucket_name = "my-unique-ml-bucket-12345"  # must be globally unique
s3.create_bucket(Bucket=bucket_name,
                 CreateBucketConfiguration={"LocationConstraint": "us-east-1"})
s3.upload_file("model.pkl", bucket_name, "models/model.pkl")
s3.upload_file("requirements.txt", bucket_name, "models/requirements.txt")

model_s3_path = f"s3://{bucket_name}/models/model.pkl"
```

**Gotcha:** the S3 bucket region must match the SageMaker region or deployment fails.

## Step 3 — Write the inference script

`inference.py` must define the four functions SageMaker calls when requests hit the endpoint:

```python
import json
import joblib
import numpy as np
import os

model = None

def model_fn(model_dir):
    return joblib.load(os.path.join(model_dir, "model.pkl"))

def input_fn(input_data, content_type):
    if content_type == "application/json":
        data = json.loads(input_data)
        return np.array(data["features"])
    raise ValueError(f"Unsupported content type: {content_type}")

def predict_fn(input_data, model):
    return model.predict(input_data)

def output_fn(prediction, content_type):
    return json.dumps({"predictions": prediction.tolist()})
```

## Step 4 — Deploy with the Python SDK

```python
from sagemaker.sklearn.model import SKLearnModel
from sagemaker import get_execution_role

sklearn_model = SKLearnModel(
    model_data=model_s3_path,
    role=get_execution_role(),
    instance_type="ml.m5.large",
    entry_point="inference.py",
    py_version="py3",
)

sklearn_model.deploy(
    initial_instance_count=1,
    instance_type="ml.m5.large",
    endpoint_name="my-model-endpoint",
)
```

Deployment takes 5-10 minutes; the endpoint transitions `Creating` to `In Service`. The IAM execution role needs at least `s3:GetObject`, `s3:PutObject`, `sagemaker:CreateModel`, `sagemaker:CreateEndpoint` — missing role permissions are the single most common blocker.

## Step 5 — Test the endpoint

```python
import boto3, json

runtime = boto3.client("sagemaker-runtime")
response = runtime.invoke_endpoint(
    EndpointName="my-model-endpoint",
    ContentType="application/json",
    Body=json.dumps({"features": [[5.1, 3.5, 1.4, 0.2]]}),
)
print(json.loads(response["Body"].read().decode()))
# {'predictions': [...]}
```

## Step 6 — Clean up (the cost trap)

Endpoints bill continuously, idle or not:

```bash
aws sagemaker delete-endpoint --endpoint-name my-model-endpoint
aws sagemaker delete-endpoint-config --endpoint-config-name my-model-endpoint
```

| Resource | Cost |
| --- | --- |
| `ml.m5.large` | ~$0.20/hour (~$150/month if 24/7) |
| S3 storage | ~$0.02/GB/month |

## Common errors

| Error | Fix |
| --- | --- |
| `NoCredentialsError` | Run `aws configure` again |
| `InvalidRoleException` | IAM role missing S3 + SageMaker permissions |
| `ModelError` | Missing imports in `inference.py` (`os`, `joblib`, `numpy`) |
| Endpoint stuck on `Creating` | Wait 5-10 more minutes; verify region match |

## Choosing the right inference mode (the biggest cost lever)

A real-time endpoint is only one of four SageMaker inference options. Picking the right one is the biggest cost lever — often bigger than instance tuning:

| Mode | Best for | Billing |
| --- | --- | --- |
| **Real-time** | Low-latency, predictable traffic, always-on | instance-hours, 24/7 |
| **Serverless** | Spiky synchronous traffic, tolerant of p99 variation | per-request duration only — no idle cost |
| **Asynchronous** | Latency-insensitive, payloads up to 1 GB, can scale to zero | instance-hours, only while processing |
| **Batch transform** | Offline inference over large datasets, no persistent endpoint | instance-hours, only while the job runs |

The same model and container can run in real-time and serverless modes, so you can start real-time and switch if traffic turns out to be spiky. Two further cost controls on a real-time endpoint:

- **Autoscaling** — without it you provision for peak and pay for idle capacity. SageMaker's built-in autoscaling (Application Auto Scaling) tracks metrics like `InvocationsPerInstance` and scales the instance count. Target-tracking policies are the recommended default; you can also add scheduled scaling for known traffic patterns, and asynchronous endpoints can scale to **zero instances** (MinCapacity=0) so you pay nothing while idle.
- **SageMaker AI Savings Plans** — a 1- or 3-year commitment to a $/hour usage level that applies automatically across real-time, batch, and other eligible usage, with discounts of up to ~64%. Worth evaluating once your usage is steady.

If your model's utilization is low (check `CPUUtilization`/memory in CloudWatch), right-size the instance down before you add instances — a smaller instance plus autoscaling beats a big instance running at 5%.

## Diagram

```text
SageMaker Model Deployment Pipeline

1. Save model           2. Upload to S3         3. inference.py
   joblib.dump            boto3 upload_file       model_fn
   requirements.txt       model.pkl               input_fn

4. Deploy SDK           5. Test                 6. Clean up
   SKLearnModel           invoke_endpoint         delete-endpoint
   ml.m5.large            sagemaker-runtime       delete-endpoint-config

IAM role: s3:GetObject/PutObject + sagemaker:CreateModel/CreateEndpoint
inference.py must define model_fn, input_fn, predict_fn, output_fn
endpoint costs ~$0.20/hr (ml.m5.large) even idle - delete when not in use
```

## References

- [How to Deploy Your ML Model to AWS (Step-by-Step Guide) — DEV.to](https://dev.to/shresthapandey/how-to-deploy-your-ml-model-to-aws-step-by-step-guide-af9)
- [Inference cost optimization best practices — AWS SageMaker docs](https://docs.aws.amazon.com/sagemaker/latest/dg/inference-cost-optimization.html)
- [Automatic scaling of SageMaker models — AWS docs](https://docs.aws.amazon.com/sagemaker/latest/dg/endpoint-auto-scaling.html)
- [How to set up cloud budget alerts on AWS/GCP/Azure — DEV.to](https://dev.to/muskan_8abedcc7e12/how-to-set-up-cloud-budget-alerts-on-aws-gcp-azure-4ne) (companion cost-control note)
