export interface User {
    id: string;
    email: string | null;
    isAnonymous: boolean;
    createdAt: Date;
    updatedAt: Date;
    preferences: UserPreferences;
}

export interface UserPreferences {
    theme: 'light' | 'dark' | 'system';
    reminderEnabled: boolean;
    reminderTime?: string;
}

export interface Decision {
    id: string;
    userId: string;
    title: string;
    description: string;
    confidenceLevel: 1 | 2 | 3 | 4 | 5;
    category?: string;
    tags: string[];
    lifePhaseId?: string;
    reflections: Reflection[];
    linkedJournalIds: string[];
    createdAt: Date;
    updatedAt: Date;
}

export interface Reflection {
    id: string;
    content: string;
    createdAt: Date;
}

export interface JournalEntry {
    id: string;
    userId: string;
    title?: string;
    content: string;
    mood?: 'calm' | 'content' | 'uncertain' | 'anxious' | 'hopeful' | 'grateful';
    lifePhaseId?: string;
    linkedDecisionIds: string[];
    createdAt: Date;
    updatedAt: Date;
}

export interface LifePhase {
    id: string;
    userId: string;
    name: string;
    description?: string;
    startDate: Date;
    endDate?: Date;
    isActive: boolean;
    values: string[];
    goals: Goal[];
    createdAt: Date;
    updatedAt: Date;
}

export interface Goal {
    id: string;
    title: string;
    description?: string;
    status: 'active' | 'completed' | 'paused' | 'abandoned';
    createdAt: Date;
    updatedAt: Date;
}

export interface PrivateProfile {
    id: string;
    userId: string;
    values: string[];
    joys: string[];
    rememberedAs: string;
    shareCode?: string;
    shareExpiry?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface ExportData {
    user?: Partial<User>;
    decisions: Decision[];
    journalEntries: JournalEntry[];
    lifePhases: LifePhase[];
    privateProfile?: PrivateProfile;
    exportedAt: Date;
}
