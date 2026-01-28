'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import { Card, Button, Input } from '@/components/ui';
import { decisionService } from '@/lib/supabase/database';
import { Decision } from '@/types';
import styles from './page.module.css';

export default function DecisionsPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const [decisions, setDecisions] = useState<Decision[]>([]);
    const [dataLoading, setDataLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'date' | 'confidence'>('date');

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/auth');
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        const loadDecisions = async () => {
            if (!user) return;
            try {
                const data = await decisionService.getAll();
                setDecisions(data);
            } catch (error) {
                console.error('Error loading decisions:', error);
            } finally {
                setDataLoading(false);
            }
        };

        if (user) {
            loadDecisions();
        }
    }, [user]);

    if (isLoading || !user || dataLoading) {
        return <div className={styles.loading}><div className={styles.spinner} /></div>;
    }

    const filteredDecisions = decisions
        .filter(d =>
            d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            d.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => {
            if (sortBy === 'date') {
                return b.createdAt.getTime() - a.createdAt.getTime();
            }
            return b.confidenceLevel - a.confidenceLevel;
        });

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        }).format(date);
    };

    return (
        <AppLayout>
            <div className={styles.container}>
                <header className={styles.header}>
                    <div>
                        <h1>Decision Log</h1>
                        <p>Track the meaningful choices that shape your life</p>
                    </div>
                    <Link href="/decisions/new">
                        <Button icon={
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                            </svg>
                        }>
                            New Decision
                        </Button>
                    </Link>
                </header>

                <div className={styles.filters}>
                    <Input
                        placeholder="Search decisions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        icon={
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <circle cx="11" cy="11" r="8" />
                                <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
                            </svg>
                        }
                    />
                    <div className={styles.sortButtons}>
                        <button
                            className={`${styles.sortBtn} ${sortBy === 'date' ? styles.active : ''}`}
                            onClick={() => setSortBy('date')}
                        >
                            By Date
                        </button>
                        <button
                            className={`${styles.sortBtn} ${sortBy === 'confidence' ? styles.active : ''}`}
                            onClick={() => setSortBy('confidence')}
                        >
                            By Confidence
                        </button>
                    </div>
                </div>

                {filteredDecisions.length > 0 ? (
                    <div className={styles.list}>
                        {filteredDecisions.map((decision) => (
                            <Link key={decision.id} href={`/decisions/${decision.id}`}>
                                <Card hoverable className={styles.decisionCard}>
                                    <div className={styles.cardHeader}>
                                        <h3>{decision.title}</h3>
                                        <div className={styles.confidence}>
                                            {[1, 2, 3, 4, 5].map((level) => (
                                                <span
                                                    key={level}
                                                    className={`${styles.dot} ${level <= decision.confidenceLevel ? styles.filled : ''}`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <p className={styles.description}>
                                        {decision.description.substring(0, 200)}
                                        {decision.description.length > 200 ? '...' : ''}
                                    </p>
                                    <div className={styles.meta}>
                                        <span className={styles.date}>{formatDate(decision.createdAt)}</span>
                                        {decision.reflections.length > 0 && (
                                            <span className={styles.reflections}>
                                                {decision.reflections.length} reflection{decision.reflections.length > 1 ? 's' : ''}
                                            </span>
                                        )}
                                        {decision.tags.length > 0 && (
                                            <div className={styles.tags}>
                                                {decision.tags.slice(0, 3).map((tag, i) => (
                                                    <span key={i} className={styles.tag}>{tag}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </div>
                ) : searchQuery ? (
                    <Card className={styles.empty}>
                        <p>No decisions match your search</p>
                    </Card>
                ) : (
                    <Card className={styles.empty}>
                        <div className={styles.emptyIcon}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                            </svg>
                        </div>
                        <h3>No decisions logged yet</h3>
                        <p>Start tracking the meaningful choices that shape your life</p>
                        <Link href="/decisions/new">
                            <Button>Log Your First Decision</Button>
                        </Link>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
