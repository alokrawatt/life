'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import { Card, Button } from '@/components/ui';
import { decisionService, journalService, phaseService } from '@/lib/supabase/database';
import { Decision, JournalEntry, LifePhase } from '@/types';
import styles from './page.module.css';

export default function DashboardPage() {
    const { user, profile, isLoading } = useAuth();
    const router = useRouter();
    const [decisions, setDecisions] = useState<Decision[]>([]);
    const [journals, setJournals] = useState<JournalEntry[]>([]);
    const [activePhase, setActivePhase] = useState<LifePhase | null>(null);
    const [dataLoading, setDataLoading] = useState(true);

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/auth');
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        const loadData = async () => {
            if (!user) return;

            try {
                const [decisionsData, journalsData, activePhaseData] = await Promise.all([
                    decisionService.getAll(),
                    journalService.getAll(),
                    phaseService.getActive(),
                ]);

                setDecisions(decisionsData);
                setJournals(journalsData);
                setActivePhase(activePhaseData);
            } catch (error) {
                console.error('Error loading data:', error);
            } finally {
                setDataLoading(false);
            }
        };

        if (user) {
            loadData();
        }
    }, [user]);

    if (isLoading || !user || dataLoading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner} />
            </div>
        );
    }

    const recentDecisions = decisions.slice(0, 3);
    const recentJournals = journals.slice(0, 3);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
        }).format(date);
    };

    return (
        <AppLayout>
            <div className={styles.container}>
                <header className={styles.header}>
                    <div className={styles.greeting}>
                        <h1>{getGreeting()}</h1>
                        <p>Take a moment to reflect on your journey</p>
                    </div>
                    <div className={styles.actions}>
                        <Link href="/decisions/new">
                            <Button icon={
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                                </svg>
                            }>
                                Log Decision
                            </Button>
                        </Link>
                        <Link href="/journal/new">
                            <Button variant="secondary" icon={
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                                </svg>
                            }>
                                Write Entry
                            </Button>
                        </Link>
                    </div>
                </header>

                {activePhase && (
                    <Card className={styles.phaseCard}>
                        <div className={styles.phaseHeader}>
                            <span className={styles.phaseLabel}>Current Life Phase</span>
                            <Link href={`/phases/${activePhase.id}`} className={styles.phaseLink}>
                                View →
                            </Link>
                        </div>
                        <h3 className={styles.phaseName}>{activePhase.name}</h3>
                        {activePhase.description && (
                            <p className={styles.phaseDesc}>{activePhase.description}</p>
                        )}
                        <div className={styles.phaseStats}>
                            <span>{activePhase.goals.filter(g => g.status === 'active').length} active goals</span>
                            <span>•</span>
                            <span>Since {formatDate(activePhase.startDate)}</span>
                        </div>
                    </Card>
                )}

                <div className={styles.grid}>
                    <section className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h2>Recent Decisions</h2>
                            <Link href="/decisions" className={styles.viewAll}>View all →</Link>
                        </div>
                        {recentDecisions.length > 0 ? (
                            <div className={styles.list}>
                                {recentDecisions.map((decision) => (
                                    <Link key={decision.id} href={`/decisions/${decision.id}`}>
                                        <Card hoverable className={styles.listItem}>
                                            <div className={styles.itemHeader}>
                                                <h4>{decision.title}</h4>
                                                <span className={styles.date}>{formatDate(decision.createdAt)}</span>
                                            </div>
                                            <p className={styles.itemDesc}>
                                                {decision.description.substring(0, 100)}
                                                {decision.description.length > 100 ? '...' : ''}
                                            </p>
                                            <div className={styles.confidence}>
                                                {[1, 2, 3, 4, 5].map((level) => (
                                                    <span
                                                        key={level}
                                                        className={`${styles.dot} ${level <= decision.confidenceLevel ? styles.filled : ''}`}
                                                    />
                                                ))}
                                                <span className={styles.confidenceLabel}>Confidence</span>
                                            </div>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <Card className={styles.empty}>
                                <p>No decisions logged yet</p>
                                <Link href="/decisions/new">
                                    <Button variant="secondary" size="sm">Log your first decision</Button>
                                </Link>
                            </Card>
                        )}
                    </section>

                    <section className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h2>Recent Journal</h2>
                            <Link href="/journal" className={styles.viewAll}>View all →</Link>
                        </div>
                        {recentJournals.length > 0 ? (
                            <div className={styles.list}>
                                {recentJournals.map((entry) => (
                                    <Link key={entry.id} href={`/journal/${entry.id}`}>
                                        <Card hoverable className={styles.listItem}>
                                            <div className={styles.itemHeader}>
                                                <h4>{entry.title || 'Untitled Entry'}</h4>
                                                <span className={styles.date}>{formatDate(entry.createdAt)}</span>
                                            </div>
                                            <p className={styles.itemDesc}>
                                                {entry.content.substring(0, 100)}
                                                {entry.content.length > 100 ? '...' : ''}
                                            </p>
                                            {entry.mood && (
                                                <span className={styles.mood}>{entry.mood}</span>
                                            )}
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <Card className={styles.empty}>
                                <p>No journal entries yet</p>
                                <Link href="/journal/new">
                                    <Button variant="secondary" size="sm">Write your first entry</Button>
                                </Link>
                            </Card>
                        )}
                    </section>
                </div>

                <div className={styles.statsGrid}>
                    <Card className={styles.statCard}>
                        <span className={styles.statValue}>{decisions.length}</span>
                        <span className={styles.statLabel}>Decisions</span>
                    </Card>
                    <Card className={styles.statCard}>
                        <span className={styles.statValue}>{journals.length}</span>
                        <span className={styles.statLabel}>Journal Entries</span>
                    </Card>
                    <Card className={styles.statCard}>
                        <span className={styles.statValue}>
                            {decisions.reduce((acc, d) => acc + d.reflections.length, 0)}
                        </span>
                        <span className={styles.statLabel}>Reflections</span>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
