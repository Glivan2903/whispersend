import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';

const TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export function SessionManager() {
    const { session, signOut } = useAuthStore();
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // 1. Inactivity Logout Logic
    useEffect(() => {
        if (!session) return;

        const resetTimer = () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => {
                console.log("Session timed out due to inactivity");
                signOut();
                window.location.href = '/login'; // Force redirect
            }, TIMEOUT_MS);
        };

        // Initial start
        resetTimer();

        // Events to listen for
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

        // Throttled handler to avoid performance hit
        let lastRun = 0;
        const handler = () => {
            const now = Date.now();
            if (now - lastRun > 1000) { // Only reset once per second max
                resetTimer();
                lastRun = now;
            }
        };

        events.forEach(event => document.addEventListener(event, handler));

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            events.forEach(event => document.removeEventListener(event, handler));
        };
    }, [session, signOut]);

    // 2. Focus / Visibility Refresh Logic (Fix for "Frozen" state)
    useEffect(() => {
        if (!session) return;

        const handleVisibilityChange = async () => {
            if (document.visibilityState === 'visible') {
                console.log("App active, checking session...");
                // Force a session check. If token is expired, Supabase will try to refresh.
                // If refresh fails, onAuthStateChange in store will likely catch it.
                const { data, error } = await supabase.auth.getSession();
                console.log("Session Check Result:", data?.session ? "Valid" : "Invalid", error || "");

                if (error || !data.session) {
                    // If we can't recover session, log out
                    // signOut(); // Optional: depend on how aggressive we want to be. 
                    // Usually let `onAuthStateChange` handle the actual sign out to avoid race conditions.
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleVisibilityChange); // Extra backup

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleVisibilityChange);
        };
    }, [session]);

    return null; // Logic only component
}
