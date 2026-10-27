---
title: How to Attribute AWS Bedrock Costs per IAM Principal (and Set Budgets)
diataxis: How-to Guide
domain: cloud-infrastructure
topic: finops
source: HackerNews
source_url: https://dev.to/minnogit/access-control-and-cost-monitoring-for-llm-models-on-aws-bedrock-20og
date: 2026-10-27
keywords:
- knowledge-base
- finops
- cloud-infrastructure
- how-to
---
# How to Attribute AWS Bedrock Costs per IAM Principal (and Set Budgets)

Bedrock records the identity behind each call (IAM user or role), and that identity reaches **Cost Explorer without changing the policy or the app code**. Cost-allocation tags on the principal add a grouping dimension (team/app/device) on top.

## Step 1 — Least-privilege model access
Per-model ARNs in the policy (closed list beats wildcards for device-installed apps): `bedrock:InvokeModel`, `bedrock:InvokeModelWithResponseStream`, `bedrock:GetFoundationModel` with `Resource: arn:aws:bedrock:<region>::foundation-model/<model-id>` per model.

## Step 2 — Tag the principal
```bash
aws iam tag-user --user-name <user-name> --tags Key=bedrock,Value=tablet
```
Multiple users can share the `bedrock` key with different values (`tablet`, `inno`) — one dimension, values tell them apart.

## Step 3 — Activate as a cost allocation tag
Billing → **Cost allocation tags** → filter type **IAM principal** → activate the tag.
- Must run from the **management account** (or a standalone account); member accounts get `Cost allocation tags are managed at the payer account level`.
- In cost data the tag appears as `iamPrincipal/bedrock`.
- Latency gotchas: the tag appears only after the user's first Bedrock call; activation is **not retroactive**; expect up to ~24h to appear + ~24h to activate + up to another 24h before cost data flows.

## Step 4 — Read it back
- **Cost Explorer**: filter service = Amazon Bedrock, group by `iamPrincipal/bedrock`. Granularity = cost per usage type per day (no per-request cost — enable Bedrock invocation logs for that).
- **CUR 2.0**: create a **new** Data Export with *Include caller identity (IAM principal) allocation data* — adds the `line_item_iam_principal` column.

## Step 5 — Budget + alert
AWS Budgets custom cost budget: recurring monthly period, scope by tag `iamPrincipal/bedrock` (include the "untagged" value), service filter Amazon Bedrock, alert at 80% via email.
- A tag-only budget misses untagged spend — the service filter closes that gap (all Bedrock spend, tagged or not).
- Budgets only **alert**, they never block: for hard stops, add a threshold action or revoke the user's credentials.

## Gotchas
- **Gateway in between** (LiteLLM, API Gateway, custom service): cost lands on the gateway's role — pass **session tags** when the gateway assumes the role to keep per-user attribution.
- **Long-lived IAM keys in an APK** are extractable — prefer temporary credentials (same attribution options).
- Combine identity attribution with **application inference profiles** when you also need per-application splits (add the profiles' ARNs and the models' ARNs to the policy).

## Timeline (verified 2026-10-27)
- **April 2026**: capability launched for the `bedrock-runtime` endpoint (IAM user/role cost allocation, Cost Explorer grouping, CUR 2.0 line-item level).
- **August 11, 2026**: AWS expanded IAM principal cost allocation to the **`bedrock-mantle` endpoint** — the same tag-based attribution now covers inference requests made through bedrock-mantle, available in all Regions where that endpoint is available. If you route calls through bedrock-mantle (e.g., agent/multi-model workloads), your per-principal budgets should include that spend — check both endpoints before assuming the `Amazon Bedrock` service filter covers everything.

## References
- [Access control and cost monitoring for LLM models on AWS Bedrock (DEV.to)](https://dev.to/minnogit/access-control-and-cost-monitoring-for-llm-models-on-aws-bedrock-20og)
- [IAM principal cost attribution in Amazon Bedrock (AWS docs)](https://docs.aws.amazon.com/bedrock/latest/userguide/cost-mgmt-iam-principal-tracking.html)
- [IAM principal cost allocation in AWS Billing](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/iam-principal-cost-allocation.html)
- [Track Amazon Bedrock costs by caller identity (AWS FinOps blog)](https://aws.amazon.com/blogs/aws-cloud-financial-management/track-amazon-bedrock-costs-by-caller-identity-with-iam-based-cost-allocation/)
- [Amazon Bedrock now supports cost allocation by IAM user and role (AWS What's New, April 2026)](https://aws.amazon.com/about-aws/whats-new/2026/04/bedrock-iam-cost-allocation/)
- [Amazon Bedrock expands IAM principal cost allocation to the bedrock-mantle endpoint (AWS What's New, Aug 2026)](https://aws.amazon.com/about-aws/whats-new/2026/08/amazon-bedrock-expands-iam-principal-cost-allocation-bedrock-mantle/)
