// @ts-check
import {themes as prismThemes} from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Osgiliath Enterprise',
  tagline: 'The Bridge Between Knowledge and Wisdom',
  favicon: 'img/favicon.svg',

  future: {
    v4: true,
  },

  url: 'https://OsgiliathEnterprise.github.io',
  baseUrl: '/kb/',

  organizationName: 'OsgiliathEnterprise',
  projectName: 'kb',

  onBrokenLinks: 'throw',

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
          routeBasePath: '/docs',
          editUrl: ({locale, docPath}) =>
            `https://github.com/OsgiliathEnterprise/kb/blob/main/docs/${docPath}`,
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          editUrl: ({locale, blogPath}) =>
            `https://github.com/OsgiliathEnterprise/kb/blob/main/blog/${blogPath}`,
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
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
          alt: 'Osgiliath Enterprise Logo',
          src: 'img/osgiliath-logo.svg',
          srcDark: 'img/osgiliath-logo.svg',
          width: 40,
          height: 40,
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'docsSidebar',
            position: 'left',
            label: 'Documentation',
          },
          {to: '/blog', label: 'Chronicles', position: 'left'},
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
            title: 'Documentation',
            items: [
              {
                label: 'Getting Started',
                to: '/docs/intro',
              },
              {
                label: 'Quick Start',
                to: '/docs/quickstart/overview',
              },
              {
                label: 'API Reference',
                to: '/docs/api/overview',
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
          {
            title: 'More',
            items: [
              {
                label: 'Chronicles (Blog)',
                to: '/blog',
              },
              {
                label: 'Status',
                href: 'https://status.osgiliath.enterprise',
              },
            ],
          },
        ],
        copyright: `Built with Docusaurus | Forged in the fires of Osgiliath | Copyright &copy; ${new Date().getFullYear()} Osgiliath Enterprise`,
      },
      prism: {
        theme: prismThemes.oneLight,
        darkTheme: prismThemes.oneDark,
        additionalLanguages: ['bash', 'powershell', 'json', 'yaml', 'docker', 'diff', 'python', 'javascript', 'typescript'],
      },
      metadata: [
        {name: 'description', content: 'Osgiliath Enterprise Knowledge Base - The Bridge Between Knowledge and Wisdom'},
        {name: 'keywords', content: 'Osgiliath, Enterprise, Knowledge Base, Documentation, Technology'},
      ],
    }),
};

export default config;
