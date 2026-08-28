const sidebars = {
  main: [
    {
      type: 'category',
      label: 'Tutorials',
      collapsed: true,
      items: [
        {
          type: 'category',
          label: 'Databases',
          items: ['tutorials/programming/databases/tutorial-mvcc-postgres-style-snapshots-typescript'],
        },
      ],
    },
    {
      type: 'category',
      label: 'How-to Guides',
      collapsed: true,
      items: [
        {
          type: 'category',
          label: 'Agentarchitecture',
          items: ['how-to/aimachinelearning/agentarchitecture/howto-agentic-rag-pipeline-with-real-time-web-search'],
        },
        {
          type: 'category',
          label: 'Incidentresponse',
          items: ['how-to/cloudinfrastructure/incidentresponse/howto-s3-exfiltration-incident-response'],
        },
        {
          type: 'category',
          label: 'Aicodingagents',
          items: ['how-to/developertoolspractices/aicodingagents/howto-litellm-gateway-for-codex-cli'],
        },
        {
          type: 'category',
          label: 'Webrealtime',
          items: ['how-to/programming/webrealtime/howto-scale-websocket-sse-redis-pubsub'],
        },
        {
          type: 'category',
          label: 'Aiagentsecurity',
          items: ['how-to/securityprivacy/aiagentsecurity/howto-mcp-security-hardening'],
        },
      ],
    },
    {
      type: 'category',
      label: 'Explanations',
      collapsed: true,
      items: [
        {
          type: 'category',
          label: 'Llminfrastructure',
          items: ['explanations/aillm/llminfrastructure/explanation-openai-jalapeno-chip-first-benchmarks', 'explanations/aillm/llminfrastructure/explanation-qwen3-embedding-cloud-tpu-vllm'],
        },
        {
          type: 'category',
          label: 'Llmmodels',
          items: ['explanations/aillm/llmmodels/explanation-ibm-granite-4-2-dense-reasoning-models'],
        },
        {
          type: 'category',
          label: 'Agentarchitecture',
          items: ['explanations/aimachinelearning/agentarchitecture/explanation-agent-guardrail-stack', 'explanations/aimachinelearning/agentarchitecture/explanation-claude-unified-memory-architecture'],
        },
        {
          type: 'category',
          label: 'Multimodal',
          items: ['explanations/aimachinelearning/multimodal/explanation-deepseek-vision-lineage'],
        },
        {
          type: 'category',
          label: 'Gpucompute',
          items: ['explanations/cloudinfrastructure/gpucompute/explanation-cuda-targets-risc-v'],
        },
        {
          type: 'category',
          label: 'Streaming',
          items: ['explanations/cloudinfrastructure/streaming/explanation-picomq-durable-streams'],
        },
        {
          type: 'category',
          label: 'Localaiagents',
          items: ['explanations/developertoolspractices/localaiagents/explanation-jetbrains-junie-local-agent', 'explanations/developertoolspractices/localaiagents/explanation-perplexity-portable-computer-local-agent'],
        },
        {
          type: 'category',
          label: 'Linuxkernel',
          items: ['explanations/programming/linuxkernel/explanation-isolcpus-irq-affinity'],
        },
        {
          type: 'category',
          label: 'Python',
          items: ['explanations/programming/python/explanation-python-str-lower-idna-unicode-cve-2026-17084'],
        },
        {
          type: 'category',
          label: 'Rust',
          items: ['explanations/programming/rust/explanation-rust-1-98-algebraic-float-and-buffered-formatting'],
        },
        {
          type: 'category',
          label: 'Aiagentsecurity',
          items: ['explanations/securityprivacy/aiagentsecurity/explanation-llm-inference-engine-exploits', 'explanations/securityprivacy/aiagentsecurity/explanation-openai-hugging-face-agent-incident'],
        },
        {
          type: 'category',
          label: 'Tlsssl',
          items: ['explanations/securityprivacy/tlsssl/explanation-ssl-tls-three-jobs'],
        },
        {
          type: 'category',
          label: 'Websecurity',
          items: ['explanations/securityprivacy/websecurity/explanation-open-redirect-php-laravel'],
        },
      ],
    },
    {
      type: 'category',
      label: 'Examples',
      collapsed: true,
      items: [
        {
          type: 'category',
          label: 'Frontendjavascript',
          items: ['examples/programming/frontendjavascript/example-intl-segmenter-text-analysis'],
        },
        {
          type: 'category',
          label: 'Linux',
          items: ['examples/programming/linux/example-self-sqlite-executable-self-httpd'],
        },
        {
          type: 'category',
          label: 'Webrealtime',
          items: ['examples/programming/webrealtime/example-webrtc-p2p-file-transfer-browser'],
        },
      ],
    },
  ],
};

export default sidebars;
