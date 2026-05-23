import Layout from '@theme/Layout';
import useBaseUrl from '@docusaurus/useBaseUrl';
import React from 'react';
import styles from './index.module.css';

function DiataxisNav() {
  const baseUrl = useBaseUrl('');
  const types = [
    {
      title: 'Tutorials',
      description: 'Step-by-step learning paths for beginners and intermediate learners. Master new topics from the ground up.',
      icon: '📘',
      link: `${baseUrl}tutorials/ai-machine-learning/llms-agents/tutorial-interrogatory-llm`,
      color: '#3a7ca5',
    },
    {
      title: 'How-to Guides',
      description: 'Goal-oriented guides that solve specific problems. Get from A to B with clear, actionable steps.',
      icon: '🛠️',
      link: `${baseUrl}how-to/ai-machine-learning/llms-agents/howto-anthropic-routines-claude`,
      color: '#c9a84c',
    },
    {
      title: 'Reference',
      description: 'Technical documentation, specifications, and factual information. Quick lookups for developers.',
      icon: '📖',
      link: `${baseUrl}reference/ai-machine-learning/llms-agents/reference-ai-is-a-technology-not-a-product`,
      color: '#d4572a',
    },
    {
      title: 'Examples',
      description: 'Working code, demos, and concrete implementations. See it in action before you build it yourself.',
      icon: '💡',
      link: `${baseUrl}examples/ai-machine-learning/llms-agents/example-structured-prompt-driven-development-spdd`,
      color: '#5ba3c9',
    },
  ];

  return (
    <section className={styles.section}>
      <div className="container">
        <h2 className={styles.sectionTitle}>Explore by Learning Type</h2>
        <p className={styles.sectionSubtitle}>
          Content organized using the Diátaxis framework — find exactly what you need.
        </p>
        <div className={styles.grid}>
          {types.map((props, idx) => (
            <a
              key={idx}
              href={props.link}
              className={styles.card}
              style={{ animationDelay: `${idx * 0.1}s`, borderTopColor: props.color }}
            >
              <div className={styles.cardIcon}>{props.icon}</div>
              <h3 className={styles.cardTitle}>{props.title}</h3>
              <p className={styles.cardDescription}>{props.description}</p>
              <span className={styles.cardArrow} style={{ color: props.color }}>→</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function DomainExplorer() {
  const baseUrl = useBaseUrl('');
  const domains = [
    { name: 'AI & Machine Learning', topics: 'LLMs, Local AI, ML Ops, Agent Dev', link: `${baseUrl}tutorials/ai-machine-learning/llms-agents/tutorial-interrogatory-llm` },
    { name: 'Cloud & Infrastructure', topics: 'Kubernetes, GPU, Cloud Platforms', link: `${baseUrl}how-to/cloud-infrastructure/kubernetes/howto-running-agents-on-kubernetes-with-agent-sandbox` },
    { name: 'Programming', topics: 'Java, Spring, Query Optimization', link: `${baseUrl}how-to/programming/java-spring/howto-clean-up-test-data-spring` },
    { name: 'Developer Tools', topics: 'CI/CD, Architecture, Reliability', link: `${baseUrl}reference/developer-tools-practices/cicd-platforms/reference-ci-for-coding-agents` },
    { name: 'Data & Databases', topics: 'Data Mesh, Warehousing, Pipelines', link: `${baseUrl}reference/data-databases/data-architecture/reference-monzo-data-mesh` },
    { name: 'Security & Privacy', topics: 'AppSec, Vulnerabilities, Auth', link: `${baseUrl}reference/security-privacy/appsec-privacy/reference-chromium-browser-fetch-vulnerability` },
  ];

  return (
    <section className={styles.sectionAlt}>
      <div className="container">
        <h2 className={styles.sectionTitle}>Browse by Domain</h2>
        <div className={styles.domainGrid}>
          {domains.map((domain, idx) => (
            <a
              key={idx}
              href={domain.link}
              className={styles.domainCard}
            >
              <h4 className={styles.domainName}>{domain.name}</h4>
              <p className={styles.domainTopics}>{domain.topics}</p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function DailyUpdate() {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.updateBanner}>
          <div className={styles.updateIcon}>🔄</div>
          <div>
            <h3 className={styles.updateTitle}>Fresh Content Every Day</h3>
            <p className={styles.updateText}>
              New tutorials, how-to guides, and references are added daily from our automated research pipeline.
              Check back regularly to discover what's new.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const baseUrl = useBaseUrl('');
  return (
    <Layout
      title="Osgiliath Learning Hub"
      description="Tutorials, How-to Guides, and Reference — Updated Daily"
    >
      <header className={styles.hero}>
        <div className={styles.heroOverlay} />
        <div className="container">
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>LEARNING HUB</div>
            <h1 className={styles.heroTitle}>Osgiliath</h1>
            <p className={styles.heroSubtitle}>
              Your daily source for tutorials, guides, and technical reference
            </p>
            <p className={styles.heroDescription}>
              Curated learning content on AI, cloud infrastructure, programming, security, and more.
              Organized by the Diátaxis framework so you always find what you need.
            </p>
            <div className={styles.heroActions}>
              <a className="button button--primary button--lg" href={`${baseUrl}tutorials/ai-machine-learning/llms-agents/tutorial-interrogatory-llm`}>
                Start Exploring
              </a>
              <a className="button button--secondary button--lg" href={`${baseUrl}how-to/ai-machine-learning/llms-agents/howto-anthropic-routines-claude`}>
                Browse How-to Guides
              </a>
            </div>
          </div>
        </div>
      </header>

      <main>
        <DiataxisNav />
        <DomainExplorer />
        <DailyUpdate />
      </main>
    </Layout>
  );
}
