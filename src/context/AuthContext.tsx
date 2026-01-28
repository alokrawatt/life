'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

interface UserProfile {
    id: string;
    email: string | null;
    username: string | null;
    isAnonymous: boolean;
    preferences: {
        theme: 'light' | 'dark' | 'system';
        reminderEnabled: boolean;
    };
    createdAt: Date;
    updatedAt: Date;
}

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    session: Session | null;
    isLoading: boolean;
    signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
    signUpWithEmail: (email: string, password: string, inviteCode: string) => Promise<{ error: Error | null }>;
    signInWithMagicLink: (email: string, inviteCode?: string) => Promise<{ error: Error | null }>;
    signInWithGoogle: (inviteCode: string) => Promise<{ error: Error | null }>;
    signInAnonymously: () => Promise<{ error: Error | null }>;
    validateInviteCode: (code: string) => Promise<{ valid: boolean; error?: string }>;
    signOut: () => Promise<void>;
    updatePreferences: (preferences: Partial<UserProfile['preferences']>) => Promise<void>;
    updateUsername: (username: string) => Promise<{ success: boolean; error?: string }>;
    checkUsernameAvailable: (username: string) => Promise<boolean>;
    deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const supabase = createClient();

    // Fetch user profile from database
    const fetchProfile = async (userId: string) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle(); // Use maybeSingle to handle case where profile doesn't exist yet

        // Only log actual errors, not "no rows" scenarios
        if (error) {
            // PGRST116 means no rows found - this is expected for new users
            if (error.code !== 'PGRST116') {
                console.error('Error fetching profile:', error.message || error);
            }
            return null;
        }

        // Profile doesn't exist yet (new user)
        if (!data) {
            return null;
        }

        return {
            id: data.id,
            email: data.email,
            username: data.username || null,
            isAnonymous: data.is_anonymous || false,
            preferences: data.preferences || { theme: 'system', reminderEnabled: false },
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at),
        } as UserProfile;
    };

    useEffect(() => {
        // Get initial session
        const initializeAuth = async () => {
            try {
                const { data: { session: initialSession } } = await supabase.auth.getSession();

                setSession(initialSession);
                setUser(initialSession?.user ?? null);

                if (initialSession?.user) {
                    const userProfile = await fetchProfile(initialSession.user.id);
                    setProfile(userProfile);
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
            } finally {
                setIsLoading(false);
            }
        };

        // Set a timeout to prevent infinite loading
        const timeout = setTimeout(() => {
            setIsLoading(false);
        }, 5000);

        initializeAuth().finally(() => clearTimeout(timeout));

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, currentSession) => {
                setSession(currentSession);
                setUser(currentSession?.user ?? null);

                if (currentSession?.user) {
                    const userProfile = await fetchProfile(currentSession.user.id);
                    setProfile(userProfile);
                } else {
                    setProfile(null);
                }

                setIsLoading(false);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const signInWithEmail = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        return { error: error as Error | null };
    };

    const validateInviteCode = async (code: string): Promise<{ valid: boolean; error?: string }> => {
        const { data, error } = await supabase
            .from('invite_codes')
            .select('id, code, is_active, expires_at, max_uses, current_uses')
            .eq('code', code.toUpperCase().trim())
            .eq('is_active', true)
            .single();

        if (error || !data) {
            return { valid: false, error: 'Invalid invite code' };
        }

        if (data.expires_at && new Date(data.expires_at) < new Date()) {
            return { valid: false, error: 'Invite code has expired' };
        }

        if (data.max_uses && data.current_uses >= data.max_uses) {
            return { valid: false, error: 'Invite code has reached maximum uses' };
        }

        return { valid: true };
    };

    const signUpWithEmail = async (email: string, password: string, inviteCode: string) => {
        // First validate the invite code
        const validation = await validateInviteCode(inviteCode);
        if (!validation.valid) {
            return { error: new Error(validation.error || 'Invalid invite code') };
        }

        // Sign up the user
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            return { error: error as Error };
        }

        // Mark the invite code as used
        if (data.user) {
            await supabase.rpc('use_invite_code', {
                invite_code: inviteCode.toUpperCase().trim(),
                user_id: data.user.id,
            });
        }

        return { error: null };
    };

    const signInWithMagicLink = async (email: string, inviteCode?: string) => {
        // If invite code is provided, this is a signup - validate it
        if (inviteCode) {
            const validation = await validateInviteCode(inviteCode);
            if (!validation.valid) {
                return { error: new Error(validation.error || 'Invalid invite code') };
            }
        }

        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback${inviteCode ? `?invite=${inviteCode}` : ''}`,
            },
        });
        return { error: error as Error | null };
    };

    const signInWithGoogle = async (inviteCode: string) => {
        // Validate the invite code first
        const validation = await validateInviteCode(inviteCode);
        if (!validation.valid) {
            return { error: new Error(validation.error || 'Invalid invite code') };
        }

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback?invite=${inviteCode}`,
            },
        });
        return { error: error as Error | null };
    };

    const signInAnonymously = async () => {
        const { error } = await supabase.auth.signInAnonymously();
        return { error: error as Error | null };
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        setSession(null);
    };

    const updatePreferences = async (preferences: Partial<UserProfile['preferences']>) => {
        if (!user) return;

        const { error } = await supabase
            .from('profiles')
            .update({
                preferences: { ...profile?.preferences, ...preferences },
            })
            .eq('id', user.id);

        if (!error && profile) {
            setProfile({
                ...profile,
                preferences: { ...profile.preferences, ...preferences },
                updatedAt: new Date(),
            });
        }
    };

    const checkUsernameAvailable = async (username: string): Promise<boolean> => {
        const trimmedUsername = username.trim().toLowerCase();

        // Check minimum length
        if (trimmedUsername.length < 3) return false;

        // Check if username only contains allowed characters (letters, numbers, underscores)
        if (!/^[a-z0-9_]+$/.test(trimmedUsername)) return false;

        // If it's the same as current username, it's "available" for them
        if (profile?.username?.toLowerCase() === trimmedUsername) {
            return true;
        }

        try {
            // Use a simple count query which is faster
            const { count, error } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('username', trimmedUsername);

            if (error) {
                console.error('Error checking username:', error.message);
                return false;
            }

            // If count is 0, username is available
            return count === 0;
        } catch (err) {
            console.error('Username check failed:', err);
            return false;
        }
    };

    const updateUsername = async (username: string): Promise<{ success: boolean; error?: string }> => {
        if (!user) return { success: false, error: 'Not authenticated' };

        const trimmedUsername = username.trim();

        // Validate username format
        if (trimmedUsername.length < 3) {
            return { success: false, error: 'Username must be at least 3 characters' };
        }

        if (trimmedUsername.length > 30) {
            return { success: false, error: 'Username must be 30 characters or less' };
        }

        if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
            return { success: false, error: 'Username can only contain letters, numbers, and underscores' };
        }

        // Check availability
        const isAvailable = await checkUsernameAvailable(trimmedUsername);
        if (!isAvailable) {
            return { success: false, error: 'Username is already taken' };
        }

        // Update in database
        const { error } = await supabase
            .from('profiles')
            .update({ username: trimmedUsername })
            .eq('id', user.id);

        if (error) {
            console.error('Error updating username:', error);
            return { success: false, error: 'Failed to update username' };
        }

        // Update local state
        if (profile) {
            setProfile({
                ...profile,
                username: trimmedUsername,
                updatedAt: new Date(),
            });
        }

        return { success: true };
    };

    const deleteAccount = async () => {
        if (!user) return;

        // Delete all user data (cascading deletes will handle related data)
        await supabase.from('profiles').delete().eq('id', user.id);

        // Sign out
        await signOut();
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                profile,
                session,
                isLoading,
                signInWithEmail,
                signUpWithEmail,
                signInWithMagicLink,
                signInWithGoogle,
                signInAnonymously,
                validateInviteCode,
                signOut,
                updatePreferences,
                updateUsername,
                checkUsernameAvailable,
                deleteAccount,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
