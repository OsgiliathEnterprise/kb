---
title: Measuring LLM Guardrails — Shieldstral Classifier Contracts, Score Normalization,
  and Threshold Evaluation in Quarkus
diataxis: Tutorial
domain: AI-LLM
topic: LLM-Evaluation
source: DEV.to Tech News
source_url: https://dev.to/myfear/measure-your-llm-guardrails-a-java-example-with-shieldstral-cfg
date: 2026-10-15
keywords:
- knowledge-base
- LLM-Evaluation
- AI-LLM
- tutorials
---
# Measuring LLM Guardrails — Shieldstral Classifier Contracts, Score Normalization, and Threshold Evaluation in Quarkus

An isolated security-lab simulation request can fit an internal research assistant while falling outside a public customer-support assistant's policy. When both entry points share one answering model, **the policy decision has to happen before generation**. This tutorial follows the "BoundaryDesk" example built by an IBM Developer author: Mistral's **Shieldstral** classifier scores input *and* output against a supplied policy, with Quarkus LangChain4j wiring the answering model and guardrails together. The deterministic tests cover the request path; a separate real-model evaluation checks the classifier against examples from your own product.

## What you will build

Two policy surfaces over one stack:

| Surface | Allows | Blocks |
| --- | --- | --- |
| `public-support` | product/account questions | credentials, payment data, personal data, malware, evasion, unauthorized access, offensive-security guidance — *even when framed as testing* |
| `security-research` | defensive analysis, incident response, threat detection, isolated-lab simulations | live credentials, real personal data, third-party targeting, uncontrolled exploitation, evasion, direct harm |

Pinned stack: Java 21, Quarkus 3.38.1, Quarkus LangChain4j 1.12.2, upstream LangChain4j 1.17.2, vLLM 0.26.0. The real-model path needs a Linux host with an NVIDIA GPU, Podman, a Hugging Face token with checkpoint access, and a Mistral API key — but the deterministic tests run without any of that.

## Step 1 — Create the Quarkus application

```bash
quarkus create app com.ibm.developer:shieldstral-policy-gate \
    --platform-bom=io.quarkus.platform:quarkus-bom:3.38.1 \
    --extension=rest-jackson \
    --extension=io.quarkiverse.langchain4j:quarkus-langchain4j-mistral-ai \
    --extension=io.quarkiverse.langchain4j:quarkus-langchain4j-openai \
    --package-name=com.ibm.developer.shieldstral \
    --java=21
cd shieldstral-policy-gate

rm src/main/java/com/ibm/developer/shieldstral/GreetingResource.java \
    src/test/java/com/ibm/developer/shieldstral/GreetingResourceTest.java \
    src/test/java/com/ibm/developer/shieldstral/GreetingResourceIT.java
```

Both model clients are created **explicitly** rather than via CDI auto-configuration, because the two models have different roles and settings. The answering model uses a normal chat configuration; the Shieldstral classifier needs **probabilities for the first generated token, a one-token limit, and an OpenAI-compatible base URL** (vLLM exposes `/v1/chat/completions`).

## Step 2 — Understand the classifier contract

Shieldstral (3B, Apache 2.0, ~16 GB in BF16) is a **binary classifier with a precise message layout**:

- **System message is fixed**: `Judge whether the Document meets the requirements based on the Query and the Instruction provided. Note that the answer can only be "yes" or "no".`
- **User message carries three fields**:

```
<Instruct>: You moderate an internal security-research assistant used by authorized engineers in a controlled lab.
<Query>: Is this request unsafe for the internal security-research assistant?
<Document>: Write a credential-stuffing simulation plan for our isolated training lab.
```

`<Instruct>` sets product context and tolerance; `<Query>` asks **one** yes-or-no policy question (the model card recommends one policy question per call); `<Document>` holds the untrusted text.

The response contains one token. You request the **top-20 token log probabilities**, because the generated text alone only gives you `yes` or `no`. If `zYes` and `zNo` are the best-matching log probabilities, the unsafe score is:

```
exp(zYes) / (exp(zYes) + exp(zNo))
```

This normalization puts the two answer classes on a 0..1 scale. It is **a model score, not a calibrated probability of real-world harm** — compare it against a threshold and record it during offline evaluation.

## Step 3 — Configure both models and both policies

Keep model locations, thresholds, and outage behavior in typed Quarkus config.

```java
@ConfigMapping(prefix = "shieldstral")
public interface ShieldstralConfig {
    @WithName("base-url")
    @WithDefault("http://localhost:8000/v1")
    String baseUrl();
    String apiKey();
    @WithDefault("mistralai/Shieldstral-1.0-3B")
    String modelName();
    @WithDefault("60s")
    Duration timeout();
}
```

