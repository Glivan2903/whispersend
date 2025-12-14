import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { type Session, type User } from '@supabase/supabase-js';

interface AuthState {
    user: User | null;
    isAdmin: boolean;
    session: Session | null;
    loading: boolean;
    initialize: () => Promise<void>;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, fullName: string) => Promise<any>;
    signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAdmin: false,
    session: null,
    loading: true,
    initialize: async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            let isAdmin = false;
            if (session?.user) {
                const { data } = await supabase.from('users').select('is_admin').eq('id', session.user.id).single();
                isAdmin = data?.is_admin || false;
            }
            set({ session, user: session?.user || null, isAdmin, loading: false });

            supabase.auth.onAuthStateChange(async (_event, session) => {
                let isAdmin = false;
                if (session?.user) {
                    const { data } = await supabase.from('users').select('is_admin').eq('id', session.user.id).single();
                    isAdmin = data?.is_admin || false;
                }
                set({ session, user: session?.user || null, isAdmin, loading: false });
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
