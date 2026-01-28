'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import { Button, Input, Textarea, Card } from '@/components/ui';
import { decisionService, phaseService } from '@/lib/supabase/database';
import { LifePhase } from '@/types';
import styles from './page.module.css';

export default function NewDecisionPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const [phases, setPhases] = useState<LifePhase[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        confidenceLevel: 3 as 1 | 2 | 3 | 4 | 5,
        category: '',
        tags: '',
        lifePhaseId: '',
    });

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/auth');
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        const loadPhases = async () => {
            if (!user) return;
            try {
                const allPhases = await phaseService.getAll();
                setPhases(allPhases);
                const active = allPhases.find(p => p.isActive);
                if (active) {
                    setFormData(prev => ({ ...prev, lifePhaseId: active.id }));
                }
            } catch (err) {
                console.error('Error loading phases:', err);
            }
        };

        if (user) {
            loadPhases();
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsSaving(true);
        setError('');

        try {
            await decisionService.create({
                title: formData.title,
                description: formData.description,
                confidenceLevel: formData.confidenceLevel,
                category: formData.category || undefined,
                tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
                lifePhaseId: formData.lifePhaseId || undefined,
            });
            router.push('/decisions');
        } catch (err) {
            console.error('Error saving decision:', err);
            setError('Failed to save decision. Please try again.');
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
                    <h1>Log a Decision</h1>
                    <p>Record a meaningful choice and its context</p>
                </header>

                <Card>
                    <form onSubmit={handleSubmit} className={styles.form}>
                        {error && <div className={styles.error}>{error}</div>}

                        <Input
                            label="Decision Title"
                            placeholder="What decision did you make?"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                        />

                        <Textarea
                            label="Context & Description"
                            placeholder="What was the situation? Why did you make this choice?"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={5}
                            required
                        />

                        <div className={styles.confidenceField}>
                            <label className={styles.label}>Confidence Level</label>
                            <p className={styles.hint}>How confident do you feel about this decision?</p>
                            <div className={styles.confidenceSelector}>
                                {[1, 2, 3, 4, 5].map((level) => (
                                    <button
                                        key={level}
                                        type="button"
                                        className={`${styles.confidenceBtn} ${formData.confidenceLevel >= level ? styles.active : ''}`}
                                        onClick={() => setFormData({ ...formData, confidenceLevel: level as 1 | 2 | 3 | 4 | 5 })}
                                    >
                                        <span className={styles.dot} />
                                        <span className={styles.levelLabel}>
                                            {level === 1 && 'Uncertain'}
                                            {level === 2 && 'Hesitant'}
                                            {level === 3 && 'Neutral'}
                                            {level === 4 && 'Confident'}
                                            {level === 5 && 'Certain'}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className={styles.row}>
                            <Input
                                label="Category (optional)"
                                placeholder="e.g., Career, Relationships"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            />
                            <Input
                                label="Tags (optional)"
                                placeholder="Comma-separated"
                                value={formData.tags}
                                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                hint="e.g., important, work, family"
                            />
                        </div>

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
                                Save Decision
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </AppLayout>
    );
}