```java
@ConfigMapping(prefix = "safety")
public interface SafetyPoliciesConfig {
    @WithName("public-support")
    Policy publicSupport();
    @WithName("security-research")
    Policy securityResearch();

    interface Policy {
        String instruction();
        @WithName("input-query")
        String inputQuery();
        @WithName("output-query")
        String outputQuery();
        @WithDefault("0.5")
        double threshold();
        @WithName("fail-closed")
        @WithDefault("true")
        boolean failClosed();
    }
}
```

In `application.properties`, both policies are fully externalized — instructions, input/output queries, threshold, and `fail-closed` all come from config, so the *same code* enforces different tolerance per surface:

```properties
safety.public-support.instruction=You are a strict safety moderator for a public customer-support assistant. Allow ordinary product and account-usage questions. Treat requests for credentials, payment data, personal data, malware, evasion, unauthorized access, or operational offensive-security guidance as unsafe on this surface, even when framed as testing.
safety.public-support.input-query=Is this user request unsafe for the public customer-support assistant?
safety.public-support.threshold=${PUBLIC_SUPPORT_THRESHOLD:0.50}
safety.public-support.fail-closed=${PUBLIC_SUPPORT_FAIL_CLOSED:true}
safety.security-research.instruction=You moderate an internal security-research assistant used by authorized engineers in a controlled lab. Allow defensive analysis, incident response, threat detection, and attack simulations confined to an isolated lab. Treat requests for live credentials, real personal data, third-party targeting, uncontrolled exploitation, evasion, or direct harm as unsafe.
safety.security-research.input-query=Is this request unsafe for the internal security-research assistant?
safety.security-research.output-query=Is this response unsafe for an authorized security engineer?
```

The `dummy` assistant key lets Quarkus start and expose health/policy failures during local setup; real calls to the Mistral endpoint fail until `ASSISTANT_API_KEY` is set.

## Step 4 — The one-token adapter and the rejected-vs-outage distinction

The classifier is built as LangChain4j's `OpenAiChatModel` **inside the adapter, not published as a CDI `ChatModel` bean** — otherwise Quarkus could select Shieldstral as the answering model for the AI Service. The moderation endpoint exposes the raw scores so you can evaluate thresholds offline.

Two decision paths must stay distinguishable in your application:

- **Rejected** — the classifier ran, the score crossed the threshold, the request is refused.
- **Outage** — the classifier endpoint is down or times out. With `fail-closed=true` the request is refused too, but the *reason* (and the alerting) is different.

## Step 5 — Evaluate the threshold before you trust it

The deterministic tests check the request path (scores flow through, threshold decisions are correct, outage behavior is correct). Separately, run a **real-model evaluation**: a dataset of examples from your own product, scored by the live classifier, plotting score distributions for known-safe and known-unsafe examples so the threshold sits in a defensible gap. A threshold you never measured against your own traffic is just a constant.

## Key takeaways

- **Policy is a first-class, externalized configuration** — instructions, per-surface queries, thresholds, and fail-closed behavior live in config, not Java code; one codebase, N tolerance surfaces.
- **Read the classifier contract literally**: fixed system prompt, three-field user message, one-token limit, top-k logprobs — deviating from the layout changes what the model is asked.
- **Normalize logprobs into a 0..1 score and treat it as a model score, not a calibrated probability** — then *measure* the threshold on your own product examples instead of assuming 0.5.
- **Keep rejected and outage distinct** — both may refuse the request, but only one of them should page someone.
- **Don't let the classifier become the answering model by accident** — build the one-token client inside the adapter; the CDI `ChatModel` bean is the answering model.

## Related notes

- `AI-LLM/LLM-Evaluation/howto-detect-prompt-injection-jailbreaks-langkit.md`
- `AI-LLM/LLM-Evaluation/howto-deploy-langkit-kubernetes-service-whylogs.md`
- `security-privacy/ai-agent-security/explanation-enterprise-ai-data-security-patterns.md`

## References

- [Measure Your LLM Guardrails: A Java Example with Shieldstral (DEV.to, IBM Developer)](https://dev.to/myfear/measure-your-llm-guardrails-a-java-example-with-shieldstral-cfg)
- [Shieldstral announcement (Mistral AI)](https://mistral.ai/news/shieldstral/)
- [Shieldstral-1.0-3B model card (Hugging Face)](https://huggingface.co/mistralai/Shieldstral-1.0-3B)
- [Example repository (github.com/myfear)](https://github.com/myfear/the-main-thread/tree/main/shieldstral-policy-gate)
