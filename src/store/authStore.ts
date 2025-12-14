import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { type Session, type User } from '@supabase/supabase-js';

interface AuthState {
    user: User | null;
    session: Session | null;
    loading: boolean;
    initialize: () => Promise<void>;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, fullName: string) => Promise<any>;
    signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    session: null,
    loading: true,
    initialize: async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            set({ session, user: session?.user || null, loading: false });

            supabase.auth.onAuthStateChange((_event, session) => {
                set({ session, user: session?.user || null, loading: false });
            });
        } catch (error) {
            console.error('Error initializing auth:', error);
            set({ loading: false });
        }
    },
    signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
    },
    signUp: async (email, password, fullName) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                },
            },
        });
        if (error) throw error;
        return data;
    },
    signOut: async () => {
        await supabase.auth.signOut();
        set({ session: null, user: null });
    },
}));
