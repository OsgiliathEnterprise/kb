// @ts-check
import {themes as prismThemes} from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Osgiliath Learning Hub',
  tagline: 'Tutorials, How-to Guides, and Reference — Updated Daily',
  favicon: 'img/favicon.svg',

  future: {
    v4: true,
  },

  url: 'https://OsgiliathEnterprise.github.io',
  baseUrl: '/kb/',

  organizationName: 'OsgiliathEnterprise',
  projectName: 'kb',

  onBrokenLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          routeBasePath: '/',
          editUrl: ({locale, docPath}) =>
            `https://github.com/OsgiliathEnterprise/kb/blob/main/docs/${docPath}`,
          // Show last updated date on every doc
          showLastUpdateTime: true,
          // Enable doc versions for future use
          lastVersion: 'current',
          versions: {
            current: {
              label: 'Current',
              path: '',
            },
          },
        },
        theme: {
          customCss: './src/css/custom.css',
        },
        // Disable blog entirely
        blog: false,
        sitemap: {
          changefreq: 'daily',
          priority: 0.5,
          ignorePatterns: ['/tags/**'],
        },
      }),
    ],
  ],

  plugins: [],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'img/social-card.png',
      colorMode: {
        defaultMode: 'dark',
        disableSwitch: false,
        respectPrefersColorScheme: true,
      },
      navbar: {
        title: 'Osgiliath',
        logo: {
          alt: 'Osgiliath Learning Hub',
          src: 'img/osgiliath-logo.svg',
          srcDark: 'img/osgiliath-logo.svg',
          width: 40,
          height: 40,
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'main',
            position: 'left',
            label: 'Learn',
          },
          {
            href: 'https://github.com/OsgiliathEnterprise',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      docs: {
        sidebar: {
          autoCollapseCategories: true,
          hideable: true,
        },
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Learn',
            items: [
              {
                label: 'Tutorials',
                href: '/tutorials/ai-machine-learning/llms-agents/tutorial-interrogatory-llm',
              },
              {
                label: 'How-to Guides',
                href: '/how-to/ai-machine-learning/llms-agents/howto-anthropic-routines-claude',
              },
              {
                label: 'Reference',
                href: '/reference/ai-machine-learning/llms-agents/reference-ai-is-a-technology-not-a-product',
              },
              {
                label: 'Examples',
                href: '/examples/ai-machine-learning/llms-agents/example-structured-prompt-driven-development-spdd',
              },
            ],
          },
          {
            title: 'Domains',
            items: [
              {
                label: 'AI & Machine Learning',
                href: '/tutorials/ai-machine-learning/llms-agents/tutorial-interrogatory-llm',
              },
              {
                label: 'Cloud & Infrastructure',
                href: '/how-to/cloud-infrastructure/kubernetes/howto-running-agents-on-kubernetes-with-agent-sandbox',
              },
              {
                label: 'Programming',
                href: '/how-to/programming/java-spring/howto-clean-up-test-data-spring',
              },
              {
                label: 'Security & Privacy',
                href: '/reference/security-privacy/appsec-privacy/reference-chromium-browser-fetch-vulnerability',
              },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/OsgiliathEnterprise',
              },
              {
                label: 'Discord',
                href: 'https://discord.gg/osgiliath',
              },
            ],
          },
        ],
        copyright: `Learning content updated daily from research feeds | Built with Docusaurus | Copyright &copy; ${new Date().getFullYear()} Osgiliath Enterprise`,
      },
      prism: {
        theme: prismThemes.oneLight,
        darkTheme: prismThemes.oneDark,
        additionalLanguages: ['bash', 'powershell', 'json', 'yaml', 'docker', 'diff', 'python', 'javascript', 'typescript', 'rust', 'go'],
      },
      metadata: [
        {name: 'description', content: 'Osgiliath Learning Hub — Daily tutorials, how-to guides, and technical reference on AI, cloud infrastructure, programming, and more.'},
        {name: 'keywords', content: 'tutorials, how-to guides, reference, AI, machine learning, cloud, kubernetes, programming, security, learning'},
      ],
      // Enable Algolia-like search (DocSearch or local)
      search: {
        hideable: true,
      },
    }),
};

export default config;
