import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { type Session, type User } from '@supabase/supabase-js';

interface AuthState {
    user: User | null;
    isAdmin: boolean;
    isBlocked: boolean;
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
    isBlocked: false,
    session: null,
    loading: true,
    initialize: async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            let isAdmin = false;
            let isBlocked = false;
            if (session?.user) {
                const { data } = await supabase.from('users').select('is_admin, is_blocked').eq('id', session.user.id).single();
                isAdmin = data?.is_admin || false;
                isBlocked = data?.is_blocked || false;
            }
            set({ session, user: session?.user || null, isAdmin, isBlocked, loading: false });

            supabase.auth.onAuthStateChange(async (_event, session) => {
                let isAdmin = false;
                let isBlocked = false;
                if (session?.user) {
                    const { data } = await supabase.from('users').select('is_admin, is_blocked').eq('id', session.user.id).single();
                    isAdmin = data?.is_admin || false;
                    isBlocked = data?.is_blocked || false;
                }
                set({ session, user: session?.user || null, isAdmin, isBlocked, loading: false });
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
        set({ session: null, user: null, isAdmin: false, isBlocked: false });
        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.error('Error signing out:', error);
        }
    },
}));
