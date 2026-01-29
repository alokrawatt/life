import { createClient } from '@/lib/supabase/client';
import { Decision, JournalEntry, LifePhase, Goal, PrivateProfile } from '@/types';

const supabase = createClient();

// ============================================
// DECISIONS
// ============================================

export const decisionService = {
    async getAll(): Promise<Decision[]> {
        const { data, error } = await supabase
            .from('decisions')
            .select(`
        *,
        reflections (*)
      `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (data || []).map((d: any) => ({
            id: d.id,
            userId: d.user_id,
            title: d.title,
            description: d.description || '',
            confidenceLevel: d.confidence_level as 1 | 2 | 3 | 4 | 5,
            category: d.category,
            tags: d.tags || [],
            lifePhaseId: d.life_phase_id,
            createdAt: new Date(d.created_at),
            updatedAt: new Date(d.updated_at),
            reflections: (d.reflections || []).map((r: { id: string; content: string; created_at: string }) => ({
                id: r.id,
                content: r.content,
                createdAt: new Date(r.created_at),
            })),
            linkedJournalIds: [],
        }));
    },

    async get(id: string): Promise<Decision | null> {
        const { data, error } = await supabase
            .from('decisions')
            .select(`
        *,
        reflections (*)
      `)
            .eq('id', id)
            .single();

        if (error) return null;

        return {
            id: data.id,
            userId: data.user_id,
            title: data.title,
            description: data.description || '',
            confidenceLevel: data.confidence_level as 1 | 2 | 3 | 4 | 5,
            category: data.category,
            tags: data.tags || [],
            lifePhaseId: data.life_phase_id,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at),
            reflections: (data.reflections || []).map((r: { id: string; content: string; created_at: string }) => ({
                id: r.id,
                content: r.content,
                createdAt: new Date(r.created_at),
            })),
            linkedJournalIds: [],
        };
    },

    async create(decision: {
        title: string;
        description: string;
        confidenceLevel: number;
        category?: string;
        tags?: string[];
        lifePhaseId?: string;
    }): Promise<Decision> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('decisions')
            .insert({
                user_id: user.id,
                title: decision.title,
                description: decision.description,
                confidence_level: decision.confidenceLevel,
                category: decision.category,
                tags: decision.tags || [],
                life_phase_id: decision.lifePhaseId,
            })
            .select()
            .single();

        if (error) throw error;

        return {
            id: data.id,
            userId: data.user_id,
            title: data.title,
            description: data.description || '',
            confidenceLevel: data.confidence_level as 1 | 2 | 3 | 4 | 5,
            category: data.category,
            tags: data.tags || [],
            lifePhaseId: data.life_phase_id,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at),
            reflections: [],
            linkedJournalIds: [],
        };
    },

    async update(id: string, updates: Partial<Decision>): Promise<Decision | null> {
        const { data, error } = await supabase
            .from('decisions')
            .update({
                title: updates.title,
                description: updates.description,
                confidence_level: updates.confidenceLevel,
                category: updates.category,
                tags: updates.tags,
                life_phase_id: updates.lifePhaseId,
            })
            .eq('id', id)
            .select()
            .single();

        if (error) return null;

        return this.get(id);
    },

    async delete(id: string): Promise<boolean> {
        const { error } = await supabase
            .from('decisions')
            .delete()
            .eq('id', id);

        return !error;
    },

    async addReflection(decisionId: string, content: string): Promise<Decision | null> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { error } = await supabase
            .from('reflections')
            .insert({
                decision_id: decisionId,
                user_id: user.id,
                content,
            });

        if (error) return null;

        return this.get(decisionId);
    },
};

// ============================================
// JOURNAL ENTRIES
// ============================================

