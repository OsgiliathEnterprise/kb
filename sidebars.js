const sidebars = {
  docsSidebar: [
    {
      type: 'doc',
      id: 'intro',
      label: 'Welcome to the Archives',
    },
    {
      type: 'category',
      label: 'Quick Start',
      collapsed: false,
      items: [
        'quickstart/overview',
        'quickstart/first-steps',
        'quickstart/environment-setup',
      ],
    },
    {
      type: 'category',
      label: 'Architecture',
      collapsed: true,
      items: [
        'architecture/overview',
        'architecture/principles',
        'architecture/services',
      ],
    },
    {
      type: 'category',
      label: 'Operations',
      collapsed: true,
      items: [
        'operations/deployment',
        'operations/monitoring',
        'operations/cicd',
      ],
    },
    {
      type: 'category',
      label: 'Security',
      collapsed: true,
      items: [
        'security/overview',
        'security/access-control',
        'security/incident-response',
      ],
    },
    {
      type: 'category',
      label: 'Development',
      collapsed: true,
      items: [
        'development/coding-standards',
        'development/git-workflow',
        'development/code-review',
      ],
    },
    {
      type: 'category',
      label: 'Data & Analytics',
      collapsed: true,
      items: [
        'data/pipelines',
        'data/warehousing',
        'data/ml-operations',
      ],
    },
    {
      type: 'category',
      label: 'Runbooks',
      collapsed: true,
      items: [
        'runbooks/incident-response',
        'runbooks/troubleshooting',
        'runbooks/maintenance',
      ],
    },
    {
      type: 'category',
      label: 'API Reference',
      collapsed: true,
      items: [
        'api/overview',
        'api/authentication',
        'api/endpoints',
      ],
    },

    // ── Knowledge Base (auto-generated) ──
    {
      type: 'category',
      label: 'Knowledge Base: Ai Machine Learning',
      collapsed: true,
      items: [
        {
          type: 'category',
          label: 'Aiassisted Development',
          items: ['kb/ai-machine-learning/aiassisted-development/howto-forward-deployed-engineer-ai', 'kb/ai-machine-learning/aiassisted-development/howto-fragments-may-5-lattice-framework', 'kb/ai-machine-learning/aiassisted-development/tutorial-mac-mini-agent-infrastructure'],
        },
        {
          type: 'category',
          label: 'Llms Agents',
          items: ['kb/ai-machine-learning/llms-agents/example-structured-prompt-driven-development-spdd', 'kb/ai-machine-learning/llms-agents/example-the-clean-up-cost-of-ai-generated-code-is-what-the-velocity', 'kb/ai-machine-learning/llms-agents/howto-anthropic-routines-claude', 'kb/ai-machine-learning/llms-agents/howto-aws-bedrock-agentcore-payments', 'kb/ai-machine-learning/llms-agents/howto-aws-mcp-server-ga', 'kb/ai-machine-learning/llms-agents/news-openai-symphony-agents', 'kb/ai-machine-learning/llms-agents/reference-agent-protocol-stack-mcp-a2a-ag-ui', 'kb/ai-machine-learning/llms-agents/reference-ai-is-a-technology-not-a-product', 'kb/ai-machine-learning/llms-agents/reference-every-ai-subscription-is-a-ticking-time-bomb-for-enterprise', 'kb/ai-machine-learning/llms-agents/reference-i-dont-think-ai-will-make-your-processes-go-faster', 'kb/ai-machine-learning/llms-agents/reference-maintainability-sensors-for-coding-agents', 'kb/ai-machine-learning/llms-agents/reference-why-block-handed-goose-to-the-linux-foundation', 'kb/ai-machine-learning/llms-agents/tutorial-interrogatory-llm', 'kb/ai-machine-learning/llms-agents/tutorial-what-is-code'],
        },
        {
          type: 'category',
          label: 'Local Ai',
          items: ['kb/ai-machine-learning/local-ai/reference-gemma-4-local-multimodal-llm', 'kb/ai-machine-learning/local-ai/reference-ubuntu-local-ai'],
        },
        {
          type: 'category',
          label: 'Ml Ops',
          items: ['kb/ai-machine-learning/ml-ops/reference-netflix-model-lifecycle-graph'],
        },
      ],
    },
    {
      type: 'category',
      label: 'Knowledge Base: Cloud Infrastructure',
      collapsed: true,
      items: [
        'kb/cloud-infrastructure/howto-nvidia-3d-acceleration-qemu-kvm-fedora',
        'kb/cloud-infrastructure/reference-s3-vectors-rag-without-vector-db',
        {
          type: 'category',
          label: 'Kubernetes',
          items: ['kb/cloud-infrastructure/kubernetes/howto-running-agents-on-kubernetes-with-agent-sandbox', 'kb/cloud-infrastructure/kubernetes/reference-kubernetes-v136-release-overview'],
        },
      ],
    },
    {
      type: 'category',
      label: 'Knowledge Base: Data Databases',
      collapsed: true,
      items: [
        {
          type: 'category',
          label: 'Data Architecture',
          items: ['kb/data-databases/data-architecture/reference-monzo-data-mesh'],
        },
      ],
    },
    {
      type: 'category',
      label: 'Knowledge Base: Developer Tools Practices',
      collapsed: true,
      items: [
        {
          type: 'category',
          label: 'Architecture Reliability',
          items: ['kb/developer-tools-practices/architecture-reliability/reference-discord-reveals-how-a-hidden-circular-dependency-triggered-i', 'kb/developer-tools-practices/architecture-reliability/reference-three-layer-architecture-production-ai'],
        },
        {
          type: 'category',
          label: 'Cicd Platforms',
          items: ['kb/developer-tools-practices/cicd-platforms/reference-ci-for-coding-agents'],
        },
      ],
    },
    {
      type: 'category',
      label: 'Knowledge Base: Programming',
      collapsed: true,
      items: [
        {
          type: 'category',
          label: 'Java Spring',
          items: ['kb/programming/java-spring/example-image-classification-camel-djl', 'kb/programming/java-spring/howto-clean-up-test-data-spring', 'kb/programming/java-spring/howto-emulate-left-join-fetch-projections', 'kb/programming/java-spring/howto-mysql-query-optimization-releem', 'kb/programming/java-spring/howto-spring-ecosystem-roundup-may-2026', 'kb/programming/java-spring/tutorial-replace-deprecated-genericgenerator'],
        },
      ],
    },
    {
      type: 'category',
      label: 'Knowledge Base: Security Privacy',
      collapsed: true,
      items: [
        {
          type: 'category',
          label: 'Appsec Privacy',
          items: ['kb/security-privacy/appsec-privacy/howto-linux-second-severe-vulnerability', 'kb/security-privacy/appsec-privacy/reference-chromium-browser-fetch-vulnerability', 'kb/security-privacy/appsec-privacy/reference-cisa-credentials-github-leak', 'kb/security-privacy/appsec-privacy/reference-context-aware-authorization-ai-agents'],
        },
      ],
    },
  ],
};

export default sidebars;
