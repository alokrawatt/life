'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button, Input } from '@/components/ui';
import styles from './page.module.css';

type AuthMode = 'signup' | 'signin';

function AuthContent() {
    const [authMode, setAuthMode] = useState<AuthMode>('signup');
    const [inviteCode, setInviteCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [inviteValidated, setInviteValidated] = useState(false);

    const { user, isLoading: authLoading, validateInviteCode, signInWithGoogle, signInExistingWithGoogle } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const errorParam = searchParams.get('error');
        if (errorParam) {
            setError(errorParam);
        }
        const inviteParam = searchParams.get('invite');
        if (inviteParam) {
            setInviteCode(inviteParam);
        }
        // Check if user wants to sign in
        const mode = searchParams.get('mode');
        if (mode === 'signin') {
            setAuthMode('signin');
        }
    }, [searchParams]);

    useEffect(() => {
        if (!authLoading && user) {
            router.push('/dashboard');
        }
    }, [user, authLoading, router]);

    const handleValidateInvite = async () => {
        if (!inviteCode.trim()) {
            setError('Please enter an invite code');
            return;
        }

        setIsLoading(true);
        setError('');
        try {
            const result = await validateInviteCode(inviteCode);
            if (result.valid) {
                setInviteValidated(true);
                setMessage('Invite code verified! Click below to continue.');
            } else {
                setError(result.error || 'Invalid invite code');
            }
        } catch {
            setError('Failed to validate invite code');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignUp = async () => {
        setIsLoading(true);
        setError('');
        try {
            const result = await signInWithGoogle(inviteCode);
            if (result.error) {
                setError(result.error.message || 'Failed to sign in with Google');
            }
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        setError('');
        try {
            const result = await signInExistingWithGoogle();
            if (result.error) {
                setError(result.error.message || 'Failed to sign in with Google');
            }
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner} />
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <div className={styles.header}>
                    <h1 className={styles.logo}>LIFE</h1>
                    <p className={styles.tagline}>
                        A calm space for meaningful decisions and reflection
                    </p>
                </div>

                <div className={styles.card}>
                    {authMode === 'signup' ? (
                        // SIGN UP FLOW
                        <>
                            {!inviteValidated ? (
                                // Step 1: Invite Code Validation
                                <div className={styles.form}>
                                    <div className={styles.inviteInfo}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        <div>
                                            <strong>Invite-Only Access</strong>
                                            <p>LIFE is currently in private beta. Enter your invite code to join.</p>
                                        </div>
                                    </div>

                                    {error && (
                                        <div className={styles.errorMessage}>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="10" />
                                                <line x1="15" y1="9" x2="9" y2="15" />
                                                <line x1="9" y1="9" x2="15" y2="15" />
                                            </svg>
                                            {error}
                                        </div>
                                    )}

                                    <Input
                                        placeholder="Enter your invite code"
                                        value={inviteCode}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInviteCode(e.target.value.toUpperCase())}
                                        icon={
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        }
                                    />

                                    <Button fullWidth isLoading={isLoading} onClick={handleValidateInvite}>
                                        Verify Invite Code
                                    </Button>

                                    <p className={styles.hint}>
                                        Don&apos;t have an invite? Ask a friend who uses LIFE, or <a href="mailto:hello@life.app">request access</a>.
                                    </p>

                                    <div className={styles.divider}>
                                        <span>or</span>
                                    </div>

                                    <button
                                        className={styles.switchMode}
                                        onClick={() => {
                                            setAuthMode('signin');
                                            setError('');
                                        }}
                                    >
                                        Already have an account? <strong>Sign in</strong>
                                    </button>
                                </div>
                            ) : (
                                // Step 2: Continue with Google (after invite code verification)
                                <div className={styles.form}>
                                    <div className={styles.inviteSuccess}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M22 4L12 14.01l-3-3" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        <span>Invite code verified: {inviteCode}</span>
                                    </div>

                                    {message && (
                                        <div className={styles.successMessage}>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M22 4L12 14.01l-3-3" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                            {message}
                                        </div>
                                    )}

                                    {error && (
                                        <div className={styles.errorMessage}>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="10" />
                                                <line x1="15" y1="9" x2="9" y2="15" />
                                                <line x1="9" y1="9" x2="15" y2="15" />
                                            </svg>
                                            {error}
                                        </div>
                                    )}

                                    <Button
                                        fullWidth
                                        isLoading={isLoading}
                                        onClick={handleGoogleSignUp}
                                        className={styles.googleButton}
                                    >
                                        <svg className={styles.googleIcon} viewBox="0 0 24 24">
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                        </svg>
                                        Continue with Google
                                    </Button>

                                    <button
                                        className={styles.backButton}
                                        onClick={() => {
                                            setInviteValidated(false);
                                            setMessage('');
                                            setError('');
                                        }}
                                    >
                                        ← Use a different invite code
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        // SIGN IN FLOW (for existing users)
                        <div className={styles.form}>
                            <div className={styles.signInHeader}>
                                <h2>Welcome back</h2>
                                <p>Sign in to your LIFE account</p>
                            </div>

                            {error && (
                                <div className={styles.errorMessage}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="15" y1="9" x2="9" y2="15" />
                                        <line x1="9" y1="9" x2="15" y2="15" />
                                    </svg>
                                    {error}
                                </div>
                            )}

                            <Button
                                fullWidth
                                isLoading={isLoading}
                                onClick={handleGoogleSignIn}
                                className={styles.googleButton}
                            >
                                <svg className={styles.googleIcon} viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                Sign in with Google
                            </Button>

                            <div className={styles.divider}>
                                <span>or</span>
                            </div>

                            <button
                                className={styles.switchMode}
                                onClick={() => {
                                    setAuthMode('signup');
                                    setError('');
                                }}
                            >
                                New to LIFE? <strong>Sign up with invite code</strong>
                            </button>
                        </div>
                    )}
                </div>

                <div className={styles.features}>
                    <div className={styles.feature}>
                        <div className={styles.featureIcon}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0110 0v4" />
                            </svg>
                        </div>
                        <div className={styles.featureText}>
                            <strong>Secure & Private</strong>
                            <span>Your data is encrypted and protected</span>
                        </div>
                    </div>

                    <div className={styles.feature}>
                        <div className={styles.featureIcon}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5" />
                                <path d="M2 12l10 5 10-5" />
                            </svg>
                        </div>
                        <div className={styles.featureText}>
                            <strong>Sync Anywhere</strong>
                            <span>Access your data on any device</span>
                        </div>
                    </div>

                    <div className={styles.feature}>
                        <div className={styles.featureIcon}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
                            </svg>
                        </div>
                        <div className={styles.featureText}>
                            <strong>Private Journal</strong>
                            <span>Write freely without judgment</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function AuthPage() {
    return (
        <Suspense fallback={<div className={styles.loading}><div className={styles.spinner} /></div>}>
            <AuthContent />
        </Suspense>
    );
}
