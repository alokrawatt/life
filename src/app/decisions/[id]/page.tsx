'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import { Button, Card, Textarea, Modal } from '@/components/ui';
import { decisionService } from '@/lib/supabase/database';
import { Decision } from '@/types';
import styles from './page.module.css';

export default function DecisionDetailPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const [decision, setDecision] = useState<Decision | null>(null);
    const [dataLoading, setDataLoading] = useState(true);
    const [newReflection, setNewReflection] = useState('');
    const [isAddingReflection, setIsAddingReflection] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/auth');
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        const loadDecision = async () => {
            if (!user || !params.id) return;
            try {
                const d = await decisionService.get(params.id as string);
                setDecision(d);
            } catch (error) {
                console.error('Error loading decision:', error);
            } finally {
                setDataLoading(false);
            }
        };

        if (user && params.id) {
            loadDecision();
        }
    }, [user, params.id]);

    const handleAddReflection = async () => {
        if (!newReflection.trim() || !decision) return;

        setIsAddingReflection(true);
        try {
            const updated = await decisionService.addReflection(decision.id, newReflection);
            if (updated) {
                setDecision(updated);
                setNewReflection('');
            }
        } catch (error) {
            console.error('Error adding reflection:', error);
        } finally {
            setIsAddingReflection(false);
        }
    };

    const handleDelete = async () => {
        if (!decision) return;
        try {
            await decisionService.delete(decision.id);
            router.push('/decisions');
        } catch (error) {
            console.error('Error deleting decision:', error);
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

    const formatTime = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: '2-digit',
        }).format(date);
    };

    if (isLoading || !user || dataLoading) {
        return <div className={styles.loading}><div className={styles.spinner} /></div>;
    }

    if (!decision) {
        return (
            <AppLayout>
                <div className={styles.container}>
                    <Card className={styles.notFound}>
                        <h2>Decision not found</h2>
                        <p>This decision may have been deleted.</p>
                        <Button onClick={() => router.push('/decisions')}>Back to Decisions</Button>
                    </Card>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className={styles.container}>
                <header className={styles.header}>
                    <button className={styles.backBtn} onClick={() => router.push('/decisions')}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Back to Decisions
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
                        <span className={styles.date}>{formatDate(decision.createdAt)}</span>
                        <div className={styles.confidence}>
                            {[1, 2, 3, 4, 5].map((level) => (
                                <span
                                    key={level}
                                    className={`${styles.dot} ${level <= decision.confidenceLevel ? styles.filled : ''}`}
                                />
                            ))}
                            <span className={styles.confidenceLabel}>
                                {decision.confidenceLevel === 1 && 'Uncertain'}
                                {decision.confidenceLevel === 2 && 'Hesitant'}
                                {decision.confidenceLevel === 3 && 'Neutral'}
                                {decision.confidenceLevel === 4 && 'Confident'}
                                {decision.confidenceLevel === 5 && 'Certain'}
                            </span>
                        </div>
                    </div>

                    <h1>{decision.title}</h1>

                    <div className={styles.content}>
                        <p>{decision.description}</p>
                    </div>

                    {decision.tags.length > 0 && (
                        <div className={styles.tags}>
                            {decision.tags.map((tag, i) => (
                                <span key={i} className={styles.tag}>{tag}</span>
                            ))}
                        </div>
                    )}
                </article>

                <section className={styles.reflections}>
                    <h2>Reflections</h2>
                    <p className={styles.reflectionsHint}>
                        Add thoughts as you look back on this decision over time
                    </p>

                    <div className={styles.reflectionForm}>
                        <Textarea
                            placeholder="What do you think about this decision now?"
                            value={newReflection}
                            onChange={(e) => setNewReflection(e.target.value)}
                            rows={3}
                        />
                        <Button
                            onClick={handleAddReflection}
                            disabled={!newReflection.trim()}
                            isLoading={isAddingReflection}
                            size="sm"
                        >
                            Add Reflection
                        </Button>
                    </div>

                    {decision.reflections.length > 0 ? (
                        <div className={styles.reflectionsList}>
                            {decision.reflections.map((reflection) => (
                                <Card key={reflection.id} className={styles.reflectionCard}>
                                    <p>{reflection.content}</p>
                                    <span className={styles.reflectionDate}>
                                        {formatDate(reflection.createdAt)} at {formatTime(reflection.createdAt)}
                                    </span>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <p className={styles.noReflections}>No reflections yet</p>
                    )}
                </section>

                <Modal
                    isOpen={showDeleteModal}
                    onClose={() => setShowDeleteModal(false)}
                    title="Delete Decision"
                >
                    <div className={styles.deleteModal}>
                        <p>Are you sure you want to delete this decision? This action cannot be undone.</p>
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
