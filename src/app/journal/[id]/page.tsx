'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import { Button, Card, Modal } from '@/components/ui';
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

export default function JournalDetailPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const [entry, setEntry] = useState<JournalEntry | null>(null);
    const [dataLoading, setDataLoading] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/auth');
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        const loadEntry = async () => {
            if (!user || !params.id) return;
            try {
                const e = await journalService.get(params.id as string);
                setEntry(e);
            } catch (error) {
                console.error('Error loading journal entry:', error);
            } finally {
                setDataLoading(false);
            }
        };

        if (user && params.id) {
            loadEntry();
        }
    }, [user, params.id]);

    const handleDelete = async () => {
        if (!entry) return;
        try {
            await journalService.delete(entry.id);
            router.push('/journal');
        } catch (error) {
            console.error('Error deleting entry:', error);
        }
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        }).format(date);
    };

    if (isLoading || !user || dataLoading) {
        return <div className={styles.loading}><div className={styles.spinner} /></div>;
    }

    if (!entry) {
        return (
            <AppLayout>
                <div className={styles.container}>
                    <Card className={styles.notFound}>
                        <h2>Entry not found</h2>
                        <p>This entry may have been deleted.</p>
                        <Button onClick={() => router.push('/journal')}>Back to Journal</Button>
                    </Card>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className={styles.container}>
                <header className={styles.header}>
                    <button className={styles.backBtn} onClick={() => router.push('/journal')}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Back to Journal
                    </button>
                    <div className={styles.headerActions}>
                        <Button variant="ghost" size="sm" onClick={() => setShowDeleteModal(true)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </Button>
                    </div>
                </header>

                <article className={styles.article}>
                    <div className={styles.meta}>
                        <span className={styles.date}>{formatDate(entry.createdAt)}</span>
                        {entry.mood && (
                            <span className={styles.mood}>
                                <span className={styles.moodEmoji}>{moodEmojis[entry.mood]}</span>
                                <span className={styles.moodLabel}>{entry.mood}</span>
                            </span>
                        )}
                    </div>

                    {entry.title && <h1>{entry.title}</h1>}

                    <div className={styles.content}>
                        {entry.content.split('\n').map((paragraph, i) => (
                            paragraph.trim() ? <p key={i}>{paragraph}</p> : <br key={i} />
                        ))}
                    </div>
                </article>

                <Modal
                    isOpen={showDeleteModal}
                    onClose={() => setShowDeleteModal(false)}
                    title="Delete Entry"
                >
                    <div className={styles.deleteModal}>
                        <p>Are you sure you want to delete this journal entry? This action cannot be undone.</p>
                        <div className={styles.deleteActions}>
                            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                                Cancel
                            </Button>
                            <Button variant="danger" onClick={handleDelete}>
                                Delete
                            </Button>
                        </div>
                    </div>
                </Modal>
            </div>
        </AppLayout>
    );
}
