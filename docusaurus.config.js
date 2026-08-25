// @ts-check
import {themes as prismThemes} from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
// Google Search Console verification key (injected via CI env var)
const googleSearchConsoleKey = process.env.GOOGLE_SEARCH_CONSOLE_META_KEY || '';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Osgiliath Learning Hub',
  tagline: 'Tutorials, How-to Guides, and Explanations — Updated Daily',
  favicon: 'img/favicon.svg',

  // Inject Google Search Console verification meta tag
  headTags: googleSearchConsoleKey
    ? [{
        tagName: 'meta',
        attributes: {
          name: 'google-site-verification',
          content: googleSearchConsoleKey,
        },
      }]
    : [],

  future: {
    v4: true,
  },

  url: 'https://osgiliathenterprise.github.io',
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
          lastmod: 'datetime',
          changefreq: 'daily',
          priority: 0.5,
          ignorePatterns: ['/tags/**', '/search', '/search/**'],
          createSitemapItems: async (params) => {
            const {defaultCreateSitemapItems, ...rest} = params;
            const items = await defaultCreateSitemapItems(rest);
            // Exclude search page from sitemap
            return items.filter((item) => !item.url.includes('/search'));
          },
        },
      }),
    ],
  ],

  // Indexed local search — no Algolia needed
  plugins: [
    [
      '@easyops-cn/docusaurus-search-local',
      {
        indexDocs: true,
        indexBlog: false,
        indexPages: false,
        language: ['en'],
      },
    ],
  ],

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
            type: 'search',
            position: 'right',
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
                label: 'How-to Guides',
                href: '/how-to/securityprivacy/aiagentsecurity/howto-mcp-security-hardening',
              },
              {
                label: 'Explanations',
                href: '/explanations/securityprivacy/tlsssl/explanation-ssl-tls-three-jobs',
              },
              {
                label: 'Examples',
                href: '/examples/programming/frontendjavascript/example-intl-segmenter-text-analysis',
              },
            ],
          },
          {
            title: 'Domains',
            items: [
              {
                label: 'AI & Machine Learning',
                href: '/explanations/aimachinelearning/agentarchitecture/explanation-agent-guardrail-stack',
              },
              {
                label: 'Cloud & Infrastructure',
                href: '/explanations/cloudinfrastructure/streaming/explanation-picomq-durable-streams',
              },
              {
                label: 'Programming',
                href: '/explanations/programming/linuxkernel/explanation-isolcpus-irq-affinity',
              },
              {
                label: 'Security & Privacy',
                href: '/explanations/securityprivacy/aiagentsecurity/explanation-llm-inference-engine-exploits',
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
        {name: 'description', content: 'Osgiliath Learning Hub — Daily tutorials, how-to guides, and explanations on AI, cloud infrastructure, programming, and more.'},
        {name: 'keywords', content: 'tutorials, how-to guides, explanations, examples, AI, machine learning, cloud, kubernetes, programming, security, learning'},
      ],
    }),
};

export default config;
