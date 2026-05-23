import Layout from '@theme/Layout';
import React, { useState, useEffect } from 'react';
import styles from './index.module.css';

const BASE_URL = '/kb/';

function DiataxisNav() {
  const types = [
    {
      title: 'Tutorials',
      description: 'Step-by-step learning paths for beginners and intermediate learners. Master new topics from the ground up.',
      icon: '📘',
      link: BASE_URL + 'tutorials/ai-machine-learning/llms-agents/tutorial-interrogatory-llm',
      color: '#3a7ca5',
    },
    {
      title: 'How-to Guides',
      description: 'Goal-oriented guides that solve specific problems. Get from A to B with clear, actionable steps.',
      icon: '🛠️',
      link: BASE_URL + 'how-to/ai-machine-learning/llms-agents/howto-anthropic-routines-claude',
      color: '#c9a84c',
    },
    {
      title: 'Reference',
      description: 'Technical documentation, specifications, and factual information. Quick lookups for developers.',
      icon: '📖',
      link: BASE_URL + 'reference/ai-machine-learning/llms-agents/reference-ai-is-a-technology-not-a-product',
      color: '#d4572a',
    },
    {
      title: 'Examples',
      description: 'Working code, demos, and concrete implementations. See it in action before you build it yourself.',
      icon: '💡',
      link: BASE_URL + 'examples/ai-machine-learning/llms-agents/example-structured-prompt-driven-development-spdd',
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
  const domains = [
    { name: 'AI & Machine Learning', topics: 'LLMs, Local AI, ML Ops, Agent Dev', link: BASE_URL + 'tutorials/ai-machine-learning/llms-agents/tutorial-interrogatory-llm' },
    { name: 'Cloud & Infrastructure', topics: 'Kubernetes, GPU, Cloud Platforms', link: BASE_URL + 'how-to/cloud-infrastructure/kubernetes/howto-running-agents-on-kubernetes-with-agent-sandbox' },
    { name: 'Programming', topics: 'Java, Spring, Query Optimization', link: BASE_URL + 'how-to/programming/java-spring/howto-clean-up-test-data-spring' },
    { name: 'Developer Tools', topics: 'CI/CD, Architecture, Reliability', link: BASE_URL + 'reference/developer-tools-practices/cicd-platforms/reference-ci-for-coding-agents' },
    { name: 'Data & Databases', topics: 'Data Mesh, Warehousing, Pipelines', link: BASE_URL + 'reference/data-databases/data-architecture/reference-monzo-data-mesh' },
    { name: 'Security & Privacy', topics: 'AppSec, Vulnerabilities, Auth', link: BASE_URL + 'reference/security-privacy/appsec-privacy/reference-chromium-browser-fetch-vulnerability' },
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

function WhatsNew() {
  // Simulated "recent" content — in production this would come from an API
  const recent = [
    { title: 'Interrogatory LLM: A New Approach to AI Learning', type: 'Tutorial', link: BASE_URL + 'tutorials/ai-machine-learning/llms-agents/tutorial-interrogatory-llm', time: '5 min read' },
    { title: 'Anthropic Routines: Automating Claude Workflows', type: 'How-to', link: BASE_URL + 'how-to/ai-machine-learning/llms-agents/howto-anthropic-routines-claude', time: '8 min read' },
    { title: 'AI is a Technology, Not a Product', type: 'Reference', link: BASE_URL + 'reference/ai-machine-learning/llms-agents/reference-ai-is-a-technology-not-a-product', time: '3 min read' },
    { title: 'Running Agents on Kubernetes with Agent Sandbox', type: 'How-to', link: BASE_URL + 'how-to/cloud-infrastructure/kubernetes/howto-running-agents-on-kubernetes-with-agent-sandbox', time: '6 min read' },
    { title: 'MySQL Query Optimization with Releem', type: 'How-to', link: BASE_URL + 'how-to/programming/java-spring/howto-mysql-query-optimization-releem', time: '4 min read' },
    { title: 'Structured Prompt-Driven Development', type: 'Example', link: BASE_URL + 'examples/ai-machine-learning/llms-agents/example-structured-prompt-driven-development-spdd', time: '7 min read' },
  ];

  return (
    <section className={styles.section}>
      <div className="container">
        <h2 className={styles.sectionTitle}>🔥 What's New</h2>
        <p className={styles.sectionSubtitle}>
          Fresh content added to the learning hub — updated daily from our research pipeline.
        </p>
        <div className={styles.whatsNewGrid}>
          {recent.map((item, idx) => (
            <a
              key={idx}
              href={item.link}
              className={styles.whatsNewCard}
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <span className={styles.whatsNewType}>{item.type}</span>
              <h4 className={styles.whatsNewTitle}>{item.title}</h4>
              <span className={styles.whatsNewTime}>{item.time}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function DailyPick() {
  const [pick, setPick] = useState(null);

  useEffect(() => {
    // Rotate picks based on day of year
    const articles = [
      { title: 'What is Code? A Deep Dive', link: BASE_URL + 'tutorials/ai-machine-learning/llms-agents/tutorial-what-is-code', type: 'Tutorial' },
      { title: 'Anthropic Routines for Claude', link: BASE_URL + 'how-to/ai-machine-learning/llms-agents/howto-anthropic-routines-claude', type: 'How-to' },
      { title: 'Agent Protocol Stack: MCP, A2A, AG-UI', link: BASE_URL + 'reference/ai-machine-learning/llms-agents/reference-agent-protocol-stack-mcp-a2a-ag-ui', type: 'Reference' },
      { title: 'Mac Mini Agent Infrastructure', link: BASE_URL + 'tutorials/ai-machine-learning/aiassisted-development/tutorial-mac-mini-agent-infrastructure', type: 'Tutorial' },
      { title: 'MySQL Query Optimization', link: BASE_URL + 'how-to/programming/java-spring/howto-mysql-query-optimization-releem', type: 'How-to' },
      { title: 'Kubernetes v1.36 Release Overview', link: BASE_URL + 'reference/cloud-infrastructure/kubernetes/reference-kubernetes-v136-release-overview', type: 'Reference' },
      { title: 'Linux Second Severe Vulnerability', link: BASE_URL + 'how-to/security-privacy/appsec-privacy/howto-linux-second-severe-vulnerability', type: 'How-to' },
      { title: 'Monzo Data Mesh Architecture', link: BASE_URL + 'reference/data-databases/data-architecture/reference-monzo-data-mesh', type: 'Reference' },
    ];
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    setPick(articles[dayOfYear % articles.length]);
  }, []);

  if (!pick) return null;

  return (
    <section className={styles.dailyPickSection}>
      <div className="container">
        <div className={styles.dailyPickCard}>
          <div className={styles.dailyPickIcon}>⭐</div>
          <div className={styles.dailyPickContent}>
            <span className={styles.dailyPickBadge}>DAILY PICK</span>
            <h3 className={styles.dailyPickTitle}>{pick.title}</h3>
            <p className={styles.dailyPickType}>{pick.type}</p>
          </div>
          <a href={pick.link} className={styles.dailyPickLink}>
            Read Now →
          </a>
        </div>
      </div>
    </section>
  );
}

function BookmarkManager() {
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('osgiliath-bookmarks') || '[]');
    } catch {
      return [];
    }
  });

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    localStorage.setItem('osgiliath-bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  const handleBookmark = (url) => {
    if (!bookmarks.includes(url)) {
      setBookmarks([...bookmarks, url]);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <section className={styles.section}>
      <div className="container">
        <h2 className={styles.sectionTitle}>📚 Your Bookmarks</h2>
        <p className={styles.sectionSubtitle}>
          Save articles you want to read later. Your bookmarks persist in your browser.
        </p>
        {bookmarks.length === 0 ? (
          <div className={styles.emptyBookmarks}>
            <p>No bookmarks yet. Use the bookmark button on article pages to save your favorites.</p>
          </div>
        ) : (
          <div className={styles.bookmarkGrid}>
            {bookmarks.map((url, idx) => (
              <a key={idx} href={url} className={styles.bookmarkCard}>
                <span>🔖</span>
                <span>{new URL(url, window.location.origin).pathname.replace(BASE_URL, '').split('/')[1] || 'Saved Article'}</span>
              </a>
            ))}
            <button className={styles.clearBookmarks} onClick={() => setBookmarks([])}>
              Clear All
            </button>
          </div>
        )}
        {saved && <div className={styles.saveConfirmation}>✓ Saved to bookmarks!</div>}
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
              <a className="button button--primary button--lg" href={BASE_URL + 'tutorials/ai-machine-learning/llms-agents/tutorial-interrogatory-llm'}>
                Start Exploring
              </a>
              <a className="button button--secondary button--lg" href={BASE_URL + 'how-to/ai-machine-learning/llms-agents/howto-anthropic-routines-claude'}>
                Browse How-to Guides
              </a>
            </div>
          </div>
        </div>
      </header>

      <main>
        <DailyPick />
        <WhatsNew />
        <DiataxisNav />
        <DomainExplorer />
        <BookmarkManager />
        <DailyUpdate />
      </main>
    </Layout>
  );
}
