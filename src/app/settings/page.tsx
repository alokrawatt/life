'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import AppLayout from '@/components/layout/AppLayout';
import { Card, Button, Modal, Input } from '@/components/ui';
import { exportAllData } from '@/lib/supabase/database';
import styles from './page.module.css';

export default function SettingsPage() {
    const { user, profile, isLoading, signOut, deleteAccount, updateUsername, checkUsernameAvailable } = useAuth();
    const { theme, setTheme } = useTheme();
    const router = useRouter();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [exportStatus, setExportStatus] = useState<'idle' | 'exporting' | 'success' | 'error'>('idle');

    // Username state
    const [username, setUsername] = useState('');
    const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'saving' | 'saved' | 'error'>('idle');
    const [usernameError, setUsernameError] = useState('');

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/auth');
        }
    }, [user, isLoading, router]);

    // Initialize username from profile
    useEffect(() => {
        if (profile?.username) {
            setUsername(profile.username);
        }
    }, [profile?.username]);

    // Debounced username availability check
    const checkAvailability = useCallback(async (value: string) => {
        if (value.length < 3) {
            setUsernameStatus('invalid');
            setUsernameError('Username must be at least 3 characters');
            return;
        }

        if (value.length > 30) {
            setUsernameStatus('invalid');
            setUsernameError('Username must be 30 characters or less');
            return;
        }

        if (!/^[a-zA-Z0-9_]+$/.test(value)) {
            setUsernameStatus('invalid');
            setUsernameError('Only letters, numbers, and underscores allowed');
            return;
        }

        // If it's the same as current username, no need to check
        if (profile?.username?.toLowerCase() === value.toLowerCase()) {
            setUsernameStatus('idle');
            setUsernameError('');
            return;
        }

        setUsernameStatus('checking');
        setUsernameError('');

        const isAvailable = await checkUsernameAvailable(value);
        setUsernameStatus(isAvailable ? 'available' : 'taken');
        if (!isAvailable) {
            setUsernameError('Username is already taken');
        }
    }, [profile?.username, checkUsernameAvailable]);

    // Debounce the check
    useEffect(() => {
        if (!username.trim()) {
            setUsernameStatus('idle');
            setUsernameError('');
            return;
        }

        // Show checking status immediately for better UX
        if (profile?.username?.toLowerCase() !== username.toLowerCase()) {
            setUsernameStatus('checking');
        }

        const timer = setTimeout(() => {
            checkAvailability(username);
        }, 300); // Reduced from 500ms to 300ms

        return () => clearTimeout(timer);
    }, [username, checkAvailability, profile?.username]);

    const handleSaveUsername = async () => {
        if (usernameStatus !== 'available' && username !== profile?.username) {
            return;
        }

        setUsernameStatus('saving');
        const result = await updateUsername(username);

        if (result.success) {
            setUsernameStatus('saved');
            setTimeout(() => setUsernameStatus('idle'), 2000);
        } else {
            setUsernameStatus('error');
            setUsernameError(result.error || 'Failed to save username');
        }
    };

    const handleExport = async () => {
        setExportStatus('exporting');
        try {
            const data = await exportAllData();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `life-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            setExportStatus('success');
            setTimeout(() => setExportStatus('idle'), 3000);
        } catch (error) {
            console.error('Export error:', error);
            setExportStatus('error');
            setTimeout(() => setExportStatus('idle'), 3000);
        }
    };

    const handleSignOut = async () => {
        await signOut();
        router.push('/');
    };

    const handleDeleteAccount = async () => {
        await deleteAccount();
        router.push('/auth');
    };

    if (isLoading || !user) {
        return <div className={styles.loading}><div className={styles.spinner} /></div>;
    }

    const canSaveUsername = (usernameStatus === 'available' ||
        (username === profile?.username && usernameStatus === 'idle')) &&
        username !== profile?.username;

    return (
        <AppLayout>
            <div className={styles.container}>
                <header className={styles.header}>
                    <h1>Settings</h1>
                    <p>Manage your account and preferences</p>
                </header>

                <section className={styles.section}>
                    <h2>Profile</h2>
                    <Card className={styles.card}>
                        <div className={styles.setting}>
                            <div className={styles.settingInfo}>
                                <h3>Username</h3>
                                <p>Reserve your unique username for future features</p>
                            </div>
                        </div>
                        <div className={styles.usernameSection}>
                            <div className={styles.usernameInput}>
                                <span className={styles.usernamePrefix}>@</span>
                                <Input
                                    placeholder="Choose a username"
                                    value={username}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
                                    }
                                    maxLength={30}
                                />
                                {usernameStatus === 'checking' && (
                                    <span className={styles.usernameChecking}>Checking...</span>
                                )}
                                {usernameStatus === 'available' && (
                                    <span className={styles.usernameAvailable}>✓ Available</span>
                                )}
                                {usernameStatus === 'saved' && (
                                    <span className={styles.usernameSaved}>✓ Saved!</span>
                                )}
                            </div>
                            {usernameError && (
                                <p className={styles.usernameError}>{usernameError}</p>
                            )}
                            <div className={styles.usernameActions}>
                                <Button
                                    size="sm"
                                    onClick={handleSaveUsername}
                                    isLoading={usernameStatus === 'saving'}
                                    disabled={!canSaveUsername && usernameStatus !== 'available'}
                                >
                                    {usernameStatus === 'saved' ? 'Saved!' : 'Save Username'}
                                </Button>
                            </div>
                        </div>
                    </Card>
                </section>

                <section className={styles.section}>
                    <h2>Account</h2>
                    <Card className={styles.card}>
                        <div className={styles.setting}>
                            <div className={styles.settingInfo}>
                                <h3>Email</h3>
                                <p>{user.email || (user.is_anonymous ? 'Anonymous account' : 'No email')}</p>
                            </div>
                        </div>
                        <div className={styles.setting}>
                            <div className={styles.settingInfo}>
                                <h3>Account Type</h3>
                                <p>{user.is_anonymous ? 'Anonymous' : 'Google account'}</p>
                            </div>
                        </div>
                        <div className={styles.setting}>
                            <div className={styles.settingInfo}>
                                <h3>Member Since</h3>
                                <p>{user.created_at && new Intl.DateTimeFormat('en-US', {
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric'
                                }).format(new Date(user.created_at))}</p>
                            </div>
                        </div>
                        <div className={styles.setting}>
                            <div className={styles.settingInfo}>
                                <h3>Sign Out</h3>
                                <p>Sign out of your account</p>
                            </div>
                            <Button variant="secondary" onClick={handleSignOut}>
                                Sign Out
                            </Button>
                        </div>
                    </Card>
                </section>

                <section className={styles.section}>
                    <h2>Appearance</h2>
                    <Card className={styles.card}>
                        <div className={styles.setting}>
                            <div className={styles.settingInfo}>
                                <h3>Theme</h3>
                                <p>Choose your preferred color scheme</p>
                            </div>
                            <div className={styles.themeToggle}>
                                <button
                                    className={`${styles.themeBtn} ${theme === 'light' ? styles.active : ''}`}
                                    onClick={() => setTheme('light')}
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <circle cx="12" cy="12" r="5" />
                                        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                                    </svg>
                                    Light
                                </button>
                                <button
                                    className={`${styles.themeBtn} ${theme === 'dark' ? styles.active : ''}`}
                                    onClick={() => setTheme('dark')}
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                                    </svg>
                                    Dark
                                </button>
                                <button
                                    className={`${styles.themeBtn} ${theme === 'system' ? styles.active : ''}`}
                                    onClick={() => setTheme('system')}
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                                        <path d="M8 21h8M12 17v4" />
                                    </svg>
                                    System
                                </button>
                            </div>
                        </div>
                    </Card>
                </section>

                <section className={styles.section}>
                    <h2>Data & Privacy</h2>
                    <Card className={styles.card}>
                        <div className={styles.setting}>
                            <div className={styles.settingInfo}>
                                <h3>Export Your Data</h3>
                                <p>Download all your data as a JSON file</p>
                            </div>
                            <Button
                                variant="secondary"
                                onClick={handleExport}
                                isLoading={exportStatus === 'exporting'}
                            >
                                {exportStatus === 'success' ? '✓ Downloaded' :
                                    exportStatus === 'error' ? 'Error - Try Again' :
                                        'Export Data'}
                            </Button>
                        </div>
                        <div className={styles.privacyNote}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0110 0v4" />
                            </svg>
                            <div>
                                <strong>Your data is secure</strong>
                                <p>Your data is stored securely in the cloud with row-level security. Only you can access your data.</p>
                            </div>
                        </div>
                    </Card>
                </section>

                <section className={styles.section}>
                    <h2>Danger Zone</h2>
                    <Card className={`${styles.card} ${styles.dangerCard}`}>
                        <div className={styles.setting}>
                            <div className={styles.settingInfo}>
                                <h3>Delete Account</h3>
                                <p>Permanently delete your account and all data. This cannot be undone.</p>
                            </div>
                            <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
                                Delete Account
                            </Button>
                        </div>
                    </Card>
                </section>

                <footer className={styles.footer}>
                    <p>LIFE — A calm space for meaningful decisions</p>
                    <p>Version 1.0.0 • Privacy-first by design</p>
                </footer>

                <Modal
                    isOpen={showDeleteModal}
                    onClose={() => setShowDeleteModal(false)}
                    title="Delete Account"
                >
                    <div className={styles.deleteModal}>
                        <div className={styles.deleteWarning}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" />
                            </svg>
                            <p>This will permanently delete:</p>
                        </div>
                        <ul className={styles.deleteList}>
                            <li>All your decisions and reflections</li>
                            <li>All journal entries</li>
                            <li>All life phases and goals</li>
                            <li>Your account profile</li>
                        </ul>
                        <p className={styles.deleteNote}>
                            This action cannot be undone. Consider exporting your data first.
                        </p>
                        <div className={styles.deleteActions}>
                            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                                Cancel
                            </Button>
                            <Button variant="danger" onClick={handleDeleteAccount}>
                                Delete Everything
                            </Button>
                        </div>
                    </div>
                </Modal>
            </div>
        </AppLayout>
    );
}
