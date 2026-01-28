'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import { Button, Input, Textarea, Card } from '@/components/ui';
import { journalService, decisionService, phaseService } from '@/lib/supabase/database';
import { Decision, LifePhase } from '@/types';
import styles from './page.module.css';

type Mood = 'calm' | 'content' | 'uncertain' | 'anxious' | 'hopeful' | 'grateful';

const moods: { value: Mood; label: string; emoji: string }[] = [
    { value: 'calm', label: 'Calm', emoji: '😌' },
    { value: 'content', label: 'Content', emoji: '😊' },
    { value: 'uncertain', label: 'Uncertain', emoji: '🤔' },
    { value: 'anxious', label: 'Anxious', emoji: '😰' },
    { value: 'hopeful', label: 'Hopeful', emoji: '✨' },
    { value: 'grateful', label: 'Grateful', emoji: '🙏' },
];

export default function NewJournalPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const [decisions, setDecisions] = useState<Decision[]>([]);
    const [phases, setPhases] = useState<LifePhase[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        content: '',
        mood: '' as Mood | '',
        linkedDecisionId: '',
        lifePhaseId: '',
    });

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/auth');
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        const loadData = async () => {
            if (!user) return;
            try {
                const [decisionsData, phasesData] = await Promise.all([
                    decisionService.getAll(),
                    phaseService.getAll(),
                ]);
                setDecisions(decisionsData);
                setPhases(phasesData);
                const active = phasesData.find(p => p.isActive);
                if (active) {
                    setFormData(prev => ({ ...prev, lifePhaseId: active.id }));
                }
            } catch (err) {
                console.error('Error loading data:', err);
            }
        };

        if (user) {
            loadData();
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsSaving(true);
        setError('');

        try {
            await journalService.create({
                title: formData.title || undefined,
                content: formData.content,
                mood: formData.mood || undefined,
                lifePhaseId: formData.lifePhaseId || undefined,
            });
            router.push('/journal');
        } catch (err) {
            console.error('Error saving entry:', err);
            setError('Failed to save entry. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading || !user) {
        return <div className={styles.loading}><div className={styles.spinner} /></div>;
    }

    return (
        <AppLayout>
            <div className={styles.container}>
                <header className={styles.header}>
                    <button className={styles.backBtn} onClick={() => router.back()}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Back
                    </button>
                    <h1>New Journal Entry</h1>
                    <p>Write freely. This space is yours alone.</p>
                </header>

                <Card>
                    <form onSubmit={handleSubmit} className={styles.form}>
                        {error && <div className={styles.error}>{error}</div>}

                        <Input
                            label="Title (optional)"
                            placeholder="Give this entry a title..."
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />

                        <Textarea
                            label="Your thoughts"
                            placeholder="What's on your mind?"
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            rows={10}
                            required
                        />

                        <div className={styles.moodField}>
                            <label className={styles.label}>How are you feeling? (optional)</label>
                            <div className={styles.moodSelector}>
                                {moods.map((mood) => (
                                    <button
                                        key={mood.value}
                                        type="button"
                                        className={`${styles.moodBtn} ${formData.mood === mood.value ? styles.active : ''}`}
                                        onClick={() => setFormData({ ...formData, mood: formData.mood === mood.value ? '' : mood.value })}
                                    >
                                        <span className={styles.moodEmoji}>{mood.emoji}</span>
                                        <span className={styles.moodLabel}>{mood.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {decisions.length > 0 && (
                            <div className={styles.field}>
                                <label className={styles.label}>Link to a decision (optional)</label>
                                <select
                                    className={styles.select}
                                    value={formData.linkedDecisionId}
                                    onChange={(e) => setFormData({ ...formData, linkedDecisionId: e.target.value })}
                                >
                                    <option value="">No decision linked</option>
                                    {decisions.map((decision) => (
                                        <option key={decision.id} value={decision.id}>
                                            {decision.title}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {phases.length > 0 && (
                            <div className={styles.field}>
                                <label className={styles.label}>Life Phase (optional)</label>
                                <select
                                    className={styles.select}
                                    value={formData.lifePhaseId}
                                    onChange={(e) => setFormData({ ...formData, lifePhaseId: e.target.value })}
                                >
                                    <option value="">No phase selected</option>
                                    {phases.map((phase) => (
                                        <option key={phase.id} value={phase.id}>
                                            {phase.name} {phase.isActive && '(Active)'}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className={styles.actions}>
                            <Button variant="secondary" type="button" onClick={() => router.back()}>
                                Cancel
                            </Button>
                            <Button type="submit" isLoading={isSaving}>
                                Save Entry
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </AppLayout>
    );
}
