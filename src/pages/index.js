import Layout from '@theme/Layout';
import React from 'react';
import styles from './index.module.css';

function HomepageFeatures() {
  const features = [
    {
      title: 'Architecture & Design',
      description: (
        <>
          System architecture patterns, design decisions, and technical blueprints
          that shape our infrastructure.
        </>
      ),
      icon: '⚔',
      link: '/docs/category/architecture',
    },
    {
      title: 'Operations & Deployment',
      description: (
        <>
          CI/CD pipelines, container orchestration, monitoring, and the art
          of keeping the realm running smoothly.
        </>
      ),
      icon: '🛡',
      link: '/docs/category/operations',
    },
    {
      title: 'Security & Compliance',
      description: (
        <>
          Threat modeling, access controls, audit trails, and the vigilant
          watch against the shadows.
        </>
      ),
      icon: '🔥',
      link: '/docs/category/security',
    },
    {
      title: 'Development Guides',
      description: (
        <>
          Coding standards, development workflows, API references, and the
          tools of the craft.
        </>
      ),
      icon: '📜',
      link: '/docs/category/development',
    },
    {
      title: 'Data & Analytics',
      description: (
        <>
          Data pipelines, warehousing strategies, ML operations, and turning
          raw information into wisdom.
        </>
      ),
      icon: '💎',
      link: '/docs/category/data',
    },
    {
      title: 'Runbooks & Playbooks',
      description: (
        <>
          Incident response procedures, troubleshooting guides, and the
          collective knowledge of the watch.
        </>
      ),
      icon: '📖',
      link: '/docs/category/runbooks',
    },
  ];

  return (
    <section className={styles.features}>
      <div className="container">
        <div className={styles.featuresGrid}>
          {features.map((props, idx) => (
            <a
              key={idx}
              href={props.link}
              className={styles.featureCard}
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <div className={styles.featureIcon}>{props.icon}</div>
              <h3 className={styles.featureTitle}>{props.title}</h3>
              <p className={styles.featureDescription}>{props.description}</p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <Layout
      title="Osgiliath Enterprise Knowledge Base"
      description="The Bridge Between Knowledge and Wisdom"
    >
      <header className={styles.hero}>
        <div className={styles.heroOverlay} />
        <div className="container">
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>ENTERPRISE KNOWLEDGE BASE</div>
            <h1 className={styles.heroTitle}>Osgiliath</h1>
            <p className={styles.heroSubtitle}>
              The Bridge Between Knowledge and Wisdom
            </p>
            <p className={styles.heroDescription}>
              Welcome to the ancient capital of our technical documentation.
              Like the great city upon the Anduin, this knowledge base stands
              as the bridge connecting the light of understanding with the
              depths of technical mastery.
            </p>
            <div className={styles.heroActions}>
              <a className="button button--primary button--lg" href="/docs/intro">
                Enter the Archives
              </a>
              <a className="button button--secondary button--lg" href="/docs/category/quick-start">
                Quick Start
              </a>
            </div>
          </div>
        </div>
        <div className={styles.heroScroll}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
          </svg>
        </div>
      </header>

      <main>
        <HomepageFeatures />

        <section className={styles.quoteSection}>
          <div className="container">
            <blockquote className={styles.quote}>
              "Even the smallest person can change the course of the future."
              <footer>— The Archives of Osgiliath</footer>
            </blockquote>
          </div>
        </section>

        <section className={styles.statsSection}>
          <div className="container">
            <div className={styles.statsGrid}>
              <div className={styles.statItem}>
                <div className={styles.statNumber}>∞</div>
                <div className={styles.statLabel}>Knowledge to Share</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statNumber}>24/7</div>
                <div className={styles.statLabel}>Always Accessible</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statNumber}>1</div>
                <div className={styles.statLabel}>United Realm</div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
