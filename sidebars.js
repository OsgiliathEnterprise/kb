const sidebars = {
  main: [
    {
      type: 'category',
      label: 'Tutorials',
      collapsed: true,
      items: [
        {
          type: 'category',
          label: 'Aiassisted Development',
          items: ['tutorials/ai-machine-learning/aiassisted-development/tutorial-mac-mini-agent-infrastructure'],
        },
        {
          type: 'category',
          label: 'Llms Agents',
          items: ['tutorials/ai-machine-learning/llms-agents/tutorial-what-is-code'],
        },
        {
          type: 'category',
          label: 'Java Spring',
          items: ['tutorials/programming/java-spring/tutorial-replace-deprecated-genericgenerator'],
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
          label: 'Aiassisted Development',
          items: ['how-to/ai-machine-learning/aiassisted-development/howto-fragments-may-5-lattice-framework'],
        },
        {
          type: 'category',
          label: 'Llms Agents',
          items: ['how-to/ai-machine-learning/llms-agents/howto-anthropic-routines-claude'],
        },
        {
          type: 'category',
          label: 'Kubernetes',
          items: ['how-to/cloud-infrastructure/kubernetes/howto-k8s-dashboard-to-headlamp-transition', 'how-to/cloud-infrastructure/kubernetes/howto-running-agents-on-kubernetes-with-agent-sandbox'],
        },
        {
          type: 'category',
          label: 'Virtualization',
          items: ['how-to/cloud-infrastructure/virtualization/howto-nvidia-3d-acceleration-qemu-kvm-fedora'],
        },
        {
          type: 'category',
          label: 'Java Spring',
          items: ['how-to/programming/java-spring/howto-clean-up-test-data-spring', 'how-to/programming/java-spring/howto-emulate-left-join-fetch-projections', 'how-to/programming/java-spring/howto-jvm-crash-analysis-jcmd', 'how-to/programming/java-spring/howto-spring-ecosystem-roundup-may-2026'],
        },
        {
          type: 'category',
          label: 'Appsec Privacy',
          items: ['how-to/security-privacy/appsec-privacy/howto-ai-agent-kubectl-access-patterns', 'how-to/security-privacy/appsec-privacy/howto-linux-second-severe-vulnerability'],
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
          label: 'Aiassisted Development',
          items: ['explanations/ai-machine-learning/aiassisted-development/explanation-caching-agentic-java-systems', 'explanations/ai-machine-learning/aiassisted-development/explanation-vibe-coding'],
        },
        {
          type: 'category',
          label: 'Llms Agents',
          items: ['explanations/ai-machine-learning/llms-agents/explanation-agent-protocol-stack-mcp-a2a-ag-ui', 'explanations/ai-machine-learning/llms-agents/explanation-maintainability-sensors-for-coding-agents', 'explanations/ai-machine-learning/llms-agents/explanation-rag-architecture-at-scale'],
        },
        {
          type: 'category',
          label: 'Local Ai',
          items: ['explanations/ai-machine-learning/local-ai/explanation-gemma-4-local-multimodal-llm'],
        },
        {
          type: 'category',
          label: 'Ml Ops',
          items: ['explanations/ai-machine-learning/ml-ops/explanation-netflix-model-lifecycle-graph'],
        },
        {
          type: 'category',
          label: 'Agentinfrastructure',
          items: ['explanations/aiinfrastructure/agentinfrastructure/explanation-enterprise-agentic-platforms', 'explanations/aiinfrastructure/agentinfrastructure/explanation-runtime-engineering-for-agents'],
        },
        {
          type: 'category',
          label: 'Agentsecurity',
          items: ['explanations/aiinfrastructure/agentsecurity/ladybird-browser-ends-public-prs-ai-security'],
        },
        {
          type: 'category',
          label: 'Agenttooling',
          items: ['explanations/aiinfrastructure/agenttooling/browser-use-framework-tutorial', 'explanations/aiinfrastructure/agenttooling/jetbrains-ide-native-search-for-agents'],
        },
        {
          type: 'category',
          label: 'Aiengineering',
          items: ['explanations/aiinfrastructure/aiengineering/medium-feature-store-bottleneck-lessons', 'explanations/aiinfrastructure/aiengineering/notebook-to-production-ai-howto'],
        },
        {
          type: 'category',
          label: 'Aiframeworks',
          items: ['explanations/aiinfrastructure/aiframeworks/google-diffusiongemma-text-diffusion-model'],
        },
        {
          type: 'category',
          label: 'Kubernetes',
          items: ['explanations/cloud-infrastructure/kubernetes/explanation-kubernetes-v136-release-overview'],
        },
        {
          type: 'category',
          label: 'Observability',
          items: ['explanations/cloud-infrastructure/observability/explanation-opentelemetry-ga'],
        },
        {
          type: 'category',
          label: 'Cloudsecurity',
          items: ['explanations/cloudnative/cloudsecurity/aws-graviton5-nitro-isolation-engine'],
        },
        {
          type: 'category',
          label: 'Data Architecture',
          items: ['explanations/data-databases/data-architecture/explanation-monzo-data-mesh'],
        },
        {
          type: 'category',
          label: 'Architecture Reliability',
          items: ['explanations/developer-tools-practices/architecture-reliability/explanation-discord-circular-dependency-voice-outage', 'explanations/developer-tools-practices/architecture-reliability/explanation-three-layer-architecture-production-ai'],
        },
        {
          type: 'category',
          label: 'Cicd Platforms',
          items: ['explanations/developer-tools-practices/cicd-platforms/explanation-ci-for-coding-agents'],
        },
        {
          type: 'category',
          label: 'Cicdpipelines',
          items: ['explanations/devsecops/cicdpipelines/gitlab-19-devsecops-features'],
        },
        {
          type: 'category',
          label: 'Supplychainsecurity',
          items: ['explanations/devsecops/supplychainsecurity/miasma-worm-ai-agent-supply-chain'],
        },
        {
          type: 'category',
          label: 'Threatlandscape',
          items: ['explanations/devsecops/threatlandscape/gartner-four-critical-cybersecurity-threats-2026'],
        },
        {
          type: 'category',
          label: 'Vulnerabilitymanagement',
          items: ['explanations/devsecops/vulnerabilitymanagement/cisa-ai-vulnerability-directive-3-day-patch'],
        },
        'explanations/general/explanation-s3-vectors-rag-without-vector-db',
        {
          type: 'category',
          label: 'Java Spring',
          items: ['explanations/programming/java-spring/explanation-jdk27-post-quantum-tls', 'explanations/programming/java-spring/explanation-jfr-ai-monitoring', 'explanations/programming/java-spring/explanation-spring-security-ai-era'],
        },
        {
          type: 'category',
          label: 'Appsec Privacy',
          items: ['explanations/security-privacy/appsec-privacy/explanation-chromium-browser-fetch-vulnerability', 'explanations/security-privacy/appsec-privacy/explanation-cisa-credentials-github-leak', 'explanations/security-privacy/appsec-privacy/explanation-context-aware-authorization-ai-agents', 'explanations/security-privacy/appsec-privacy/explanation-frontier-ai-models-security-failures'],
        },
        {
          type: 'category',
          label: 'Distributedsystems',
          items: ['explanations/softwareengineering/distributedsystems/squirix-client-server-cache-architecture'],
        },
        {
          type: 'category',
          label: 'Gpucomputing',
          items: ['explanations/softwareengineering/gpucomputing/babylon-gpu-tensor-cores-java'],
        },
        {
          type: 'category',
          label: 'Jvmperformance',
          items: ['explanations/softwareengineering/jvmperformance/zgc-weak-reference-optimization'],
        },
        {
          type: 'category',
          label: 'Mobilearchitecture',
          items: ['explanations/softwareengineering/mobilearchitecture/react-native-bridge-to-jsi-migration'],
        },
        {
          type: 'category',
          label: 'Webperformance',
          items: ['explanations/softwareengineering/webperformance/inp-legacy-site-optimization'],
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
          label: 'Llms Agents',
          items: ['examples/ai-machine-learning/llms-agents/example-structured-prompt-driven-development-spdd'],
        },
        {
          type: 'category',
          label: 'Java Spring',
          items: ['examples/programming/java-spring/example-image-classification-camel-djl'],
        },
      ],
    },
  ],
};

export default sidebars;
