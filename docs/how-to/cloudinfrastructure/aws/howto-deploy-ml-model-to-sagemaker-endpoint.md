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
```excalidraw
{
 "type": "excalidraw",
 "version": 2,
 "source": "hermes-agent",
 "elements": [
  {
   "type": "text",
   "id": "title",
   "x": 420,
   "y": 30,
   "width": 324.79999999999995,
   "height": 22,
   "angle": 0,
   "strokeColor": "#1e1e1e",
   "backgroundColor": "transparent",
   "fillStyle": "solid",
   "strokeWidth": 1,
   "roughness": 1,
   "opacity": 100,
   "groupIds": [],
   "frameId": null,
   "roundness": null,
   "seed": 1,
   "version": 1,
   "versionNonce": 1,
   "isDeleted": false,
   "boundElements": [],
   "updated": 1,
   "link": null,
   "locked": false,
   "text": "SageMaker Model Deployment Pipeline",
   "fontSize": 16,
   "fontFamily": 1,
   "textAlign": "center",
   "verticalAlign": "middle",
   "containerId": null,
   "originalText": "SageMaker Model Deployment Pipeline",
   "autoResize": true
  },
  {
   "type": "rectangle",
   "id": "S1",
   "x": 40,
   "y": 90,
   "width": 160,
   "height": 120,
   "angle": 0,
   "strokeColor": "#1e1e1e",
   "backgroundColor": "#a5d8ff",
   "fillStyle": "solid",
   "strokeWidth": 2,
   "roughness": 1,
   "opacity": 100,
   "groupIds": [],
   "frameId": null,
   "roundness": {
    "type": 3
   },
   "seed": 1,
   "version": 1,
   "versionNonce": 1,
   "isDeleted": false,
   "boundElements": [
    {
     "id": "S1_t",
     "type": "text"
    }
   ],
   "updated": 1,
   "link": null,
   "locked": false
  },
  {
   "type": "text",
   "id": "S1_t0",
   "x": 40,
   "y": 120,
   "width": 144,
   "height": 18,
   "angle": 0,
   "strokeColor": "#1e1e1e",
   "backgroundColor": "transparent",
   "fillStyle": "solid",
   "strokeWidth": 1,
   "roughness": 1,
   "opacity": 100,
   "groupIds": [],
   "frameId": null,
   "roundness": null,
   "seed": 1,
   "version": 1,
   "versionNonce": 1,
   "isDeleted": false,
   "boundElements": [],
   "updated": 1,
   "link": null,
   "locked": false,
   "text": "1. Save model",
   "fontSize": 12,
   "fontFamily": 1,
   "textAlign": "center",
   "verticalAlign": "middle",
   "containerId": "S1",
   "originalText": "1. Save model",
   "autoResize": true
  },
  {
   "type": "text",
   "id": "S1_t1",
   "x": 40,
   "y": 140,
   "width": 144,
   "height": 18,
   "angle": 0,
   "strokeColor": "#1e1e1e",
   "backgroundColor": "transparent",
   "fillStyle": "solid",
   "strokeWidth": 1,
   "roughness": 1,
   "opacity": 100,
   "groupIds": [],
   "frameId": null,
   "roundness": null,
   "seed": 1,
   "version": 1,
   "versionNonce": 1,
   "isDeleted": false,
   "boundElements": [],
   "updated": 1,
   "link": null,
   "locked": false,
   "text": "joblib.dump",
   "fontSize": 12,
   "fontFamily": 1,
   "textAlign": "center",
   "verticalAlign": "middle",
   "containerId": "S1",
   "originalText": "joblib.dump",
   "autoResize": true
  },
  {
   "type": "text",
   "id": "S1_t2",
   "x": 40,
   "y": 160,
   "width": 144,
   "height": 18,
   "angle": 0,
   "strokeColor": "#1e1e1e",
   "backgroundColor": "transparent",
   "fillStyle": "solid",
   "strokeWidth": 1,
   "roughness": 1,
   "opacity": 100,
   "groupIds": [],
   "frameId": null,
   "roundness": null,
   "seed": 1,
   "version": 1,
   "versionNonce": 1,
   "isDeleted": false,
   "boundElements": [],
   "updated": 1,
   "link": null,
   "locked": false,
   "text": "requirements.txt",
   "fontSize": 12,
   "fontFamily": 1,
   "textAlign": "center",
   "verticalAlign": "middle",
   "containerId": "S1",
   "originalText": "requirements.txt",
   "autoResize": true
  },
  {
   "type": "rectangle",
   "id": "S2",
   "x": 220,
   "y": 90,
   "width": 160,
   "height": 120,
   "angle": 0,
   "strokeColor": "#1e1e1e",
   "backgroundColor": "#96f2d7",
   "fillStyle": "solid",
   "strokeWidth": 2,
   "roughness": 1,
   "opacity": 100,
   "groupIds": [],
   "frameId": null,
   "roundness": {
    "type": 3
   },
   "seed": 1,
   "version": 1,
   "versionNonce": 1,
   "isDeleted": false,
   "boundElements": [
    {
     "id": "S2_t",
     "type": "text"
    }
   ],
   "updated": 1,
   "link": null,
   "locked": false
  },
  {
   "type": "text",
   "id": "S2_t0",
   "x": 220,
   "y": 120,
   "width": 144,
   "height": 18,
   "angle": 0,
   "strokeColor": "#1e1e1e",
   "backgroundColor": "transparent",
   "fillStyle": "solid",
   "strokeWidth": 1,
   "roughness": 1,
   "opacity": 100,
   "groupIds": [],
   "frameId": null,
   "roundness": null,
   "seed": 1,
   "version": 1,
   "versionNonce": 1,
   "isDeleted": false,
   "boundElements": [],
   "updated": 1,
   "link": null,
   "locked": false,
   "text": "2. Upload to S3",
   "fontSize": 12,
   "fontFamily": 1,
   "textAlign": "center",
   "verticalAlign": "middle",
   "containerId": "S2",
   "originalText": "2. Upload to S3",
   "autoResize": true
  },
  {
   "type": "text",
   "id": "S2_t1",
   "x": 220,
   "y": 140,
   "width": 144,
   "height": 18,
   "angle": 0,
   "strokeColor": "#1e1e1e",
   "backgroundColor": "transparent",
   "fillStyle": "solid",
   "strokeWidth": 1,
   "roughness": 1,
   "opacity": 100,
   "groupIds": [],
   "frameId": null,
   "roundness": null,
   "seed": 1,
   "version": 1,
   "versionNonce": 1,
   "isDeleted": false,
   "boundElements": [],
   "updated": 1,
   "link": null,
   "locked": false,
   "text": "boto3 upload_file",
   "fontSize": 12,
   "fontFamily": 1,
   "textAlign": "center",
   "verticalAlign": "middle",
   "containerId": "S2",
   "originalText": "boto3 upload_file",
   "autoResize": true
  },
  {
   "type": "text",
   "id": "S2_t2",
   "x": 220,
   "y": 160,
   "width": 144,
   "height": 18,
   "angle": 0,
   "strokeColor": "#1e1e1e",
   "backgroundColor": "transparent",
   "fillStyle": "solid",
   "strokeWidth": 1,
   "roughness": 1,
   "opacity": 100,
   "groupIds": [],
   "frameId": null,
   "roundness": null,
   "seed": 1,
   "version": 1,
   "versionNonce": 1,
   "isDeleted": false,
   "boundElements": [],
   "updated": 1,
   "link": null,
   "locked": false,
   "text": "model.pkl",
   "fontSize": 12,
   "fontFamily": 1,
   "textAlign": "center",
   "verticalAlign": "middle",
   "containerId": "S2",
   "originalText": "model.pkl",
   "autoResize": true
  },
  {
   "type": "rectangle",
   "id": "S3",
   "x": 400,
   "y": 90,
   "width": 160,
   "height": 120,
   "angle": 0,
   "strokeColor": "#1e1e1e",
   "backgroundColor": "#ffec99",
   "fillStyle": "solid",
   "strokeWidth": 2,
   "roughness": 1,
   "opacity": 100,
   "groupIds": [],
   "frameId": null,
   "roundness": {
    "type": 3
   },
   "seed": 1,
   "version": 1,
   "versionNonce": 1,
   "isDeleted": false,
   "boundElements": [
    {
     "id": "S3_t",
     "type": "text"
    }
   ],
   "updated": 1,
   "link": null,
   "locked": false
  },
  {
   "type": "text",
   "id": "S3_t0",
   "x": 400,
   "y": 120,
   "width": 144,
   "height": 18,
   "angle": 0,
   "strokeColor": "#1e1e1e",
   "backgroundColor": "transparent",
   "fillStyle": "solid",
   "strokeWidth": 1,
   "roughness": 1,
   "opacity": 100,
   "groupIds": [],
   "frameId": null,
   "roundness": null,
   "seed": 1,
   "version": 1,
   "versionNonce": 1,
   "isDeleted": false,
   "boundElements": [],
   "updated": 1,
   "link": null,
   "locked": false,
   "text": "3. inference.py",
   "fontSize": 12,
   "fontFamily": 1,
   "textAlign": "center",
   "verticalAlign": "middle",
   "containerId": "S3",
   "originalText": "3. inference.py",
   "autoResize": true
  },
  {
   "type": "text",
   "id": "S3_t1",
   "x": 400,
   "y": 140,
   "width": 144,
   "height": 18,
   "angle": 0,
   "strokeColor": "#1e1e1e",
   "backgroundColor": "transparent",
   "fillStyle": "solid",
   "strokeWidth": 1,
   "roughness": 1,
   "opacity": 100,
   "groupIds": [],
   "frameId": null,
   "roundness": null,
   "seed": 1,
   "version": 1,
   "versionNonce": 1,
   "isDeleted": false,
   "boundElements": [],
   "updated": 1,
   "link": null,
   "locked": false,
   "text": "model_fn",
   "fontSize": 12,
   "fontFamily": 1,
   "textAlign": "center",
   "verticalAlign": "middle",
   "containerId": "S3",
   "originalText": "model_fn",
   "autoResize": true
  },
  {
   "type": "text",
   "id": "S3_t2",
   "x": 400,
   "y": 160,
   "width": 144,
   "height": 18,
   "angle": 0,
   "strokeColor": "#1e1e1e",
   "backgroundColor": "transparent",
   "fillStyle": "solid",
   "strokeWidth": 1,
   "roughness": 1,
   "opacity": 100,
   "groupIds": [],
   "frameId": null,
   "roundness": null,
   "seed": 1,
   "version": 1,
   "versionNonce": 1,
   "isDeleted": false,
   "boundElements": [],
   "updated": 1,
   "link": null,
   "locked": false,
   "text": "input_fn",
   "fontSize": 12,
   "fontFamily": 1,
   "textAlign": "center",
   "verticalAlign": "middle",
   "containerId": "S3",
   "originalText": "input_fn",
   "autoResize": true
  },
  {
   "type": "rectangle",
   "id": "S4",
   "x": 580,
   "y": 90,
   "width": 160,
   "height": 120,
   "angle": 0,
   "strokeColor": "#1e1e1e",
   "backgroundColor": "#ffc9c9",
   "fillStyle": "solid",
   "strokeWidth": 2,
   "roughness": 1,
   "opacity": 100,
   "groupIds": [],
   "frameId": null,
   "roundness": {
    "type": 3
   },
   "seed": 1,
   "version": 1,
   "versionNonce": 1,
   "isDeleted": false,
   "boundElements": [
    {
     "id": "S4_t",
     "type": "text"
    }
   ],
   "updated": 1,
   "link": null,
   "locked": false
  },
  {
   "type": "text",
   "id": "S4_t0",
   "x": 580,
   "y": 120,
   "width": 144,
   "height": 18,
   "angle": 0,
   "strokeColor": "#1e1e1e",
   "backgroundColor": "transparent",
   "fillStyle": "solid",
   "strokeWidth": 1,
   "roughness": 1,
   "opacity": 100,
   "groupIds": [],
   "frameId": null,
   "roundness": null,
   "seed": 1,
   "version": 1,
   "versionNonce": 1,
   "isDeleted": false,
   "boundElements": [],
   "updated": 1,
   "link": null,
   "locked": false,
   "text": "4. Deploy SDK",
   "fontSize": 12,
   "fontFamily": 1,
   "textAlign": "center",
   "verticalAlign": "middle",
   "containerId": "S4",
   "originalText": "4. Deploy SDK",
   "autoResize": true
  },
  {
   "type": "text",
   "id": "S4_t1",
   "x": 580,
   "y": 140,
   "width": 144,
   "height": 18,
   "angle": 0,
   "strokeColor": "#1e1e1e",
   "backgroundColor": "transparent",
   "fillStyle": "solid",
   "strokeWidth": 1,
   "roughness": 1,
   "opacity": 100,
   "groupIds": [],
   "frameId": null,
   "roundness": null,
   "seed": 1,
   "version": 1,
   "versionNonce": 1,
   "isDeleted": false,
   "boundElements": [],
   "updated": 1,
   "link": null,
   "locked": false,
   "text": "SKLearnModel",
   "fontSize": 12,
   "fontFamily": 1,
   "textAlign": "center",
   "verticalAlign": "middle",
   "containerId": "S4",
   "originalText": "SKLearnModel",
   "autoResize": true
  },
  {
   "type": "text",
   "id": "S4_t2",
   "x": 580,
   "y": 160,
   "width": 144,
   "height": 18,
   "angle": 0,
   "strokeColor": "#1e1e1e",
   "backgroundColor": "transparent",
   "fillStyle": "solid",
   "strokeWidth": 1,
   "roughness": 1,
   "opacity": 100,
   "groupIds": [],
   "frameId": null,
   "roundness": null,
   "seed": 1,
   "version": 1,
   "versionNonce": 1,
   "isDeleted": false,
   "boundElements": [],
   "updated": 1,
   "link": null,
   "locked": false,
   "text": "ml.m5.large",
   "fontSize": 12,
   "fontFamily": 1,
   "textAlign": "center",
   "verticalAlign": "middle",
   "containerId": "S4",
   "originalText": "ml.m5.large",
   "autoResize": true
  },
  {
   "type": "rectangle",
   "id": "S5",
   "x": 760,
   "y": 90,
   "width": 160,
   "height": 120,
   "angle": 0,
   "strokeColor": "#1e1e1e",
   "backgroundColor": "#d0bfff",
   "fillStyle": "solid",
   "strokeWidth": 2,
   "roughness": 1,
   "opacity": 100,
   "groupIds": [],
   "frameId": null,
   "roundness": {
    "type": 3
   },
   "seed": 1,
   "version": 1,
   "versionNonce": 1,
   "isDeleted": false,
   "boundElements": [
    {
     "id": "S5_t",
     "type": "text"
    }
   ],
   "updated": 1,
   "link": null,
   "locked": false
  },
  {
   "type": "text",
   "id": "S5_t0",
   "x": 760,
   "y": 120,
   "width": 144,
   "height": 18,
   "angle": 0,
   "strokeColor": "#1e1e1e",
   "backgroundColor": "transparent",
   "fillStyle": "solid",
   "strokeWidth": 1,
   "roughness": 1,
   "opacity": 100,
   "groupIds": [],
   "frameId": null,
   "roundness": null,
   "seed": 1,
   "version": 1,
   "versionNonce": 1,
   "isDeleted": false,
   "boundElements": [],
   "updated": 1,
   "link": null,
   "locked": false,
   "text": "5. Test",
   "fontSize": 12,
   "fontFamily": 1,
   "textAlign": "center",
   "verticalAlign": "middle",
   "containerId": "S5",
   "originalText": "5. Test",
   "autoResize": true
  },
  {
   "type": "text",
   "id": "S5_t1",
   "x": 760,
   "y": 140,
   "width": 144,
   "height": 18,
   "angle": 0,
   "strokeColor": "#1e1e1e",
   "backgroundColor": "transparent",
   "fillStyle": "solid",
   "strokeWidth": 1,
   "roughness": 1,
   "opacity": 100,
   "groupIds": [],
   "frameId": null,
   "roundness": null,
   "seed": 1,
   "version": 1,
   "versionNonce": 1,
   "isDeleted": false,
   "boundElements": [],
   "updated": 1,
   "link": null,
   "locked": false,
   "text": "invoke_endpoint",
   "fontSize": 12,
   "fontFamily": 1,
   "textAlign": "center",
   "verticalAlign": "middle",
   "containerId": "S5",
   "originalText": "invoke_endpoint",
   "autoResize": true
  },
  {
   "type": "text",
   "id": "S5_t2",
   "x": 760,
   "y": 160,
   "width": 144,
   "height": 18,
   "angle": 0,
   "strokeColor": "#1e1e1e",
   "backgroundColor": "transparent",
   "fillStyle": "solid",
   "strokeWidth": 1,
   "roughness": 1,
   "opacity": 100,
   "groupIds": [],
   "frameId": null,
   "roundness": null,
   "seed": 1,
   "version": 1,
   "versionNonce": 1,
   "isDeleted": false,
   "boundElements": [],
   "updated": 1,
   "link": null,
   "locked": false,
   "text": "sagemaker-runtime",
   "fontSize": 12,
   "fontFamily": 1,
   "textAlign": "center",
   "verticalAlign": "middle",
   "containerId": "S5",
   "originalText": "sagemaker-runtime",
   "autoResize": true
  },
  {
   "type": "rectangle",
   "id": "S6",
   "x": 940,
   "y": 90,
   "width": 160,
   "height": 120,
   "angle": 0,
   "strokeColor": "#1e1e1e",
   "backgroundColor": "#c3fae8",
   "fillStyle": "solid",
   "strokeWidth": 2,
   "roughness": 1,
   "opacity": 100,
   "groupIds": [],
   "frameId": null,
   "roundness": {
    "type": 3
   },
   "seed": 1,
   "version": 1,
   "versionNonce": 1,
   "isDeleted": false,
   "boundElements": [
    {
     "id": "S6_t",
     "type": "text"
    }
   ],
   "updated": 1,
   "link": null,
   "locked": false
  },
  {
   "type": "text",
   "id": "S6_t0",
   "x": 940,
   "y": 120,
   "width": 144,
   "height": 18,
   "angle": 0,
   "strokeColor": "#1e1e1e",
   "backgroundColor": "transparent",
   "fillStyle": "solid",
   "strokeWidth": 1,
   "roughness": 1,
   "opacity": 100,
   "groupIds": [],
   "frameId": null,
   "roundness": null,
   "seed": 1,
   "version": 1,
   "versionNonce": 1,
   "isDeleted": false,
   "boundElements": [],
   "updated": 1,
   "link": null,
   "locked": false,
   "text": "6. Clean up",
   "fontSize": 12,
   "fontFamily": 1,
   "textAlign": "center",
   "verticalAlign": "middle",
   "containerId": "S6",
   "originalText": "6. Clean up",
   "autoResize": true
  },
  {
   "type": "text",
   "id": "S6_t1",
   "x": 940,
   "y": 140,
   "width": 144,
   "height": 18,
   "angle": 0,
   "strokeColor": "#1e1e1e",
   "backgroundColor": "transparent",
   "fillStyle": "solid",
   "strokeWidth": 1,
   "roughness": 1,
   "opacity": 100,
   "groupIds": [],
   "frameId": null,
   "roundness": null,
   "seed": 1,
   "version": 1,
   "versionNonce": 1,
   "isDeleted": false,
   "boundElements": [],
   "updated": 1,
   "link": null,
   "locked": false,
   "text": "delete-endpoint",
   "fontSize": 12,
   "fontFamily": 1,
   "textAlign": "center",
   "verticalAlign": "middle",
   "containerId": "S6",
   "originalText": "delete-endpoint",
   "autoResize": true
  },
  {
   "type": "text",
   "id": "S6_t2",
   "x": 940,
   "y": 160,
   "width": 144,
   "height": 18,
   "angle": 0,
   "strokeColor": "#1e1e1e",
   "backgroundColor": "transparent",
   "fillStyle": "solid",
   "strokeWidth": 1,
   "roughness": 1,
   "opacity": 100,
   "groupIds": [],
   "frameId": null,
   "roundness": null,
   "seed": 1,
   "version": 1,
   "versionNonce": 1,
   "isDeleted": false,
   "boundElements": [],
   "updated": 1,
   "link": null,
   "locked": false,
   "text": "delete-endpoint-config",
   "fontSize": 12,
   "fontFamily": 1,
   "textAlign": "center",
   "verticalAlign": "middle",
   "containerId": "S6",
   "originalText": "delete-endpoint-config",
   "autoResize": true
  },
  {
   "type": "arrow",
   "id": "a0",
   "x": 200,
   "y": 150,
   "width": 20,
   "height": 0,
   "angle": 0,
   "strokeColor": "#1e1e1e",
   "backgroundColor": "transparent",
   "fillStyle": "solid",
   "strokeWidth": 2,
   "roughness": 1,
   "opacity": 100,
   "groupIds": [],
   "frameId": null,
   "roundness": {
    "type": 2
   },
   "seed": 20,
   "version": 1,
   "versionNonce": 1,
   "isDeleted": false,
   "boundElements": [],
   "updated": 1,
   "link": null,
   "locked": false,
   "points": [
    [
     0,
     0
    ],
    [
     20,
     0
    ]
   ],
   "lastCommittedPoint": null,
   "startBinding": null,
   "endBinding": null,
   "startArrowhead": null,
   "endArrowhead": "arrow",
   "elbowed": false,
   "label": {
    "text": ""
   }
  },
  {
   "type": "arrow",
   "id": "a1",
   "x": 380,
   "y": 150,
   "width": 20,
   "height": 0,
   "angle": 0,
   "strokeColor": "#1e1e1e",
   "backgroundColor": "transparent",
   "fillStyle": "solid",
   "strokeWidth": 2,
   "roughness": 1,
   "opacity": 100,
   "groupIds": [],
   "frameId": null,
   "roundness": {
    "type": 2
   },
   "seed": 21,
   "version": 1,
   "versionNonce": 1,
   "isDeleted": false,
   "boundElements": [],
   "updated": 1,
   "link": null,
   "locked": false,
   "points": [
    [
     0,
     0
    ],
    [
     20,
     0
    ]
   ],
   "lastCommittedPoint": null,
   "startBinding": null,
   "endBinding": null,
   "startArrowhead": null,
   "endArrowhead": "arrow",
   "elbowed": false,
   "label": {
    "text": ""
   }
  },
  {
   "type": "arrow",
   "id": "a2",
   "x": 560,
   "y": 150,
   "width": 20,
   "height": 0,
   "angle": 0,
   "strokeColor": "#1e1e1e",
   "backgroundColor": "transparent",
   "fillStyle": "solid",
   "strokeWidth": 2,
   "roughness": 1,
   "opacity": 100,
   "groupIds": [],
   "frameId": null,
   "roundness": {
    "type": 2
   },
   "seed": 22,
   "version": 1,
   "versionNonce": 1,
   "isDeleted": false,
   "boundElements": [],
   "updated": 1,
   "link": null,
   "locked": false,
   "points": [
    [
     0,
     0
    ],
    [
     20,
     0
    ]
   ],
   "lastCommittedPoint": null,
   "startBinding": null,
   "endBinding": null,
   "startArrowhead": null,
   "endArrowhead": "arrow",
   "elbowed": false,
   "label": {
    "text": ""
   }
  },
  {
   "type": "arrow",
   "id": "a3",
   "x": 740,
   "y": 150,
   "width": 20,
   "height": 0,
   "angle": 0,
   "strokeColor": "#1e1e1e",
   "backgroundColor": "transparent",
   "fillStyle": "solid",
   "strokeWidth": 2,
   "roughness": 1,
   "opacity": 100,
   "groupIds": [],
   "frameId": null,
   "roundness": {
    "type": 2
   },
   "seed": 23,
   "version": 1,
   "versionNonce": 1,
   "isDeleted": false,
   "boundElements": [],
   "updated": 1,
   "link": null,
   "locked": false,
   "points": [
    [
     0,
     0
    ],
    [
     20,
     0
    ]
   ],
   "lastCommittedPoint": null,
   "startBinding": null,
   "endBinding": null,
   "startArrowhead": null,
   "endArrowhead": "arrow",
   "elbowed": false,
   "label": {
    "text": ""
   }
  },
  {
   "type": "arrow",
   "id": "a4",
   "x": 920,
   "y": 150,
   "width": 20,
   "height": 0,
   "angle": 0,
   "strokeColor": "#1e1e1e",
   "backgroundColor": "transparent",
   "fillStyle": "solid",
   "strokeWidth": 2,
   "roughness": 1,
   "opacity": 100,
   "groupIds": [],
   "frameId": null,
   "roundness": {
    "type": 2
   },
   "seed": 24,
   "version": 1,
   "versionNonce": 1,
   "isDeleted": false,
   "boundElements": [],
   "updated": 1,
   "link": null,
   "locked": false,
   "points": [
    [
     0,
     0
    ],
    [
     20,
     0
    ]
   ],
   "lastCommittedPoint": null,
   "startBinding": null,
   "endBinding": null,
   "startArrowhead": null,
   "endArrowhead": "arrow",
   "elbowed": false,
   "label": {
    "text": ""
   }
  },
  {
   "type": "rectangle",
   "id": "note",
   "x": 40,
   "y": 300,
   "width": 1060,
   "height": 120,
   "angle": 0,
   "strokeColor": "#1e1e1e",
   "backgroundColor": "#e9ecef",
   "fillStyle": "solid",
   "strokeWidth": 2,
   "roughness": 1,
   "opacity": 100,
   "groupIds": [],
   "frameId": null,
   "roundness": {
    "type": 3
   },
   "seed": 1,
   "version": 1,
   "versionNonce": 1,
   "isDeleted": false,
   "boundElements": [
    {
     "id": "note_t",
     "type": "text"
    }
   ],
   "updated": 1,
   "link": null,
   "locked": false
  },
  {
   "type": "text",
   "id": "note_t0",
   "x": 40,
   "y": 328,
   "width": 1044,
   "height": 19,
   "angle": 0,
   "strokeColor": "#1e1e1e",
   "backgroundColor": "transparent",
   "fillStyle": "solid",
   "strokeWidth": 1,
   "roughness": 1,
   "opacity": 100,
   "groupIds": [],
   "frameId": null,
   "roundness": null,
   "seed": 1,
   "version": 1,
   "versionNonce": 1,
   "isDeleted": false,
   "boundElements": [],
   "updated": 1,
   "link": null,
   "locked": false,
   "text": "IAM role: s3:GetObject/PutObject + sagemaker:CreateModel/CreateEndpoint",
   "fontSize": 13,
   "fontFamily": 1,
   "textAlign": "center",
   "verticalAlign": "middle",
   "containerId": "note",
   "originalText": "IAM role: s3:GetObject/PutObject + sagemaker:CreateModel/CreateEndpoint",
   "autoResize": true
  },
  {
   "type": "text",
   "id": "note_t1",
   "x": 40,
   "y": 349,
   "width": 1044,
   "height": 19,
   "angle": 0,
   "strokeColor": "#1e1e1e",
   "backgroundColor": "transparent",
   "fillStyle": "solid",
   "strokeWidth": 1,
   "roughness": 1,
   "opacity": 100,
   "groupIds": [],
   "frameId": null,
   "roundness": null,
   "seed": 1,
   "version": 1,
   "versionNonce": 1,
   "isDeleted": false,
   "boundElements": [],
   "updated": 1,
   "link": null,
   "locked": false,
   "text": "inference.py must define model_fn, input_fn, predict_fn, output_fn",
   "fontSize": 13,
   "fontFamily": 1,
   "textAlign": "center",
   "verticalAlign": "middle",
   "containerId": "note",
   "originalText": "inference.py must define model_fn, input_fn, predict_fn, output_fn",
   "autoResize": true
  },
  {
   "type": "text",
   "id": "note_t2",
   "x": 40,
   "y": 370,
   "width": 1044,
   "height": 19,
   "angle": 0,
   "strokeColor": "#1e1e1e",
   "backgroundColor": "transparent",
   "fillStyle": "solid",
   "strokeWidth": 1,
   "roughness": 1,
   "opacity": 100,
   "groupIds": [],
   "frameId": null,
   "roundness": null,
   "seed": 1,
   "version": 1,
   "versionNonce": 1,
   "isDeleted": false,
   "boundElements": [],
   "updated": 1,
   "link": null,
   "locked": false,
   "text": "endpoint costs ~$0.20/hr (ml.m5.large) even idle - delete when not in use",
   "fontSize": 13,
   "fontFamily": 1,
   "textAlign": "center",
   "verticalAlign": "middle",
   "containerId": "note",
   "originalText": "endpoint costs ~$0.20/hr (ml.m5.large) even idle - delete when not in use",
   "autoResize": true
  }
 ],
 "appState": {
  "gridSize": null
 }
}
```
&lt;!-- SageMaker deployment pipeline -->
## References

- [How to Deploy Your ML Model to AWS (Step-by-Step Guide) — DEV.to](https://dev.to/shresthapandey/how-to-deploy-your-ml-model-to-aws-step-by-step-guide-af9)
- [Inference cost optimization best practices — AWS SageMaker docs](https://docs.aws.amazon.com/sagemaker/latest/dg/inference-cost-optimization.html)
- [Automatic scaling of SageMaker models — AWS docs](https://docs.aws.amazon.com/sagemaker/latest/dg/endpoint-auto-scaling.html)
- [How to set up cloud budget alerts on AWS/GCP/Azure — DEV.to](https://dev.to/muskan_8abedcc7e12/how-to-set-up-cloud-budget-alerts-on-aws-gcp-azure-4ne) (companion cost-control note)