export const journalService = {
    async getAll(): Promise<JournalEntry[]> {
        const { data, error } = await supabase
            .from('journal_entries')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (data || []).map((e: any) => ({
            id: e.id,
            userId: e.user_id,
            title: e.title,
            content: e.content,
            mood: e.mood as JournalEntry['mood'],
            lifePhaseId: e.life_phase_id,
            createdAt: new Date(e.created_at),
            updatedAt: new Date(e.updated_at),
            linkedDecisionIds: [],
        }));
    },

    async get(id: string): Promise<JournalEntry | null> {
        const { data, error } = await supabase
            .from('journal_entries')
            .select('*')
            .eq('id', id)
            .single();

        if (error) return null;

        return {
            id: data.id,
            userId: data.user_id,
            title: data.title,
            content: data.content,
            mood: data.mood as JournalEntry['mood'],
            lifePhaseId: data.life_phase_id,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at),
            linkedDecisionIds: [],
        };
    },

    async create(entry: {
        title?: string;
        content: string;
        mood?: string;
        lifePhaseId?: string;
    }): Promise<JournalEntry> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('journal_entries')
            .insert({
                user_id: user.id,
                title: entry.title,
                content: entry.content,
                mood: entry.mood,
                life_phase_id: entry.lifePhaseId,
            })
            .select()
            .single();

        if (error) throw error;

        return {
            id: data.id,
            userId: data.user_id,
            title: data.title,
            content: data.content,
            mood: data.mood as JournalEntry['mood'],
            lifePhaseId: data.life_phase_id,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at),
            linkedDecisionIds: [],
        };
    },

    async update(id: string, updates: Partial<JournalEntry>): Promise<JournalEntry | null> {
        const { error } = await supabase
            .from('journal_entries')
            .update({
                title: updates.title,
                content: updates.content,
                mood: updates.mood,
                life_phase_id: updates.lifePhaseId,
            })
            .eq('id', id);

        if (error) return null;

        return this.get(id);
    },

    async delete(id: string): Promise<boolean> {
        const { error } = await supabase
            .from('journal_entries')
            .delete()
            .eq('id', id);

        return !error;
    },
};

// ============================================
// LIFE PHASES
// ============================================

