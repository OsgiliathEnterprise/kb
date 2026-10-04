const sidebars = {
  main: [
    {
      type: 'category',
      label: 'Tutorials',
      collapsed: true,
      items: [
        {
          type: 'category',
          label: 'Multimodal',
          items: ['tutorials/aimachinelearning/multimodal/tutorial-commit-conversation-voice-turn-context'],
        },
        {
          type: 'category',
          label: 'Aws',
          items: ['tutorials/cloudinfrastructure/aws/tutorial-full-stack-app-on-aws-fargate-vue-express-dynamodb'],
        },
        {
          type: 'category',
          label: 'Databases',
          items: ['tutorials/programming/databases/tutorial-mvcc-postgres-style-snapshots-typescript'],
        },
        {
          type: 'category',
          label: 'Dotnetcsharp',
          items: ['tutorials/programming/dotnetcsharp/tutorial-linq-groupby-vs-sql-group-by'],
        },
        {
          type: 'category',
          label: 'Esotericlanguages',
          items: ['tutorials/programming/esotericlanguages/tutorial-graphlang-functional-language-in-c'],
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
          label: 'Llminfrastructure',
          items: ['how-to/aillm/llminfrastructure/howto-tiered-response-caching-for-llm-costs'],
        },
        {
          type: 'category',
          label: 'Agentarchitecture',
          items: ['how-to/aimachinelearning/agentarchitecture/howto-agentic-rag-pipeline-with-real-time-web-search', 'how-to/aimachinelearning/agentarchitecture/howto-build-effectively-once-agent-workflows', 'how-to/aimachinelearning/agentarchitecture/howto-closed-world-resolution-tool-hallucination', 'how-to/aimachinelearning/agentarchitecture/howto-jev-mobile-vlm-planning-lightweight-execution', 'how-to/aimachinelearning/agentarchitecture/howto-raft-stateful-rag-troubleshooting-agents'],
        },
        {
          type: 'category',
          label: 'Trainingoptimization',
          items: ['how-to/aimachinelearning/trainingoptimization/howto-taco-memory-efficient-llm-fine-tuning-optimizer'],
        },
        {
          type: 'category',
          label: 'Aws',
          items: ['how-to/cloudinfrastructure/aws/howto-deploy-aws-from-github-actions-with-oidc', 'how-to/cloudinfrastructure/aws/howto-deploy-ml-model-to-sagemaker-endpoint'],
        },
        {
          type: 'category',
          label: 'Azure',
          items: ['how-to/cloudinfrastructure/azure/howto-configure-and-migrate-to-azure-database-for-postgresql', 'how-to/cloudinfrastructure/azure/howto-deploy-cloud-native-apps-with-azure-container-apps'],
        },
        {
          type: 'category',
          label: 'Distributedtracing',
          items: ['how-to/cloudinfrastructure/distributedtracing/howto-store-jaeger-spans-in-clickhouse'],
        },
        {
          type: 'category',
          label: 'Docker',
          items: ['how-to/cloudinfrastructure/docker/howto-run-uptime-kuma-with-podman-quadlet-on-fedora'],
        },
        {
          type: 'category',
          label: 'Finops',
          items: ['how-to/cloudinfrastructure/finops/howto-cloud-budget-alerts-aws-gcp-azure'],
        },
        {
          type: 'category',
          label: 'Googleworkspace',
          items: ['how-to/cloudinfrastructure/googleworkspace/howto-gemini-managed-agents-from-apps-script'],
        },
        {
          type: 'category',
          label: 'Gpucompute',
          items: ['how-to/cloudinfrastructure/gpucompute/howto-kernellopt-agentic-gpu-kernel-optimization'],
        },
        {
          type: 'category',
          label: 'Incidentresponse',
          items: ['how-to/cloudinfrastructure/incidentresponse/howto-cicd-compromise-response-jetbrains-cadence', 'how-to/cloudinfrastructure/incidentresponse/howto-s3-exfiltration-incident-response'],
        },
        {
          type: 'category',
          label: 'Kubernetes',
          items: ['how-to/cloudinfrastructure/kubernetes/howto-inspect-volcano-knative-workloads-with-headlamp-plugins', 'how-to/cloudinfrastructure/kubernetes/howto-install-kubeflow-for-ml-on-eks', 'how-to/cloudinfrastructure/kubernetes/howto-manage-cluster-api-resources-with-headlamp'],
        },
        {
          type: 'category',
          label: 'Kubernetesoperators',
          items: ['how-to/cloudinfrastructure/kubernetesoperators/howto-building-kubernetes-operators-with-ocaml'],
        },
        {
          type: 'category',
          label: 'Networking',
          items: ['how-to/cloudinfrastructure/networking/howto-monitor-email-dns-records-mx-spf-dkim-dmarc'],
        },
        {
          type: 'category',
          label: 'Aicodingagents',
          items: ['how-to/developertoolspractices/aicodingagents/howto-autocompact-context-compaction-coding-agents', 'how-to/developertoolspractices/aicodingagents/howto-build-an-ai-workflow-inventory', 'how-to/developertoolspractices/aicodingagents/howto-chronicle-cut-point-replay-regression-testing', 'how-to/developertoolspractices/aicodingagents/howto-litellm-gateway-for-codex-cli', 'how-to/developertoolspractices/aicodingagents/howto-maintainability-sensors-for-coding-agents', 'how-to/developertoolspractices/aicodingagents/howto-migrate-gemini-cli-to-antigravity-cli', 'how-to/developertoolspractices/aicodingagents/howto-neurotestgen-neuro-symbolic-test-generation', 'how-to/developertoolspractices/aicodingagents/howto-require-a-job-receipt-for-remote-model-proposals', 'how-to/developertoolspractices/aicodingagents/howto-spring-upgrades-with-openrewrite-and-agents'],
        },
        {
          type: 'category',
          label: 'Ciperformance',
          items: ['how-to/developertoolspractices/ciperformance/howto-fastci-gpu-intensive-ci-llm-training', 'how-to/developertoolspractices/ciperformance/howto-keep-ci-fast-under-agent-driven-development', 'how-to/developertoolspractices/ciperformance/howto-test-scheduled-jobs-with-faketime'],
        },
        {
          type: 'category',
          label: 'Mcp',
          items: ['how-to/developertoolspractices/mcp/howto-map-http-api-parameters-to-mcp-tool-schemas', 'how-to/developertoolspractices/mcp/howto-soak-test-mcp-server-with-mcpload'],
        },
        {
          type: 'category',
          label: 'Releasereproducibility',
          items: ['how-to/developertoolspractices/releasereproducibility/howto-archive-github-release-to-zenodo-with-version-doi'],
        },
        {
          type: 'category',
          label: 'Databases',
          items: ['how-to/programming/databases/howto-catch-silent-table-loss-in-supabase-pg-restore', 'how-to/programming/databases/howto-port-mysql-schema-to-postgresql'],
        },
        {
          type: 'category',
          label: 'Datastructures',
          items: ['how-to/programming/datastructures/howto-p99-zero-ms-autocomplete-two-tier-index'],
        },
        {
          type: 'category',
          label: 'Frontendjavascript',
          items: ['how-to/programming/frontendjavascript/howto-deno-2-9-desktop-and-node-migration', 'how-to/programming/frontendjavascript/howto-eradicate-slow-ttfb-with-streaming-ssr-nextjs', 'how-to/programming/frontendjavascript/howto-react-native-environment-setup-android-flavors-ios-schemes'],
        },
        {
          type: 'category',
          label: 'Java',
          items: ['how-to/programming/java/howto-integrate-typesafe-jev-with-spring-ai', 'how-to/programming/java/howto-spring-batch-mongodb-job-repository-spring-boot-4-1'],
        },
        {
          type: 'category',
          label: 'Linux',
          items: ['how-to/programming/linux/howto-fstab-instead-of-autofs-for-samba-share', 'how-to/programming/linux/howto-swap-zram-zswap-hibernate-nixos', 'how-to/programming/linux/howto-transfer-files-over-an-ethernet-patch-cable'],
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
        {
          type: 'category',
          label: 'Fuzzing',
          items: ['how-to/securityprivacy/fuzzing/howto-build-asan-fuzz-harness-for-your-parser'],
        },
        {
          type: 'category',
          label: 'Websecurity',
          items: ['how-to/securityprivacy/websecurity/howto-absentia-broken-access-control-detection'],
        },
        {
          type: 'category',
          label: 'Distributedtransactions',
          items: ['how-to/systemdesign/distributedtransactions/howto-implement-transactional-outbox-pattern'],
        },
        {
          type: 'category',
          label: 'Nonfunctionalrequirements',
          items: ['how-to/systemdesign/nonfunctionalrequirements/howto-laravel-redis-outage-ganesha-circuit-breaker'],
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
          label: 'Diffusionlanguagemodels',
          items: ['explanations/aillm/diffusionlanguagemodels/explanation-diffusiongemma-block-autoregressive-text-diffusion', 'explanations/aillm/diffusionlanguagemodels/explanation-how-to-build-a-diffusion-language-model'],
        },
        {
          type: 'category',
          label: 'Llminfrastructure',
          items: ['explanations/aillm/llminfrastructure/explanation-fairinference-token-latency-fairness-llm-serving', 'explanations/aillm/llminfrastructure/explanation-fine-tuning-memory-accounting-lora-qlora', 'explanations/aillm/llminfrastructure/explanation-openai-jalapeno-chip-first-benchmarks', 'explanations/aillm/llminfrastructure/explanation-prefixbench-h100-prefix-reuse-ttft', 'explanations/aillm/llminfrastructure/explanation-qwen3-embedding-cloud-tpu-vllm'],
        },
        {
          type: 'category',
          label: 'Llmmodels',
          items: ['explanations/aillm/llmmodels/explanation-glm-5-2-open-weight-models-self-hosting', 'explanations/aillm/llmmodels/explanation-ibm-granite-4-2-dense-reasoning-models', 'explanations/aillm/llmmodels/explanation-poem-predicting-rl-outcomes-from-existing-policies', 'explanations/aillm/llmmodels/explanation-pssa-plastic-state-space-language-model-rust'],
        },
        {
          type: 'category',
          label: 'Agentarchitecture',
          items: ['explanations/aimachinelearning/agentarchitecture/explanation-agent-guardrail-stack', 'explanations/aimachinelearning/agentarchitecture/explanation-claude-unified-memory-architecture', 'explanations/aimachinelearning/agentarchitecture/explanation-coding-agents-generalized-tamp', 'explanations/aimachinelearning/agentarchitecture/explanation-harness-design-coding-agents', 'explanations/aimachinelearning/agentarchitecture/explanation-human-in-the-loop-approval-gates', 'explanations/aimachinelearning/agentarchitecture/explanation-jev-ultrafast-dynamic-indexed-action-space-browser-agent', 'explanations/aimachinelearning/agentarchitecture/explanation-lemmalog-datalog-memory-for-llm-agents', 'explanations/aimachinelearning/agentarchitecture/explanation-microsoft-copilot-agent-identity-runtime', 'explanations/aimachinelearning/agentarchitecture/explanation-prince-bayer-agentic-rag-context-harness-engineering', 'explanations/aimachinelearning/agentarchitecture/explanation-progressive-disclosure-on-demand-skills', 'explanations/aimachinelearning/agentarchitecture/explanation-reconciling-agent-plans-with-completed-temporal-activities', 'explanations/aimachinelearning/agentarchitecture/explanation-sandboxed-execution-runtime-engineering-for-ai-agents', 'explanations/aimachinelearning/agentarchitecture/explanation-sourcelearn-source-specific-competence', 'explanations/aimachinelearning/agentarchitecture/explanation-x402-http-payment-standard-for-ai-agents', 'explanations/aimachinelearning/agentarchitecture/reference-scholarcatalyst-research-paper-retrieval-benchmark'],
        },
        {
          type: 'category',
          label: 'Multiagentsystems',
          items: ['explanations/aimachinelearning/multiagentsystems/explanation-same-model-debate-more-self-critical-than-diverse-pairs'],
        },
        {
          type: 'category',
          label: 'Multimodal',
          items: ['explanations/aimachinelearning/multimodal/explanation-deepseek-vision-lineage', 'explanations/aimachinelearning/multimodal/explanation-netflix-maps-multimodal-asset-personalization'],
        },
        {
          type: 'category',
          label: 'Aws',
          items: ['explanations/cloudinfrastructure/aws/explanation-aws-lambda-ebpf-rust-flow-logging'],
        },
        {
          type: 'category',
          label: 'Docker',
          items: ['explanations/cloudinfrastructure/docker/explanation-baseten-github-token-in-image-build-history'],
        },
        {
          type: 'category',
          label: 'Edgecompute',
          items: ['explanations/cloudinfrastructure/edgecompute/explanation-netlify-edge-functions-firecracker-microvms'],
        },
        {
          type: 'category',
          label: 'Gpucompute',
          items: ['explanations/cloudinfrastructure/gpucompute/explanation-cuda-targets-risc-v'],
        },
        {
          type: 'category',
          label: 'Gpuvirtualization',
          items: ['explanations/cloudinfrastructure/gpuvirtualization/explanation-virtio-nvgpu-driver-abi-forwarding'],
        },
        {
          type: 'category',
          label: 'Incidentresponse',
          items: ['explanations/cloudinfrastructure/incidentresponse/explanation-telstra-ntp-timing-loop-outage'],
        },
        {
          type: 'category',
          label: 'Kubernetes',
          items: ['explanations/cloudinfrastructure/kubernetes/explanation-k8s-device-management-dra', 'explanations/cloudinfrastructure/kubernetes/explanation-k8s-v1-37-pod-certificates-cluster-trust-bundles', 'explanations/cloudinfrastructure/kubernetes/explanation-k8s-v1-37-pvc-last-used-time', 'explanations/cloudinfrastructure/kubernetes/explanation-securing-kubernetes-ai-agent-workloads'],
        },
        {
          type: 'category',
          label: 'Llmserving',
          items: ['explanations/cloudinfrastructure/llmserving/reference-moe-core-expert-offloading-residency'],
        },
        {
          type: 'category',
          label: 'Networking',
          items: ['explanations/cloudinfrastructure/networking/explanation-tailscale-multi-queue-buffer-reuse-netmap-caching'],
        },
        {
          type: 'category',
          label: 'Streaming',
          items: ['explanations/cloudinfrastructure/streaming/explanation-picomq-durable-streams'],
        },
        {
          type: 'category',
          label: 'Agentdocumentation',
          items: ['explanations/developertoolspractices/agentdocumentation/explanation-ai-docs-standard-documentation-ai-md'],
        },
        {
          type: 'category',
          label: 'Aicodingagents',
          items: ['explanations/developertoolspractices/aicodingagents/explanation-efficiency-throughput-gap-github-copilot-okta', 'explanations/developertoolspractices/aicodingagents/explanation-overclaimbench-quantifying-agent-overclaiming', 'explanations/developertoolspractices/aicodingagents/explanation-valkey-ai-agents-backporting-provenance'],
        },
        {
          type: 'category',
          label: 'Localaiagents',
          items: ['explanations/developertoolspractices/localaiagents/explanation-aws-strands-harness-local-first-agent', 'explanations/developertoolspractices/localaiagents/explanation-jetbrains-junie-local-agent', 'explanations/developertoolspractices/localaiagents/explanation-perplexity-portable-computer-local-agent'],
        },
        {
          type: 'category',
          label: 'Mcp',
          items: ['explanations/developertoolspractices/mcp/explanation-mcp-discovery-storms-sep-2549-caching', 'explanations/developertoolspractices/mcp/explanation-mcp-vs-rest-kafka-complementary-layers', 'explanations/developertoolspractices/mcp/explanation-tool-descriptions-are-the-contract'],
        },
        {
          type: 'category',
          label: 'Remotedevelopment',
          items: ['explanations/developertoolspractices/remotedevelopment/explanation-vscode-ssh-agent-architecture'],
        },
        {
          type: 'category',
          label: 'Databases',
          items: ['explanations/programming/databases/explanation-postgresql-generated-columns-vs-triggers', 'explanations/programming/databases/explanation-row-number-rank-dense-rank-top-n', 'explanations/programming/databases/explanation-sql-not-in-null-trap'],
        },
        {
          type: 'category',
          label: 'Esotericlanguages',
          items: ['explanations/programming/esotericlanguages/explanation-pop2-stack-language-for-uxn'],
        },
        {
          type: 'category',
          label: 'Frontendjavascript',
          items: ['explanations/programming/frontendjavascript/explanation-react-rerender-vs-expensive-work'],
        },
        {
          type: 'category',
          label: 'Go',
          items: ['explanations/programming/go/explanation-go-portable-simd-package'],
        },
        {
          type: 'category',
          label: 'Java',
          items: ['explanations/programming/java/explanation-better-tools-immutable-data-java', 'explanations/programming/java/explanation-jdk-26-performance-improvements', 'explanations/programming/java/explanation-jep-540-simple-json-api-incubator', 'explanations/programming/java/explanation-netflix-ja-module-system-toolchain', 'explanations/programming/java/explanation-specjbb-workload-generator-same-jvm-limitations', 'explanations/programming/java/explanation-spring-ai-2-0-composable-tool-calling-advisor-architecture', 'explanations/programming/java/explanation-zgc-decade-of-low-latency-gc', 'explanations/programming/java/explanation-zgc-weak-reference-processing'],
        },
        {
          type: 'category',
          label: 'Linux',
          items: ['explanations/programming/linux/explanation-anduinos-2-0-declarative-ubuntu-desktop-distro', 'explanations/programming/linux/explanation-nsl-wsl-style-linux-machines-systemd-nspawn'],
        },
        {
          type: 'category',
          label: 'Linuxkernel',
          items: ['explanations/programming/linuxkernel/explanation-cve-2026-23111-nftables-use-after-free', 'explanations/programming/linuxkernel/explanation-isolcpus-irq-affinity', 'explanations/programming/linuxkernel/explanation-x86-tso-emulation-on-arm'],
        },
        {
          type: 'category',
          label: 'Python',
          items: ['explanations/programming/python/explanation-python-str-lower-idna-unicode-cve-2026-17084', 'explanations/programming/python/explanation-tempfile-gc-finalizer-antipattern'],
        },
        {
          type: 'category',
          label: 'Rust',
          items: ['explanations/programming/rust/explanation-deser-event-driven-serialization-rust', 'explanations/programming/rust/explanation-rust-1-98-algebraic-float-and-buffered-formatting'],
        },
        {
          type: 'category',
          label: 'Aiagentsecurity',
          items: ['explanations/securityprivacy/aiagentsecurity/explanation-closedquorum-llm-quorum-malware', 'explanations/securityprivacy/aiagentsecurity/explanation-cloudflare-security-audit-skill-multi-phase-agent-audits', 'explanations/securityprivacy/aiagentsecurity/explanation-enterprise-ai-data-security-patterns', 'explanations/securityprivacy/aiagentsecurity/explanation-evasionbench-instrumental-monitor-evasion', 'explanations/securityprivacy/aiagentsecurity/explanation-llm-agents-tamper-with-their-own-traces', 'explanations/securityprivacy/aiagentsecurity/explanation-llm-inference-engine-exploits', 'explanations/securityprivacy/aiagentsecurity/explanation-lm-studio-bionic-shell-judge-auto-review', 'explanations/securityprivacy/aiagentsecurity/explanation-local-llm-confidentiality-boundary-failures', 'explanations/securityprivacy/aiagentsecurity/explanation-miasma-worm-agentic-supply-chain-attack', 'explanations/securityprivacy/aiagentsecurity/explanation-openai-dots-boundary-problems-always-on-agents', 'explanations/securityprivacy/aiagentsecurity/explanation-openai-hugging-face-agent-incident', 'explanations/securityprivacy/aiagentsecurity/reference-kalibench-cybersecurity-tool-use-benchmark'],
        },
        {
          type: 'category',
          label: 'Bootsecurity',
          items: ['explanations/securityprivacy/bootsecurity/explanation-secure-boot-certificate-expiration-2026'],
        },
        {
          type: 'category',
          label: 'Kernelexploitation',
          items: ['explanations/securityprivacy/kernelexploitation/explanation-cve-2025-13032-avast-sandbox-double-fetch-lpe', 'explanations/securityprivacy/kernelexploitation/explanation-ps5-relapse-browser-to-kernel-exploit-chain'],
        },
        {
          type: 'category',
          label: 'P2Psecurity',
          items: ['explanations/securityprivacy/p2psecurity/explanation-radicle-cleartext-transport-node-impersonation'],
        },
        {
          type: 'category',
          label: 'Supplychain',
          items: ['explanations/securityprivacy/supplychain/explanation-tanstack-mini-shai-hulud-npm-worm-supply-chain-attack'],
        },
        {
          type: 'category',
          label: 'Tlsssl',
          items: ['explanations/securityprivacy/tlsssl/explanation-cloudflare-public-ca-mtc-post-quantum', 'explanations/securityprivacy/tlsssl/explanation-ssl-tls-three-jobs'],
        },
        {
          type: 'category',
          label: 'Virtualization',
          items: ['explanations/securityprivacy/virtualization/explanation-qubes-qsb-118-dom0-rce-copy-to-vm'],
        },
        {
          type: 'category',
          label: 'Websecurity',
          items: ['explanations/securityprivacy/websecurity/explanation-apple-reference-image-verified-photography', 'explanations/securityprivacy/websecurity/explanation-cisco-ise-cve-2026-76423-rest-api-auth-bypass', 'explanations/securityprivacy/websecurity/explanation-cloudflare-disallow-ai-training-mixed-use-crawlers', 'explanations/securityprivacy/websecurity/explanation-data-only-attacks-einstein', 'explanations/securityprivacy/websecurity/explanation-drupal-cve-2026-96362-batch-version-based-scanning-limits', 'explanations/securityprivacy/websecurity/explanation-feature-flags-are-not-authorization', 'explanations/securityprivacy/websecurity/explanation-kestra-cve-2026-49869-suffix-match-auth-bypass', 'explanations/securityprivacy/websecurity/explanation-libheif-heic-rce-chain-openai-sso-takeover', 'explanations/securityprivacy/websecurity/explanation-open-redirect-php-laravel', 'explanations/securityprivacy/websecurity/explanation-telnetd-cve-2026-32746-linemode-slc-buffer-overflow', 'explanations/securityprivacy/websecurity/explanation-wordpress-cve-2026-87902-patch-windows'],
        },
        {
          type: 'category',
          label: 'Cdndesign',
          items: ['explanations/systemdesign/cdndesign/explanation-cloudflare-vary-cache-rules'],
        },
        {
          type: 'category',
          label: 'Distributedsystemsfoundations',
          items: ['explanations/systemdesign/distributedsystemsfoundations/explanation-error-ownership-retry-storms', 'explanations/systemdesign/distributedsystemsfoundations/explanation-steelhead-dual-mode-consensus-shared-dag'],
        },
        {
          type: 'category',
          label: 'Durableexecutions',
          items: ['explanations/systemdesign/durableexecutions/explanation-timeout-attempt-state-model-for-paid-upstream-calls'],
        },
        {
          type: 'category',
          label: 'Multitenancy',
          items: ['explanations/systemdesign/multitenancy/explanation-multi-tenancy-isolation-models-saas'],
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
          label: 'Multiagentsystems',
          items: ['examples/aimachinelearning/multiagentsystems/example-agentic-fraud-investigation-tigergraph-11-agents'],
        },
        {
          type: 'category',
          label: 'Frontendjavascript',
          items: ['examples/programming/frontendjavascript/example-browser-only-pdf-processing-with-csp-enforcement', 'examples/programming/frontendjavascript/example-intl-segmenter-text-analysis'],
        },
        {
          type: 'category',
          label: 'Go',
          items: ['examples/programming/go/example-go-gin-orders-api-layered'],
        },
        {
          type: 'category',
          label: 'Java',
          items: ['examples/programming/java/example-babylon-hat-gpu-tensor-cores-from-java'],
        },
        {
          type: 'category',
          label: 'Linux',
          items: ['examples/programming/linux/example-self-sqlite-executable-self-httpd', 'examples/programming/linux/example-shell-job-control-suspend-bg-disown'],
        },
        {
          type: 'category',
          label: 'Webrealtime',
          items: ['examples/programming/webrealtime/example-webrtc-p2p-file-transfer-browser'],
        },
        {
          type: 'category',
          label: 'Zig',
          items: ['examples/programming/zig/example-zig-arraylist-pointer-stability-locks'],
        },
      ],
    },
  ],
};

export default sidebars;
