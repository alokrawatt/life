'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import { Button, Card, Modal, Input, Textarea } from '@/components/ui';
import { phaseService } from '@/lib/supabase/database';
import { LifePhase, Goal } from '@/types';
import styles from './page.module.css';

export default function PhaseDetailPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const [phase, setPhase] = useState<LifePhase | null>(null);
    const [dataLoading, setDataLoading] = useState(true);
    const [showGoalModal, setShowGoalModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [goalForm, setGoalForm] = useState({ title: '', description: '' });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/auth');
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        const loadPhase = async () => {
            if (!user || !params.id) return;
            try {
                const p = await phaseService.get(params.id as string);
                setPhase(p);
            } catch (error) {
                console.error('Error loading phase:', error);
            } finally {
                setDataLoading(false);
            }
        };

        if (user && params.id) {
            loadPhase();
        }
    }, [user, params.id]);

    const handleAddGoal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!phase || !goalForm.title.trim()) return;

        setIsSaving(true);
        try {
            const updated = await phaseService.addGoal(phase.id, goalForm.title, goalForm.description || undefined);
            if (updated) {
                setPhase(updated);
                setGoalForm({ title: '', description: '' });
                setShowGoalModal(false);
            }
        } catch (error) {
            console.error('Error adding goal:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const updateGoalStatus = async (goalId: string, status: Goal['status']) => {
        if (!phase) return;
        try {
            await phaseService.updateGoal(goalId, { status });
            const updated = await phaseService.get(phase.id);
            if (updated) setPhase(updated);
        } catch (error) {
            console.error('Error updating goal:', error);
        }
    };

    const toggleActive = async () => {
        if (!phase) return;
        try {
            const updated = await phaseService.update(phase.id, {
                isActive: !phase.isActive,
                endDate: phase.isActive ? new Date() : undefined
            });
            if (updated) setPhase(updated);
        } catch (error) {
            console.error('Error updating phase:', error);
        }
    };

    const handleDelete = async () => {
        if (!phase) return;
        try {
            await phaseService.delete(phase.id);
            router.push('/phases');
        } catch (error) {
            console.error('Error deleting phase:', error);
        }
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        }).format(date);
    };

    if (isLoading || !user || dataLoading) {
        return <div className={styles.loading}><div className={styles.spinner} /></div>;
    }

    if (!phase) {
        return (
            <AppLayout>
                <div className={styles.container}>
                    <Card className={styles.notFound}>
                        <h2>Phase not found</h2>
                        <Button onClick={() => router.push('/phases')}>Back to Phases</Button>
                    </Card>
                </div>
            </AppLayout>
        );
    }

    const activeGoals = phase.goals.filter(g => g.status === 'active');
    const completedGoals = phase.goals.filter(g => g.status === 'completed');
    const otherGoals = phase.goals.filter(g => g.status === 'paused' || g.status === 'abandoned');

    return (
        <AppLayout>
            <div className={styles.container}>
                <header className={styles.header}>
                    <button className={styles.backBtn} onClick={() => router.push('/phases')}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Back to Phases
                    </button>
                    <div className={styles.headerActions}>
                        <Button variant="ghost" size="sm" onClick={() => setShowDeleteModal(true)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                            </svg>
                        </Button>
                    </div>
                </header>

                <div className={styles.phaseHeader}>
                    {phase.isActive && <span className={styles.activeBadge}>Active Phase</span>}
                    <h1>{phase.name}</h1>
                    {phase.description && <p className={styles.description}>{phase.description}</p>}
                    <div className={styles.meta}>
                        <span>Started {formatDate(phase.startDate)}</span>
                        {phase.endDate && <span>• Ended {formatDate(phase.endDate)}</span>}
                    </div>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={toggleActive}
                    >
                        {phase.isActive ? 'Mark as Complete' : 'Set as Active'}
                    </Button>
                </div>

                {phase.values.length > 0 && (
                    <section className={styles.section}>
                        <h2>Values</h2>
                        <div className={styles.values}>
                            {phase.values.map((value, i) => (
                                <span key={i} className={styles.value}>{value}</span>
                            ))}
                        </div>
                    </section>
                )}

                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2>Goals</h2>
                        <Button size="sm" onClick={() => setShowGoalModal(true)} icon={
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                            </svg>
                        }>
                            Add Goal
                        </Button>
                    </div>

                    {activeGoals.length > 0 && (
                        <div className={styles.goalGroup}>
                            <h3 className={styles.goalGroupTitle}>Active</h3>
                            {activeGoals.map((goal) => (
                                <Card key={goal.id} className={styles.goalCard}>
                                    <div className={styles.goalContent}>
                                        <h4>{goal.title}</h4>
                                        {goal.description && <p>{goal.description}</p>}
                                    </div>
                                    <div className={styles.goalActions}>
                                        <button onClick={() => updateGoalStatus(goal.id, 'completed')} title="Complete">✓</button>
                                        <button onClick={() => updateGoalStatus(goal.id, 'paused')} title="Pause">⏸</button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}

                    {completedGoals.length > 0 && (
                        <div className={styles.goalGroup}>
                            <h3 className={styles.goalGroupTitle}>Completed</h3>
                            {completedGoals.map((goal) => (
                                <Card key={goal.id} className={`${styles.goalCard} ${styles.completed}`}>
                                    <div className={styles.goalContent}>
                                        <h4>{goal.title}</h4>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}

                    {otherGoals.length > 0 && (
                        <div className={styles.goalGroup}>
                            <h3 className={styles.goalGroupTitle}>Paused / Abandoned</h3>
                            {otherGoals.map((goal) => (
                                <Card key={goal.id} className={`${styles.goalCard} ${styles.muted}`}>
                                    <div className={styles.goalContent}>
                                        <h4>{goal.title}</h4>
                                        <span className={styles.statusBadge}>{goal.status}</span>
                                    </div>
                                    <button
                                        className={styles.reactivateBtn}
                                        onClick={() => updateGoalStatus(goal.id, 'active')}
                                    >
                                        Reactivate
                                    </button>
                                </Card>
                            ))}
                        </div>
                    )}

                    {phase.goals.length === 0 && (
                        <p className={styles.noGoals}>No goals defined yet</p>
                    )}
                </section>

                <Modal isOpen={showGoalModal} onClose={() => setShowGoalModal(false)} title="Add Goal">
                    <form onSubmit={handleAddGoal} className={styles.form}>
                        <Input
                            label="Goal"
                            placeholder="What do you want to achieve?"
                            value={goalForm.title}
                            onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
                            required
                        />
                        <Textarea
                            label="Description (optional)"
                            placeholder="Any details..."
                            value={goalForm.description}
                            onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })}
                            rows={2}
                        />
                        <div className={styles.formActions}>
                            <Button variant="secondary" type="button" onClick={() => setShowGoalModal(false)}>Cancel</Button>
                            <Button type="submit" isLoading={isSaving}>Add Goal</Button>
                        </div>
                    </form>
                </Modal>

                <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Phase">
                    <div className={styles.deleteModal}>
                        <p>Are you sure you want to delete this life phase? This action cannot be undone.</p>
                        <div className={styles.deleteActions}>
                            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
                            <Button variant="danger" onClick={handleDelete}>Delete</Button>
                        </div>
                    </div>
                </Modal>
            </div>
        </AppLayout>
    );
}
