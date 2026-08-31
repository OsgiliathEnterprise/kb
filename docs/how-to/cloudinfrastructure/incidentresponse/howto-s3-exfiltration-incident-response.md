---
title: 'Stopping S3 Data Exfiltration in Real Time: A Step-by-Step IR'
diataxis: How-to Guide
domain: cloud-infrastructure
topic: incident-response
source: DEV.to Tech News
source_url: https://dev.to/nghidanh2005/-stopping-s3-data-exfiltration-in-real-time-a-step-by-step-incident-response-2jp
date: 2026-08-25
keywords:
- knowledge-base
- incident-response
- cloud-infrastructure
- how-to
---
# Stopping S3 Data Exfiltration in Real Time: A Step-by-Step IR

**Scenario.** An EC2 instance with an attached IAM role has `s3:GetObject` on a
bucket of sensitive data. The instance is compromised, the attacker extracts
temporary credentials from the metadata service, and begins bulk-downloading.
GuardDuty fires `Exfiltration:S3/AnomalousBehavior`. The team needs 4 hours to
patch — you need to cut off access *now*.

## Step 1: Confirm the compromised role

Identify which IAM role is on the instance (instance ID comes from the
GuardDuty finding):

```bash
aws ec2 describe-i-instance-profile ... \
  --query "Reservations[0].Instances[0].IamInstanceProfile.Arn"
# -> arn:aws:iam::123456789012:instance-profile/ProdDataAccessRole

aws iam get-instance-profile \
  --instance-profile-name ProdDataAccessRole \
  --query "InstanceProfile.Roles[0].RoleName"
# -> ProdDataAccessRole
```

## Step 2: Revoke all active sessions

This is the critical action. `revoke-sessions` on the role invalidates every set
of temporary credentials issued before the current timestamp:

```bash
aws iam put-role-policy \
  --role-name ProdDataAccessRole \
  --policy-name AWSRevokeOlderSessions \
  --policy-document '{
    "Effect": "Deny",
    "Action": ["*"],
    "Condition": { "DateGreaterThan": { "aws:TokenIssueTime": "2026-08-23T12:00:00Z" } }
  }'
```

Console shortcut: IAM -> Roles -> select role -> Revoke Sessions -> Revoke active
sessions (attaches the inline deny policy automatically).

**Under the hood:** every call with temporary credentials carries an
`aws:TokenIssueTime` claim. The inline policy denies all actions for credential
sets issued before the timestamp. The deny is evaluated on every request and is
effective immediately — **no propagation delay**.

## Step 3: Validate the revocation

```bash
aws iam get-role-policy --role-name ProdDataAccessRole --policy-name AWSRevokeOlderSessions
```

Then confirm the bulk-download rate in CloudTrail drops, and re-check the
GuardDuty finding.

## Why this is the right first move

Revoking at the *role* level kills the stolen temporary credentials without
touching the (potentially still-needed) instance or the bucket. It is
immediate, reversible (remove the inline policy), and leaves a clean audit
trail of who revoked what and when.

## Detection side: GuardDuty S3 Protection

The `Exfiltration:S3/AnomalousBehavior` finding in the scenario comes from
GuardDuty **S3 Protection**, which correlates CloudTrail **data events**
(object-level API calls, not just management events) with account and network
signals to flag anomalous bulk access. For that detection to fire, S3 data
event logging must be enabled on the affected bucket — a common gap, since
data events are disabled by default and are billed per request. See
[AWS GuardDuty S3 Protection docs](https://docs.aws.amazon.com/guardduty/latest/ug/s3-protection.html).

## References

- [Stopping S3 Data Exfiltration in Real Time (dev.to)](https://dev.to/nghidanh2005/-stopping-s3-data-exfiltration-in-real-time-a-step-by-step-incident-response-2jp)
- [AWS GuardDuty S3 Protection documentation](https://docs.aws.amazon.com/guardduty/latest/ug/s3-protection.html)
- [AWS News Blog: Using Amazon GuardDuty to protect your S3 buckets](https://aws.amazon.com/blogs/aws/new-using-amazon-guardduty-to-protect-your-s3-buckets/)

## Related
- [[howto-cicd-compromise-response-jetbrains-cadence]]
- [[explanation-openai-hugging-face-agent-incident]]
- [[explanation-ssl-tls-three-jobs]]
