import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { type Session, type User } from '@supabase/supabase-js';

interface AuthState {
    user: User | null;
    isAdmin: boolean;
    isBlocked: boolean;
    termsAccepted: boolean;
    session: Session | null;
    loading: boolean;
    initialize: () => Promise<void>;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, fullName: string) => Promise<any>;
    signOut: () => Promise<void>;
    acceptTerms: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAdmin: false,
    isBlocked: false,
    termsAccepted: true, // Optimist by default to avoid flash, but initialize invalidates it safely
    session: null,
    loading: true,
    initialize: async () => {
        try {
            // Create a timeout promise to prevent indefinite hanging
            const timeoutPromise = new Promise<{ data: { session: null } }>((resolve) => {
                setTimeout(() => resolve({ data: { session: null } }), 5000);
            });

            // Race Supabase vs Timeout
            const { data: { session } } = await Promise.race([
                supabase.auth.getSession(),
                timeoutPromise
            ]);
            let isAdmin = false;
            let isBlocked = false;
            let termsAccepted = false;

            if (session?.user) {
                const { data } = await supabase.from('users').select('is_admin, is_blocked, terms_accepted').eq('id', session.user.id).single();
                isAdmin = data?.is_admin || false;
                isBlocked = data?.is_blocked || false;
                termsAccepted = data?.terms_accepted || false;
            }
            set({ session, user: session?.user || null, isAdmin, isBlocked, termsAccepted, loading: false });

            supabase.auth.onAuthStateChange(async (_event, session) => {
                let isAdmin = false;
                let isBlocked = false;
                let termsAccepted = false;

                if (session?.user) {
                    const { data } = await supabase.from('users').select('is_admin, is_blocked, terms_accepted').eq('id', session.user.id).single();
                    isAdmin = data?.is_admin || false;
                    isBlocked = data?.is_blocked || false;
                    termsAccepted = data?.terms_accepted || false;
                }
                set({ session, user: session?.user || null, isAdmin, isBlocked, termsAccepted, loading: false });
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
        set({ session: null, user: null, isAdmin: false, isBlocked: false, termsAccepted: false });
        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.error('Error signing out:', error);
        }
    },
    acceptTerms: async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user found");

            const { error } = await supabase
                .from('users')
                .update({ terms_accepted: true })
                .eq('id', user.id);

            if (error) throw error;
            set({ termsAccepted: true });
        } catch (error) {
            console.error('Error accepting terms:', error);
            throw error;
        }
    }
}));
