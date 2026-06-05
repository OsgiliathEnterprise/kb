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
          items: ['how-to/ai-machine-learning/llms-agents/howto-anthropic-routines-claude', 'how-to/ai-machine-learning/llms-agents/howto-mcp-tunnels-sandboxes'],
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
