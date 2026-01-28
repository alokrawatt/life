'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import { Card } from '@/components/ui';
import { decisionService, journalService } from '@/lib/supabase/database';
import { Decision, JournalEntry } from '@/types';
import styles from './page.module.css';

export default function InsightsPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const [decisions, setDecisions] = useState<Decision[]>([]);
    const [journals, setJournals] = useState<JournalEntry[]>([]);
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
                const [decisionsData, journalsData] = await Promise.all([
                    decisionService.getAll(),
                    journalService.getAll(),
                ]);
                setDecisions(decisionsData);
                setJournals(journalsData);
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

    const insights = useMemo(() => {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Monthly data for charts
        const monthlyDecisions: Record<string, number> = {};
        const monthlyJournals: Record<string, number> = {};

        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(d);
            monthlyDecisions[key] = 0;
            monthlyJournals[key] = 0;
        }

        decisions.forEach(d => {
            const month = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(d.createdAt);
            if (month in monthlyDecisions) {
                monthlyDecisions[month]++;
            }
        });

        journals.forEach(j => {
            const month = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(j.createdAt);
            if (month in monthlyJournals) {
                monthlyJournals[month]++;
            }
        });

        // Confidence distribution
        const confidenceDist = [0, 0, 0, 0, 0];
        decisions.forEach(d => {
            confidenceDist[d.confidenceLevel - 1]++;
        });

        // Mood distribution
        const moodDist: Record<string, number> = {};
        journals.forEach(j => {
            if (j.mood) {
                moodDist[j.mood] = (moodDist[j.mood] || 0) + 1;
            }
        });

        // Recent activity (last 30 days)
        const recentDecisions = decisions.filter(d => d.createdAt >= thirtyDaysAgo).length;
        const recentJournals = journals.filter(j => j.createdAt >= thirtyDaysAgo).length;

        // Calculate streak
        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const allDates = [
            ...decisions.map(d => d.createdAt),
            ...journals.map(j => j.createdAt)
        ].sort((a, b) => b.getTime() - a.getTime());

        if (allDates.length > 0) {
            const checkDate = new Date(today);
            for (let i = 0; i < 365; i++) {
                const hasActivity = allDates.some(d => {
                    const actDate = new Date(d);
                    actDate.setHours(0, 0, 0, 0);
                    return actDate.getTime() === checkDate.getTime();
                });
                if (hasActivity) {
                    streak++;
                    checkDate.setDate(checkDate.getDate() - 1);
                } else if (i > 0) {
                    break;
                } else {
                    checkDate.setDate(checkDate.getDate() - 1);
                }
            }
        }

        return {
            totalDecisions: decisions.length,
            totalJournals: journals.length,
            totalReflections: decisions.reduce((acc, d) => acc + d.reflections.length, 0),
            recentDecisions,
            recentJournals,
            monthlyDecisions: Object.entries(monthlyDecisions),
            monthlyJournals: Object.entries(monthlyJournals),
            confidenceDist,
            moodDist: Object.entries(moodDist),
            streak,
            avgConfidence: decisions.length > 0
                ? (decisions.reduce((acc, d) => acc + d.confidenceLevel, 0) / decisions.length).toFixed(1)
                : '0',
        };
    }, [decisions, journals]);

    if (isLoading || !user || dataLoading) {
        return <div className={styles.loading}><div className={styles.spinner} /></div>;
    }

    const maxDecisions = Math.max(...insights.monthlyDecisions.map(([, v]) => v), 1);
    const maxJournals = Math.max(...insights.monthlyJournals.map(([, v]) => v), 1);

    return (
        <AppLayout>
            <div className={styles.container}>
                <header className={styles.header}>
                    <h1>Insights</h1>
                    <p>Patterns in your journey of reflection and decision-making</p>
                </header>

                <div className={styles.statsGrid}>
                    <Card className={styles.statCard}>
                        <span className={styles.statValue}>{insights.totalDecisions}</span>
                        <span className={styles.statLabel}>Decisions</span>
                    </Card>
                    <Card className={styles.statCard}>
                        <span className={styles.statValue}>{insights.totalJournals}</span>
                        <span className={styles.statLabel}>Journal Entries</span>
                    </Card>
                    <Card className={styles.statCard}>
                        <span className={styles.statValue}>{insights.totalReflections}</span>
                        <span className={styles.statLabel}>Reflections</span>
                    </Card>
                    <Card className={styles.statCard}>
                        <span className={styles.statValue}>{insights.streak}</span>
                        <span className={styles.statLabel}>Day Streak</span>
                    </Card>
                </div>

                {(decisions.length > 0 || journals.length > 0) ? (
                    <>
                        <div className={styles.chartsGrid}>
                            <Card className={styles.chartCard}>
                                <h3>Decisions Over Time</h3>
                                <div className={styles.barChart}>
                                    {insights.monthlyDecisions.map(([month, count]) => (
                                        <div key={month} className={styles.barWrapper}>
                                            <div
                                                className={styles.bar}
                                                style={{ height: `${(count / maxDecisions) * 100}%` }}
                                            >
                                                {count > 0 && <span className={styles.barValue}>{count}</span>}
                                            </div>
                                            <span className={styles.barLabel}>{month}</span>
                                        </div>
                                    ))}
                                </div>
                            </Card>

                            <Card className={styles.chartCard}>
                                <h3>Journal Entries Over Time</h3>
                                <div className={styles.barChart}>
                                    {insights.monthlyJournals.map(([month, count]) => (
                                        <div key={month} className={styles.barWrapper}>
                                            <div
                                                className={`${styles.bar} ${styles.barAlt}`}
                                                style={{ height: `${(count / maxJournals) * 100}%` }}
                                            >
                                                {count > 0 && <span className={styles.barValue}>{count}</span>}
                                            </div>
                                            <span className={styles.barLabel}>{month}</span>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>

                        {decisions.length > 0 && (
                            <Card className={styles.confidenceCard}>
                                <h3>Decision Confidence Distribution</h3>
                                <p className={styles.avgConfidence}>
                                    Average confidence: <strong>{insights.avgConfidence}</strong> / 5
                                </p>
                                <div className={styles.confidenceChart}>
                                    {insights.confidenceDist.map((count, i) => (
                                        <div key={i} className={styles.confidenceBar}>
                                            <div className={styles.confidenceLevel}>
                                                {['Uncertain', 'Hesitant', 'Neutral', 'Confident', 'Certain'][i]}
                                            </div>
                                            <div className={styles.confidenceProgress}>
                                                <div
                                                    className={styles.confidenceFill}
                                                    style={{
                                                        width: `${decisions.length > 0 ? (count / decisions.length) * 100 : 0}%`
                                                    }}
                                                />
                                            </div>
                                            <span className={styles.confidenceCount}>{count}</span>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {insights.moodDist.length > 0 && (
                            <Card className={styles.moodCard}>
                                <h3>Mood Patterns</h3>
                                <div className={styles.moodGrid}>
                                    {insights.moodDist.map(([mood, count]) => (
                                        <div key={mood} className={styles.moodItem}>
                                            <span className={styles.moodEmoji}>
                                                {mood === 'calm' && '😌'}
                                                {mood === 'content' && '😊'}
                                                {mood === 'uncertain' && '🤔'}
                                                {mood === 'anxious' && '😰'}
                                                {mood === 'hopeful' && '✨'}
                                                {mood === 'grateful' && '🙏'}
                                            </span>
                                            <span className={styles.moodName}>{mood}</span>
                                            <span className={styles.moodCount}>{count}</span>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}

                        <Card className={styles.recentCard}>
                            <h3>Last 30 Days</h3>
                            <div className={styles.recentStats}>
                                <div className={styles.recentStat}>
                                    <span className={styles.recentValue}>{insights.recentDecisions}</span>
                                    <span className={styles.recentLabel}>decisions made</span>
                                </div>
                                <div className={styles.recentStat}>
                                    <span className={styles.recentValue}>{insights.recentJournals}</span>
                                    <span className={styles.recentLabel}>journal entries</span>
                                </div>
                            </div>
                        </Card>
                    </>
                ) : (
                    <Card className={styles.empty}>
                        <h3>Start your journey</h3>
                        <p>Log decisions and write journal entries to see patterns and insights.</p>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
