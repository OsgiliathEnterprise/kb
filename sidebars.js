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
  ],
};

export default sidebars;
