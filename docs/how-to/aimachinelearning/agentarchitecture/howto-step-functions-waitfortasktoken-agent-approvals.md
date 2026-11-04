---
title: Human-in-the-Loop Agent Approvals with Step Functions .waitForTaskToken
diataxis: How-to Guide
domain: ai-machine-learning
topic: agent-architecture
source: DEV.to Tech News
source_url: https://dev.to/sascha-ms/human-in-the-loop-for-ai-agents-with-step-functions-2pn5
date: 2026-11-04
keywords:
- knowledge-base
- agent-architecture
- ai-machine-learning
- how-to
---
# Human-in-the-Loop Agent Approvals with Step Functions .waitForTaskToken

When an AI agent stops only writing text and starts taking irreversible or costly actions (refunds, deletions, external communications), approvals must live **in the workflow, not in the prompt**. A language model can forget, misread, or be prompt-injected out of "ask before refunding more than €20"; a Choice rule in Step Functions cannot be talked out of it.

This note builds on the conceptual companion note [[explanation-human-in-the-loop-approval-gates]] and turns it into a concrete AWS implementation using the **Wait for Callback (`.waitForTaskToken`)** integration pattern. See diagram: `howto-step-functions-waitfortasktoken-agent-approvals.excalidraw`.

## Risk-tier the actions first

Sort actions by two questions: *can it be undone?* and *how expensive is a mistake?* Requiring approval for everything turns approvers into autopilot "yes" clickers within days — you get the cost without the protection.

Example tiers for a support agent at an online bookshop:

| Amount | Behaviour |
| --- | --- |
| ≤ €20 | Workflow applies the credit directly (decision `"auto"`) |
| €20.01 – €500 | Support team must approve; escalates to team lead after 4 h |
| > €500 | Workflow stops — the agent is not even allowed to ask |

## How the callback pattern works

Appending `.waitForTaskToken` to an optimized service integration resource makes Step Functions mint a **task token**, hand it to the called service, and pause:

```json
{
  "AskTeam": {
    "Type": "Task",
    "Resource": "arn:aws:states:::lambda:invoke.waitForTaskToken",
    "Parameters": {
      "FunctionName": "arn:aws:lambda:REGION:ACCOUNT:function:request-approval",
      "Payload": {
        "TaskToken.$": "$$.Task.Token",
        "request.$": "$.request"
      }
    },
    "TimeoutSeconds": 14400,
    "Catch": [{ "ErrorEquals": ["States.Timeout"], "Next": "AskLead" }],
    "Next": "ApplyCredit"
  }
}
```

- The step resumes only when someone calls `SendTaskSuccess` or `SendTaskFailure` with exactly that token (`$$.Task.Token` from the Context object).
- **Waiting is free** in Standard workflows: billing is per state transition (~$0.000025 per transition in us-east-1), so waiting three days costs the same as continuing in three seconds. Single-execution ceiling is **one year**. Express workflows do **not** support the callback pattern.
- AWS docs confirm the hard limits: `taskToken` max 2048 chars, `SendTaskSuccess` `output` max 262144 bytes; tokens must be returned by principals **in the same AWS account**; a timed-out callback task gets a **new random token** (so cache tokens per attempt), and `HeartbeatSeconds` guards against stuck executions with a `States.Timeout` error.

## The task token is a master key — the agent must never hold it

Anyone who knows a task token and holds the IAM permission `states:SendTaskSuccess` can complete the step **and pass arbitrary data as its result**. Treat it like a password:

- The token goes to DynamoDB (with an `attribute_not_exists` condition so a second call cannot overwrite it) and **never** into emails or notifications — the SNS message to the team contains only an opaque approval ID (UUID).
- The decider's request goes, signed, to a **second Lambda** that looks the token up in the table and calls `SendTaskSuccess`.
- The agent's IAM role can start executions and read the status of its own executions. It never sees a token, cannot call the decision function, and `states:SendTaskSuccess` does not appear in its role at all.

**Separation of duties: the agent requests, only a human confirms.**

## Build steps (Serverless Framework v4 + TypeScript)

```bash
mkdir credit-approval && cd credit-approval
npm init -y
npm i @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb @aws-sdk/client-sfn @aws-sdk/client-sns
npm i -D typescript @types/node @types/aws-lambda vitest aws-sdk-client-mock asl-validator jsonata
mkdir -p src statemachine test scripts
```

Prerequisites: Node.js ≥ 22, AWS CLI v2, Serverless Framework v4 (`npm i -g serverless`, builds TypeScript handlers with esbuild), `curl` ≥ 7.75 and `jq` for the approval script. Set `"type": "module"` in `package.json`.

Key implementation points from the walkthrough:

1. **Validate the decision strictly before anything else** — `approvalId` must match a UUID (`/^[0-9a-f-]{36}$/`), `decision` must be exactly `approved` or `rejected`, comments truncated to 500 chars.
2. **`request-approval` Lambda** (invoked with the token): `PutCommand` the `{taskToken, stage, executionId, request}` record into DynamoDB with `attribute_not_exists` condition, then publish an SNS message carrying only the approval ID.
3. **`decide` Lambda**: triggered by a signed request from the human (never the agent), maps approval ID → stored token, calls `SendTaskSuccess` with the decision payload.
4. **Timeout escalation**: `TimeoutSeconds: 14400` (4 h) on `AskTeam` + `Catch` → `AskLead`; if the lead also stays silent, the workflow ends with a custom `ApprovalExpired` error and nothing is booked.
5. **Audit retention**: keep approval records ~7 days after the deadline (`KEEP_SECONDS = 7 * 24 * 3600`).
6. **Test the ASL**: validate the state machine JSON with `asl-validator` and mock AWS SDK calls with `aws-sdk-client-mock` in `vitest`.

## Pitfalls checklist

- Express workflows silently lack callback support — use Standard.
- Do not put the task token in email/SNS bodies, agent tool results, or logs.
- Keep your own copy of workflow state; on timeout the token is regenerated, so stale cached tokens fail with `InvalidToken`/`TaskTimedOut`.
- Approval rules in prompts are advisory; only workflow-level Choice rules are enforceable.

## References

- Original article: [Human in the Loop for AI Agents with Step Functions (DEV.to)](https://dev.to/sascha-ms/human-in-the-loop-for-ai-agents-with-step-functions-2pn5)
- AWS docs: [Service integration patterns — Wait for Callback with Task Token](https://docs.aws.amazon.com/step-functions/latest/dg/connect-to-resource.html)
- AWS API reference: [SendTaskSuccess](https://docs.aws.amazon.com/step-functions/latest/apireference/API_SendTaskSuccess.html)
- AWS docs: [Lambda callback integration (lambda:invoke.waitForTaskToken)](https://docs.aws.amazon.com/step-functions/latest/dg/connect-lambda.html)
- Related KB note: [[explanation-human-in-the-loop-approval-gates]] (conceptual risk-tiering design)
