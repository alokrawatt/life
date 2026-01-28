'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import { Card, Button, Input } from '@/components/ui';
import { journalService } from '@/lib/supabase/database';
import { JournalEntry } from '@/types';
import styles from './page.module.css';

const moodEmojis: Record<string, string> = {
    calm: '😌',
    content: '😊',
    uncertain: '🤔',
    anxious: '😰',
    hopeful: '✨',
    grateful: '🙏',
};

export default function JournalPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [dataLoading, setDataLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/auth');
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        const loadEntries = async () => {
            if (!user) return;
            try {
                const data = await journalService.getAll();
                setEntries(data);
            } catch (error) {
                console.error('Error loading journal entries:', error);
            } finally {
                setDataLoading(false);
            }
        };

        if (user) {
            loadEntries();
        }
    }, [user]);

    if (isLoading || !user || dataLoading) {
        return <div className={styles.loading}><div className={styles.spinner} /></div>;
    }

    const filteredEntries = entries
        .filter(e =>
            (e.title?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
            e.content.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const groupedEntries = filteredEntries.reduce((groups, entry) => {
        const month = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(entry.createdAt);
        if (!groups[month]) groups[month] = [];
        groups[month].push(entry);
        return groups;
    }, {} as Record<string, JournalEntry[]>);

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            weekday: 'short',
            day: 'numeric',
        }).format(date);
    };

    return (
        <AppLayout>
            <div className={styles.container}>
                <header className={styles.header}>
                    <div>
                        <h1>Journal</h1>
                        <p>Your private space for thoughts and reflections</p>
                    </div>
                    <Link href="/journal/new">
                        <Button icon={
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                            </svg>
                        }>
                            New Entry
                        </Button>
                    </Link>
                </header>

                <div className={styles.search}>
                    <Input
                        placeholder="Search your journal..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        icon={
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <circle cx="11" cy="11" r="8" />
                                <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
                            </svg>
                        }
                    />
                </div>

                {Object.keys(groupedEntries).length > 0 ? (
                    <div className={styles.timeline}>
                        {Object.entries(groupedEntries).map(([month, monthEntries]) => (
                            <div key={month} className={styles.monthGroup}>
                                <h3 className={styles.monthHeader}>{month}</h3>
                                <div className={styles.entriesList}>
                                    {monthEntries.map((entry) => (
                                        <Link key={entry.id} href={`/journal/${entry.id}`}>
                                            <Card hoverable className={styles.entryCard}>
                                                <div className={styles.entryHeader}>
                                                    <span className={styles.entryDate}>{formatDate(entry.createdAt)}</span>
                                                    {entry.mood && (
                                                        <span className={styles.mood} title={entry.mood}>
                                                            {moodEmojis[entry.mood]}
                                                        </span>
                                                    )}
                                                </div>
                                                {entry.title && <h4 className={styles.entryTitle}>{entry.title}</h4>}
                                                <p className={styles.entryPreview}>
                                                    {entry.content.substring(0, 150)}
                                                    {entry.content.length > 150 ? '...' : ''}
                                                </p>
                                            </Card>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : searchQuery ? (
                    <Card className={styles.empty}>
                        <p>No entries match your search</p>
                    </Card>
                ) : (
                    <Card className={styles.empty}>
                        <div className={styles.emptyIcon}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
                            </svg>
                        </div>
                        <h3>Start your journal</h3>
                        <p>Write freely without judgment. Your thoughts are private.</p>
                        <Link href="/journal/new">
                            <Button>Write Your First Entry</Button>
                        </Link>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
