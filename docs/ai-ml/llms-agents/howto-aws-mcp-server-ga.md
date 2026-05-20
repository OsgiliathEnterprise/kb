---
title: "The AWS MCP Server is Now Generally Available"
description: "The AWS MCP Server is Now Generally Available"
tags: [howto,guide, AI & Machine Learning]
date: 2026-05-17
sidebar_label: The AWS MCP Server is Now Generally Available
---


# The AWS MCP Server is Now Generally Available

## Summary
AWS announces the general availability of the **AWS MCP Server**, a managed remote Model Context Protocol (MCP) server that gives AI agents and coding assistants secure, authenticated access to all AWS services. Part of the Agent Toolkit for AWS, it solves core problems: outdated training data, lack of real-time documentation, overly broad IAM policies, and context window exhaustion.

## Why This Matters
The combination of current documentation, authenticated API access, and sandboxed script execution in a single server shifts AI agents from demo-capable to production-ready. When tested with Anthropic Opus 4.6 (knowledge cutoff: May 2025), the MCP Server enabled the model to successfully query live documentation and return correct, up-to-date solutions for recently launched services like Amazon S3 Vectors.

## Key Points
- **15,000+ AWS API operations** accessible via `call_aws` tool
- **Real-time documentation** via `search_documentation` and `read_documentation` (no auth required)
- **Sandboxed Python execution** via `run_script` — zero network access, no local filesystem/shell
- **IAM Context Keys** for fine-grained access without separate IAM permissions
- **CloudWatch metrics** under `AWS-MCP` namespace isolate agent calls from human calls
- **CloudTrail** captures all API calls for complete audit trails
- **No additional charge** — pay only for AWS resources created and data transfer
- Available in US East (N. Virginia) and Europe (Frankfurt)

## How to Set Up AWS MCP Server

### Prerequisites
- `uv` package manager installed
- AWS credentials with appropriate IAM permissions
- MCP-compatible client (Claude Code, Kiro, Cursor, Codex, etc.)

### Installation Steps
```bash
# 1. Install uv package manager
curl -LsSf https://astral.sh/uv/install.sh | sh

# 2. Configure MCP Server for Claude Code (example)
claude mcp add-json aws-mcp --scope user \
   '{"command":"uvx","args":["mcp-proxy-for-aws@latest","https://aws-mcp.us-east-1.api.aws/mcp","--metadata","AWS_REGION=us-west-2"]}'

# Configuration breakdown:
# --scope user: Makes server available across all local projects
# uvx mcp-proxy-for-aws: Launches the auth bridge (MCP only supports OAuth 2.1, AWS uses IAM/SigV4)
# Endpoint: https://aws-mcp.us-east-1.api.aws/mcp
# --metadata: Passes target AWS Region to the server
```

### Core Tool Usage
```bash
# call_aws: Execute any AWS API operation using existing IAM credentials
# search_documentation: Search AWS docs at query time (no auth needed)
# read_documentation: Read specific AWS documentation pages
# run_script: Execute Python scripts in sandboxed environment
#   - Inherits IAM permissions
#   - Zero network access
#   - No local filesystem/shell access
#   - Chains multiple API calls in single round-trip
```

## Security & Enterprise Features
- **Permission separation**: Humans can perform mutating operations while MCP server is restricted to read-only
- **IAM Context Keys**: Fine-grained access via standard IAM policies — no separate permission management
- **Audit & compliance**: CloudWatch metrics + CloudTrail for complete visibility
- **Token efficiency**: Reduced tokens per interaction, optimizing costs for complex multi-step workflows
- **VPC Endpoint Support (Upcoming)**: Private network communication for regulated industries (financial services, healthcare) with two-stage authorization

### IAM Context Key Best Practices (Updated May 2026)
Two standardized context keys available across all AWS-managed MCP servers:
- **`aws:ViaAWSMCPService`** (`boolean`): Set to `true` when request originates through any AWS-managed MCP server
- **`aws:CalledViaAWSMCP`** (`string`): Contains the service principal of the specific MCP server (e.g., `aws-mcp.amazonaws.com`)

**Recommended Policy Pattern — Deny Destructive Actions via MCP:**
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "DenyDeleteWhenAccessedViaMCP",
    "Effect": "Deny",
    "Action": ["s3:DeleteObject", "s3:DeleteBucket", "ec2:TerminateInstances"],
    "Resource": "*",
    "Condition": {
      "Bool": {"aws:ViaAWSMCPService": "true"}
    }
  }]
}
```

## Common Pitfalls
- **Authentication bridge required**: MCP only supports OAuth 2.1, but AWS uses IAM & SigV4 — always use the MCP Proxy for AWS
- **Region configuration**: The endpoint is region-specific — ensure `--metadata AWS_REGION` matches your target region
- **Sandboxed script limitations**: `run_script` has zero network access — scripts can only call AWS APIs, not external services
- **IAM scoping**: Overly broad IAM policies defeat the purpose — use IAM Context Keys for fine-grained control
- **No MCP-specific actions needed**: The simplified authorization model means you no longer need separate IAM actions like `aws-mcp:InvokeMCP` — use existing service-level permissions with context key conditions

## Related Topics
- [howto-anthropic-routines-claude](Anthropic Routines for Claude Code)
- [tutorial-aws-found-bugs-in-60-of-software-requirements](AWS Requirements Analysis)

## References
- 📰 Original: [The AWS MCP Server is now generally available](https://aws.amazon.com/blogs/aws/the-aws-mcp-server-is-now-generally-available/) via AWS (2026-05-17)
- 🔍 [AWS MCP Server User Guide](https://docs.aws.amazon.com/agent-toolkit/latest/userguide/mcp-server.html)
- 🔍 [MCP Proxy for AWS (GitHub)](https://github.com/aws/mcp-proxy-for-aws)
- 🔍 [Agent Toolkit for AWS](https://aws.amazon.com/products/developer-tools/agent-toolkit-for-aws/)

---
*Auto-generated by Hermes Agent daily digest*
