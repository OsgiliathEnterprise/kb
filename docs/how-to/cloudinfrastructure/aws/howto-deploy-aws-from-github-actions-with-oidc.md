---
title: How to Deploy to AWS from GitHub Actions Without Long-Lived Keys — OIDC, Controls,
  and a Tested Rollback
diataxis: How-to Guide
domain: cloud-infrastructure
topic: aws
source: DEV.to Tech News
source_url: https://dev.to/jcbone16/deployer-sur-aws-avec-github-actions-sans-cles-dacces-oidc-controles-et-un-retour-arriere-3gja
date: 2026-09-25
keywords:
- knowledge-base
- aws
- cloud-infrastructure
- how-to
---
# How to Deploy to AWS from GitHub Actions Without Long-Lived Keys — OIDC, Controls, and a Tested Rollback

A production pipeline exists to move deployment knowledge out of one person's head and into the repo — in a form the whole team can read, run, and **undo**. This pattern (containerized app on ECS) rests on three ideas: no long-lived AWS keys in GitHub (OIDC instead), explicit controls before and after deploy, and a rollback that is written down and executed at least once before it's needed.

## Step 0: Write the scope before any YAML

Before the first line of workflow, pin down: which repos/branches trigger deploys; which artifact goes to production (Docker image, static bundle); which AWS account/region; which controls are blocking (tests, lint, review, manual approval); what "rollback" means in your context (redeploy previous version? restore a database?) and what is **not** reversible; and the completion criterion — the pipeline is done when *another team member* has re-run it themselves, not when its author got one deploy through.

## Step 1: Connect to AWS without secrets via OIDC

GitHub Actions can obtain a signed OIDC token per run; AWS exchanges it for temporary credentials of an IAM role. No `AWS_SECRET_ACCESS_KEY` in repo secrets — nothing to rotate or leak. One-time AWS setup:

1. Create an **OIDC identity provider** for `https://token.actions.githubusercontent.com`, audience `sts.amazonaws.com`.
2. Create **two roles**: one for build+push (branch `main`), one for deploy (GitHub environment `production`).

Trust policy for the deploy role — the important part is the `sub` condition, so only a job of *this repo* running in the *production environment* can assume it:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {
      "Federated": "arn:aws:iam::123456789012:oidc-provider/token.actions.githubusercontent.com"
    },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": {
        "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
        "token.actions.githubusercontent.com:sub": "repo:mon-org/mon-depot:environment:production"
      }
    }
  }]
}
```

For the build role, `sub` becomes `repo:mon-org/mon-depot:ref:refs/heads/main`. Least-privilege permissions to grant (adjust per project):

- **Build role**: `ecr:GetAuthorizationToken` + push actions on the target ECR repo (`ecr:BatchCheckLayerAvailability`, `ecr:InitiateLayerUpload`, `ecr:UploadLayerPart`, `ecr:CompleteLayerUpload`, `ecr:PutImage`)
- **Deploy role**: `ecs:RegisterTaskDefinition`, `ecs:UpdateService`, `ecs:DescribeServices`, `ecr:DescribeImages` (needed for the rollback check), and `iam:PassRole` limited to the app's ECS task/execution roles

## Step 2: The deployment workflow

```yaml
name: deploy-production

on:
  push:
    branches: [main]

permissions:
  contents: read
  id-token: write   # required to obtain the OIDC token

concurrency:
  group: deploy-production
  cancel-in-progress: false   # never two deploys in parallel

env:
  AWS_REGION: eu-west-3
  ECR_REPOSITORY: mon-app
  ECS_CLUSTER: mon-cluster
  ECS_SERVICE: mon-service
  CONTAINER_NAME: app

jobs:
  checks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: make lint
      - run: make test

  build:
    needs: checks
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ vars.AWS_BUILD_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}
      - id: ecr
        uses: aws-actions/amazon-ecr-login@v2
      - name: Build and push image (tag = commit SHA)
        env:
          REGISTRY: ${{ steps.ecr.outputs.registry }}
        run: |
          docker build -t "$REGISTRY/$ECR_REPOSITORY:$GITHUB_SHA" .
          docker push "$REGISTRY/$ECR_REPOSITORY:$GITHUB_SHA"

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: production   # environment protection rules (approval, etc.)
    steps:
      - uses: actions/checkout@v4
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ vars.AWS_DEPLOY_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}
      - id: render
        uses: aws-actions/amazon-ecs-render-task-definition@v1
        with:
          task-definition: deploy/task-definition.json
          container-name: ${{ env.CONTAINER_NAME }}
          image: ${{ vars.ECR_REGISTRY }}/${{ env.ECR_REPOSITORY }}:${{ github.sha }}
      - uses: aws-actions/amazon-ecs-deploy-task-definition@v2
        with:
          task-definition: ${{ steps.render.outputs.task-definition }}
          cluster: ${{ env.ECS_CLUSTER }}
          service: ${{ env.ECS_SERVICE }}
          wait-for-service-stability: true
      - name: Smoke test
```

Key details: `id-token: write` is what enables OIDC; the `concurrency` group serializes deploys; image tags are commit SHAs (not `latest`) so rollback = redeploying a known-good SHA; the deploy job's `environment: production` hooks into GitHub environment protection rules for manual approval.

## Step 3: Rollback that has actually been executed

The rollback path is written in the repo and **run at least once deliberately** before it's needed — an untested rollback is just a hope. Because images are SHA-tagged, rolling back means rendering the previous task definition with the last known-good image and redeploying; the deploy role's `ecr:DescribeImages` permission exists precisely so the pipeline can verify that image still exists before attempting this.

## References

- [DEV.to — Déployer sur AWS avec GitHub Actions sans clés d'accès : OIDC, contrôles et un retour arrière vraiment testé](https://dev.to/jcbone16/deployer-sur-aws-avec-github-actions-sans-cles-dacces-oidc-controles-et-un-retour-arriere-3gja)