export const phaseService = {
    async getAll(): Promise<LifePhase[]> {
        const { data, error } = await supabase
            .from('life_phases')
            .select(`
        *,
        goals (*)
      `)
            .order('start_date', { ascending: false });

        if (error) throw error;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (data || []).map((p: any) => ({
            id: p.id,
            userId: p.user_id,
            name: p.name,
            description: p.description,
            startDate: new Date(p.start_date),
            endDate: p.end_date ? new Date(p.end_date) : undefined,
            isActive: p.is_active,
            values: p.values || [],
            createdAt: new Date(p.created_at),
            updatedAt: new Date(p.updated_at),
            goals: (p.goals || []).map((g: { id: string; title: string; description: string; status: string; created_at: string; updated_at: string }) => ({
                id: g.id,
                title: g.title,
                description: g.description,
                status: g.status as Goal['status'],
                createdAt: new Date(g.created_at),
                updatedAt: new Date(g.updated_at),
            })),
        }));
    },

    async get(id: string): Promise<LifePhase | null> {
        const { data, error } = await supabase
            .from('life_phases')
            .select(`
        *,
        goals (*)
      `)
            .eq('id', id)
            .single();

        if (error) return null;

        return {
            id: data.id,
            userId: data.user_id,
            name: data.name,
            description: data.description,
            startDate: new Date(data.start_date),
            endDate: data.end_date ? new Date(data.end_date) : undefined,
            isActive: data.is_active,
            values: data.values || [],
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at),
            goals: (data.goals || []).map((g: { id: string; title: string; description: string; status: string; created_at: string; updated_at: string }) => ({
                id: g.id,
                title: g.title,
                description: g.description,
                status: g.status as Goal['status'],
                createdAt: new Date(g.created_at),
                updatedAt: new Date(g.updated_at),
            })),
        };
    },

    async getActive(): Promise<LifePhase | null> {
        const { data, error } = await supabase
            .from('life_phases')
            .select(`
        *,
        goals (*)
      `)
            .eq('is_active', true)
            .single();

        if (error) return null;

        return {
            id: data.id,
            userId: data.user_id,
            name: data.name,
            description: data.description,
            startDate: new Date(data.start_date),
            endDate: data.end_date ? new Date(data.end_date) : undefined,
            isActive: data.is_active,
            values: data.values || [],
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at),
            goals: (data.goals || []).map((g: { id: string; title: string; description: string; status: string; created_at: string; updated_at: string }) => ({
                id: g.id,
                title: g.title,
                description: g.description,
                status: g.status as Goal['status'],
                createdAt: new Date(g.created_at),
                updatedAt: new Date(g.updated_at),
            })),
        };
    },

    async create(phase: {
        name: string;
        description?: string;
        isActive?: boolean;
        values?: string[];
    }): Promise<LifePhase> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // Deactivate other phases if this one is active
        if (phase.isActive) {
            await supabase
                .from('life_phases')
                .update({ is_active: false })
                .eq('user_id', user.id);
        }

        const { data, error } = await supabase
            .from('life_phases')
            .insert({
                user_id: user.id,
                name: phase.name,
                description: phase.description,
                is_active: phase.isActive || false,
                values: phase.values || [],
            })
            .select()
            .single();

        if (error) throw error;

        return {
            id: data.id,
            userId: data.user_id,
            name: data.name,
            description: data.description,
            startDate: new Date(data.start_date),
            endDate: data.end_date ? new Date(data.end_date) : undefined,
            isActive: data.is_active,
            values: data.values || [],
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at),
            goals: [],
        };
    },

    async update(id: string, updates: Partial<LifePhase>): Promise<LifePhase | null> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // Deactivate other phases if setting this one as active
        if (updates.isActive) {
            await supabase
                .from('life_phases')
                .update({ is_active: false })
                .eq('user_id', user.id)
                .neq('id', id);
        }

        const { error } = await supabase
            .from('life_phases')
            .update({
                name: updates.name,
                description: updates.description,
                is_active: updates.isActive,
                end_date: updates.endDate,
                values: updates.values,
            })
            .eq('id', id);

        if (error) return null;

        return this.get(id);
    },

    async delete(id: string): Promise<boolean> {
        const { error } = await supabase
            .from('life_phases')
            .delete()
            .eq('id', id);

        return !error;
    },

    async addGoal(phaseId: string, title: string, description?: string): Promise<LifePhase | null> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { error } = await supabase
            .from('goals')
            .insert({
                life_phase_id: phaseId,
                user_id: user.id,
                title,
                description,
            });

        if (error) return null;

        return this.get(phaseId);
    },

    async updateGoal(goalId: string, updates: Partial<Goal>): Promise<boolean> {
        const { error } = await supabase
            .from('goals')
            .update({
                title: updates.title,
                description: updates.description,
                status: updates.status,
            })
            .eq('id', goalId);

        return !error;
    },
};

// ============================================
// PRIVATE PROFILE
// ============================================

export const profileService = {
    async get(): Promise<PrivateProfile | null> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from('private_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (error) return null;

        return {
            id: data.id,
            userId: data.user_id,
            values: data.values || [],
            joys: data.joys || [],
            rememberedAs: data.remembered_as || '',
            shareCode: data.share_code,
            shareExpiry: data.share_expiry ? new Date(data.share_expiry) : undefined,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at),
        };
    },

    async createOrUpdate(updates: Partial<PrivateProfile>): Promise<PrivateProfile> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('private_profiles')
            .upsert({
                user_id: user.id,
                values: updates.values,
                joys: updates.joys,
                remembered_as: updates.rememberedAs,
                share_code: updates.shareCode,
                share_expiry: updates.shareExpiry,
            })
            .select()
            .single();

        if (error) throw error;

        return {
            id: data.id,
            userId: data.user_id,
            values: data.values || [],
            joys: data.joys || [],
            rememberedAs: data.remembered_as || '',
            shareCode: data.share_code,
            shareExpiry: data.share_expiry ? new Date(data.share_expiry) : undefined,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at),
        };
    },
};

// ============================================
// EXPORT ALL DATA
// ============================================

export const exportAllData = async () => {
    const decisions = await decisionService.getAll();
    const journals = await journalService.getAll();
    const phases = await phaseService.getAll();
    const profile = await profileService.get();

    return {
        decisions,
        journalEntries: journals,
        lifePhases: phases,
        privateProfile: profile,
        exportedAt: new Date(),
    };
};
