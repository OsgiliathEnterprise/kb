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
      label: 'AI & Machine Learning',
      collapsed: true,
      items: [
        {
          type: 'category',
          label: 'AI-Assisted Development',
          items: [
            'ai-ml/ai-assisted-dev/howto-forward-deployed-engineer-ai',
            'ai-ml/ai-assisted-dev/howto-fragments-may-5-lattice-framework',
            'ai-ml/ai-assisted-dev/reference-the-hidden-cost-of-build-vs-buy-for-agentic-ai-in-regulated',
            'ai-ml/ai-assisted-dev/tutorial-mac-mini-agent-infrastructure',
          ],
        },
        {
          type: 'category',
          label: 'LLMs & Agents',
          items: [
            'ai-ml/llms-agents/example-structured-prompt-driven-development-spdd',
            'ai-ml/llms-agents/example-the-clean-up-cost-of-ai-generated-code-is-what-the-velocity',
            'ai-ml/llms-agents/howto-anthropic-routines-claude',
            'ai-ml/llms-agents/howto-aws-bedrock-agentcore-payments',
            'ai-ml/llms-agents/howto-aws-mcp-server-ga',
            'ai-ml/llms-agents/howto-cloudflare-workflows-v2',
            'ai-ml/llms-agents/howto-github-copilot-desktop-app',
            'ai-ml/llms-agents/howto-the-software-fix-that-could-shrink-ais-energy-bill-without-n',
            'ai-ml/llms-agents/news-openai-symphony-agents',
            'ai-ml/llms-agents/reference-agent-protocol-stack-mcp-a2a-ag-ui',
            'ai-ml/llms-agents/reference-ai-is-a-technology-not-a-product',
            'ai-ml/llms-agents/reference-apple-silicon-costs-more-than-openrouter',
            'ai-ml/llms-agents/reference-every-ai-subscription-is-a-ticking-time-bomb-for-enterprise',
            'ai-ml/llms-agents/reference-i-dont-think-ai-will-make-your-processes-go-faster',
            'ai-ml/llms-agents/reference-why-block-handed-goose-to-the-linux-foundation',
            'ai-ml/llms-agents/tutorial-aws-found-bugs-in-60-of-software-requirements-its-fix-isnt-m',
            'ai-ml/llms-agents/tutorial-interrogatory-llm',
            'ai-ml/llms-agents/tutorial-what-is-code',
          ],
        },
        {
          type: 'category',
          label: 'Local AI',
          items: [
            'ai-ml/local-ai/reference-gemma-4-local-multimodal-llm',
            'ai-ml/local-ai/reference-ubuntu-local-ai',
          ],
        },
        {
          type: 'category',
          label: 'ML Ops',
          items: [
            'ai-ml/ml-ops/reference-netflix-model-lifecycle-graph',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Cloud & Infrastructure',
      collapsed: true,
      items: [
        {
          type: 'category',
          label: 'General',
          items: [
            'cloud-infra/general/howto-nvidia-3d-acceleration-qemu-kvm-fedora',
            'cloud-infra/general/reference-s3-vectors-rag-without-vector-db',
          ],
        },
        {
          type: 'category',
          label: 'Kubernetes',
          items: [
            'cloud-infra/kubernetes/example-benchmarking-ai-agents-on-kubernetes',
            'cloud-infra/kubernetes/reference-kubernetes-v136-release-overview',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Data & Databases',
      collapsed: true,
      items: [
        {
          type: 'category',
          label: 'Data Architecture',
          items: [
            'data-databases/data-architecture/reference-monzo-data-mesh',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Developer Tools & Practices',
      collapsed: true,
      items: [
        {
          type: 'category',
          label: 'Architecture & Reliability',
          items: [
            'devtools/architecture-reliability/reference-discord-reveals-how-a-hidden-circular-dependency-triggered-i',
            'devtools/architecture-reliability/reference-three-layer-architecture-production-ai',
          ],
        },
        {
          type: 'category',
          label: 'CI/CD & Platforms',
          items: [
            'devtools/cicd-platforms/reference-microsoft-releases-aspire-133-with-major-deployment-and-fron',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Programming',
      collapsed: true,
      items: [
        {
          type: 'category',
          label: 'Java & Spring',
          items: [
            'programming/java-spring/example-image-classification-camel-djl',
            'programming/java-spring/howto-clean-up-test-data-spring',
            'programming/java-spring/howto-emulate-left-join-fetch-projections',
            'programming/java-spring/howto-mysql-query-optimization-releem',
            'programming/java-spring/howto-spring-ecosystem-roundup-may-2026',
            'programming/java-spring/tutorial-replace-deprecated-genericgenerator',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Security & Privacy',
      collapsed: true,
      items: [
        {
          type: 'category',
          label: 'AppSec & Privacy',
          items: [
            'security/appsec-privacy/howto-linux-second-severe-vulnerability',
            'security/appsec-privacy/howto-why-ai-is-failing-in-the-security-operations-center',
            'security/appsec-privacy/reference-context-aware-authorization-ai-agents',
          ],
        },
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
  ],
};

export default sidebars;
