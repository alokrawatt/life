'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import { Card, Button, Modal, Input, Textarea } from '@/components/ui';
import { phaseService } from '@/lib/supabase/database';
import { LifePhase } from '@/types';
import styles from './page.module.css';

export default function PhasesPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const [phases, setPhases] = useState<LifePhase[]>([]);
    const [dataLoading, setDataLoading] = useState(true);
    const [showNewModal, setShowNewModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        values: '',
        isActive: false,
    });

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/auth');
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        if (user) {
            loadPhases();
        }
    }, [user]);

    const loadPhases = async () => {
        try {
            const data = await phaseService.getAll();
            setPhases(data);
        } catch (error) {
            console.error('Error loading phases:', error);
        } finally {
            setDataLoading(false);
        }
    };

    const handleCreatePhase = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !formData.name.trim()) return;

        setIsSaving(true);
        try {
            await phaseService.create({
                name: formData.name,
                description: formData.description || undefined,
                isActive: formData.isActive,
                values: formData.values.split(',').map(v => v.trim()).filter(Boolean),
            });
            await loadPhases();
            setShowNewModal(false);
            setFormData({ name: '', description: '', values: '', isActive: false });
        } catch (error) {
            console.error('Error creating phase:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            year: 'numeric',
        }).format(date);
    };

    if (isLoading || !user || dataLoading) {
        return <div className={styles.loading}><div className={styles.spinner} /></div>;
    }

    const activePhase = phases.find(p => p.isActive);
    const pastPhases = phases.filter(p => !p.isActive);

    return (
        <AppLayout>
            <div className={styles.container}>
                <header className={styles.header}>
                    <div>
                        <h1>Life Phases</h1>
                        <p>Define the chapters of your life journey</p>
                    </div>
                    <Button onClick={() => setShowNewModal(true)} icon={
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                        </svg>
                    }>
                        New Phase
                    </Button>
                </header>

                {activePhase && (
                    <section className={styles.activeSection}>
                        <h2 className={styles.sectionTitle}>Current Phase</h2>
                        <Link href={`/phases/${activePhase.id}`}>
                            <Card hoverable className={styles.activeCard}>
                                <div className={styles.activeBadge}>Active</div>
                                <h3 className={styles.phaseName}>{activePhase.name}</h3>
                                {activePhase.description && (
                                    <p className={styles.phaseDesc}>{activePhase.description}</p>
                                )}
                                <div className={styles.phaseMeta}>
                                    <span>Started {formatDate(activePhase.startDate)}</span>
                                    <span>•</span>
                                    <span>{activePhase.goals.filter(g => g.status === 'active').length} active goals</span>
                                </div>
                                {activePhase.values.length > 0 && (
                                    <div className={styles.values}>
                                        {activePhase.values.map((value, i) => (
                                            <span key={i} className={styles.value}>{value}</span>
                                        ))}
                                    </div>
                                )}
                            </Card>
                        </Link>
                    </section>
                )}

                {pastPhases.length > 0 && (
                    <section className={styles.pastSection}>
                        <h2 className={styles.sectionTitle}>Past Phases</h2>
                        <div className={styles.phasesList}>
                            {pastPhases.map((phase) => (
                                <Link key={phase.id} href={`/phases/${phase.id}`}>
                                    <Card hoverable className={styles.phaseCard}>
                                        <h4 className={styles.pastPhaseName}>{phase.name}</h4>
                                        <span className={styles.phaseDate}>
                                            {formatDate(phase.startDate)}
                                            {phase.endDate && ` - ${formatDate(phase.endDate)}`}
                                        </span>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {phases.length === 0 && (
                    <Card className={styles.empty}>
                        <div className={styles.emptyIcon}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 6v6l4 2" />
                            </svg>
                        </div>
                        <h3>Define your life phases</h3>
                        <p>Organize your journey into meaningful chapters with goals and values</p>
                        <Button onClick={() => setShowNewModal(true)}>Create Your First Phase</Button>
                    </Card>
                )}

                <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} title="New Life Phase">
                    <form onSubmit={handleCreatePhase} className={styles.form}>
                        <Input
                            label="Phase Name"
                            placeholder="e.g., Building a Startup, Early Career"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                        <Textarea
                            label="Description (optional)"
                            placeholder="What defines this phase of your life?"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                        />
                        <Input
                            label="Values (optional)"
                            placeholder="Comma-separated, e.g., Growth, Balance, Creativity"
                            value={formData.values}
                            onChange={(e) => setFormData({ ...formData, values: e.target.value })}
                        />
                        <label className={styles.checkbox}>
                            <input
                                type="checkbox"
                                checked={formData.isActive}
                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                            />
                            <span>Set as current active phase</span>
                        </label>
                        <div className={styles.formActions}>
                            <Button variant="secondary" type="button" onClick={() => setShowNewModal(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" isLoading={isSaving}>Create Phase</Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </AppLayout>
    );
}
