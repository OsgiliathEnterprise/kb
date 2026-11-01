import Layout from '@theme/Layout';
import React, { useState, useEffect } from 'react';
import styles from './index.module.css';

const BASE_URL = '/kb/';

// Shared feed of recent content, regenerated daily by the sync pipeline
// (static/whats-new.json). Links in that file are site-root-relative
// ("/tutorials/…") and must be prefixed with BASE_URL before use.
// Individual articles rotate out with the daily pipeline, so the homepage
// must never hardcode article URLs — link to the stable generated-index
// pages (tutorials/, how-to/, explanations/, examples/) or to this feed.
function useWhatsNew() {
  const [items, setItems] = useState(null);
  useEffect(() => {
    let alive = true;
    fetch(BASE_URL + 'whats-new.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('bad whats-new feed'))))
      .then((data) => {
        if (!alive) return;
        if (!Array.isArray(data)) {
          setItems([]);
          return;
        }
        setItems(
          data
            .filter((it) => it && it.title && it.link)
            .map((it) => ({ ...it, href: BASE_URL + String(it.link).replace(/^\//, '') })),
        );
      })
      .catch(() => {
        if (alive) setItems([]);
      });
    return () => {
      alive = false;
    };
  }, []);
  return items;
}

function DiataxisNav() {
  const types = [
    {
      title: 'Tutorials',
      description: 'Step-by-step learning paths for beginners and intermediate learners. Master new topics from the ground up.',
      icon: '📘',
      link: BASE_URL + 'tutorials/',
      color: '#3a7ca5',
    },
    {
      title: 'How-to Guides',
      description: 'Goal-oriented guides that solve specific problems. Get from A to B with clear, actionable steps.',
      icon: '🛠️',
      link: BASE_URL + 'how-to/',
      color: '#c9a84c',
    },
    {
      title: 'Explanations',
      description: 'Technical explanations, concepts, and factual information. Quick lookups for developers.',
      icon: '📖',
      link: BASE_URL + 'explanations/',
      color: '#d4572a',
    },
    {
      title: 'Examples',
      description: 'Working code, demos, and concrete implementations. See it in action before you build it yourself.',
      icon: '💡',
      link: BASE_URL + 'examples/',
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
  // Links point to the stable generated-index pages of the learning type
  // where each domain publishes most of its content — never to individual
  // rotating articles.
  const domains = [
    { name: 'AI & Machine Learning', topics: 'LLMs, Local AI, ML Ops, Agent Dev', link: BASE_URL + 'tutorials/' },
    { name: 'Cloud & Infrastructure', topics: 'Kubernetes, GPU, Cloud Platforms', link: BASE_URL + 'how-to/' },
    { name: 'Programming', topics: 'Java, Spring, Query Optimization', link: BASE_URL + 'how-to/' },
    { name: 'Developer Tools', topics: 'CI/CD, Architecture, Reliability', link: BASE_URL + 'explanations/' },
    { name: 'Data & Databases', topics: 'Data Mesh, Warehousing, Pipelines', link: BASE_URL + 'tutorials/' },
    { name: 'Security & Privacy', topics: 'AppSec, Vulnerabilities, Auth', link: BASE_URL + 'explanations/' },
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
  // Recent content — served from static/whats-new.json, updated daily by the
  // sync script. The section hides itself when the feed is unavailable.
  const recent = useWhatsNew();

  if (!recent || recent.length === 0) return null;

  return (
    <section className={styles.section}>
      <div className="container">
        <h2 className={styles.sectionTitle}>🔥 What's New</h2>
        <p className={styles.sectionSubtitle}>
          Fresh content added to the learning hub — updated daily from our research pipeline.
        </p>
        <div className={styles.whatsNewGrid}>
          {recent.slice(0, 5).map((item, idx) => (
            <a
              key={idx}
              href={item.href}
              className={styles.whatsNewCard}
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <span className={styles.whatsNewType}>{item.type}</span>
              <h4 className={styles.whatsNewTitle}>{item.title}</h4>
              <span className={styles.whatsNewTime}>{item.time || ''}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function DailyPick() {
  const items = useWhatsNew();

  if (!items || items.length === 0) return null;

  // Rotate picks based on day of year
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const pick = items[dayOfYear % items.length];

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
          <a href={pick.href} className={styles.dailyPickLink}>
            Read Now →
          </a>
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
              New tutorials, how-to guides, and explanations are added daily from our automated research pipeline.
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
      description="Tutorials, How-to Guides, and Explanations — Updated Daily"
    >
      <header className={styles.hero}>
        <div className={styles.heroOverlay} />
        <div className="container">
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>LEARNING HUB</div>
            <h1 className={styles.heroTitle}>Osgiliath</h1>
            <p className={styles.heroSubtitle}>
              Your daily source for tutorials, guides, and technical explanations
            </p>
            <p className={styles.heroDescription}>
              Curated learning content on AI, cloud infrastructure, programming, security, and more.
              Organized by the Diátaxis framework so you always find what you need.
            </p>
            <div className={styles.heroActions}>
              <a className="button button--primary button--lg" href={BASE_URL + 'tutorials/'}>
                Start Exploring
              </a>
              <a className="button button--secondary button--lg" href={BASE_URL + 'how-to/'}>
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
        <DailyUpdate />
      </main>
    </Layout>
  );
}
