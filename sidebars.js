const sidebars = {
  main: [
    {
      type: 'category',
      label: 'How-to Guides',
      collapsed: true,
      items: [
        {
          type: 'category',
          label: 'Incidentresponse',
          items: ['how-to/cloudinfrastructure/incidentresponse/howto-s3-exfiltration-incident-response'],
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
          label: 'Agentarchitecture',
          items: ['explanations/aimachinelearning/agentarchitecture/explanation-agent-guardrail-stack'],
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
          items: ['explanations/developertoolspractices/localaiagents/explanation-jetbrains-junie-local-agent'],
        },
        {
          type: 'category',
          label: 'Linuxkernel',
          items: ['explanations/programming/linuxkernel/explanation-isolcpus-irq-affinity'],
        },
        {
          type: 'category',
          label: 'Aiagentsecurity',
          items: ['explanations/securityprivacy/aiagentsecurity/explanation-llm-inference-engine-exploits'],
        },
        {
          type: 'category',
          label: 'Tlsssl',
          items: ['explanations/securityprivacy/tlsssl/explanation-ssl-tls-three-jobs'],
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
      ],
    },
  ],
};

export default sidebars;
