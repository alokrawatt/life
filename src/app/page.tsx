'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

export default function HomePage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // If already logged in, redirect to dashboard
        if (!isLoading && user) {
            router.push('/dashboard');
        }
    }, [user, isLoading, router]);

    if (isLoading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner} />
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Hero Section */}
            <header className={styles.header}>
                <nav className={styles.nav}>
                    <Link href="/" className={styles.logo}>LIFE</Link>
                    <div className={styles.navLinks}>
                        <Link href="/auth" className={styles.signInBtn}>Sign In</Link>
                    </div>
                </nav>
            </header>

            <main className={styles.main}>
                <section className={styles.hero}>
                    <div className={styles.heroContent}>
                        <h1 className={styles.heroTitle}>
                            A calm space for<br />
                            <span className={styles.highlight}>meaningful decisions</span>
                        </h1>
                        <p className={styles.heroDescription}>
                            Track the choices that shape your life. Reflect on your journey.
                            Navigate life phases with intention and clarity.
                        </p>
                        <div className={styles.heroCta}>
                            <Link href="/auth" className={styles.primaryBtn}>
                                Get Started — Free
                            </Link>
                            <Link href="#features" className={styles.secondaryBtn}>
                                Learn More
                            </Link>
                        </div>
                    </div>
                    <div className={styles.heroVisual}>
                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <span className={styles.cardDate}>Today</span>
                                <div className={styles.dots}>
                                    <span className={`${styles.dot} ${styles.filled}`} />
                                    <span className={`${styles.dot} ${styles.filled}`} />
                                    <span className={`${styles.dot} ${styles.filled}`} />
                                    <span className={`${styles.dot} ${styles.filled}`} />
                                    <span className={styles.dot} />
                                </div>
                            </div>
                            <h3 className={styles.cardTitle}>Decided to focus on what matters</h3>
                            <p className={styles.cardText}>Taking control of my time and priorities...</p>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className={styles.features}>
                    <h2 className={styles.sectionTitle}>Everything you need to reflect</h2>
                    <div className={styles.featureGrid}>
                        <div className={styles.feature}>
                            <div className={styles.featureIcon}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <h3>Decision Tracking</h3>
                            <p>Log meaningful choices with context and confidence levels. Look back and learn from patterns.</p>
                        </div>
                        <div className={styles.feature}>
                            <div className={styles.featureIcon}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M4 19.5A2.5 2.5 0 016.5 17H20" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <h3>Private Journal</h3>
                            <p>Write freely without judgment. Your thoughts are private and encrypted.</p>
                        </div>
                        <div className={styles.feature}>
                            <div className={styles.featureIcon}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <h3>Life Phases</h3>
                            <p>Define chapters of your life with goals and values. Track progress through seasons of growth.</p>
                        </div>
                        <div className={styles.feature}>
                            <div className={styles.featureIcon}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M18 20V10M12 20V4M6 20v-6" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <h3>Personal Insights</h3>
                            <p>Discover patterns in your decisions and moods. Understand yourself better over time.</p>
                        </div>
                    </div>
                </section>

                {/* Values Section */}
                <section className={styles.values}>
                    <div className={styles.valueCard}>
                        <div className={styles.valueIcon}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0110 0v4" />
                            </svg>
                        </div>
                        <h3>Privacy First</h3>
                        <p>Your data is yours. End-to-end encryption and row-level security keep your thoughts private.</p>
                    </div>
                    <div className={styles.valueCard}>
                        <div className={styles.valueIcon}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5" />
                                <path d="M2 12l10 5 10-5" />
                            </svg>
                        </div>
                        <h3>Sync Everywhere</h3>
                        <p>Access your data on any device. Changes sync seamlessly across all your platforms.</p>
                    </div>
                    <div className={styles.valueCard}>
                        <div className={styles.valueIcon}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                            </svg>
                        </div>
                        <h3>Made with Care</h3>
                        <p>Designed for calm and clarity. No notifications, no gamification—just you and your thoughts.</p>
                    </div>
                </section>

                {/* CTA Section */}
                <section className={styles.cta}>
                    <h2>Start your journey of reflection</h2>
                    <p>Join others who use LIFE to make intentional choices</p>
                    <Link href="/auth" className={styles.ctaBtn}>
                        Get Started for Free
                    </Link>
                </section>
            </main>

            <footer className={styles.footer}>
                <div className={styles.footerContent}>
                    <span className={styles.footerLogo}>LIFE</span>
                    <p>A calm space for meaningful decisions</p>
                </div>
            </footer>
        </div>
    );
}
