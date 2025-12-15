import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';

const TIMEOUT_MS = 60 * 60 * 1000; // 60 minutes
const CHECK_INTERVAL_MS = 60 * 1000; // Check every 1 minute
const STORAGE_KEY = 'whispersend_last_activity';

export function SessionManager() {
    const { session, signOut } = useAuthStore();

    // 1. Inactivity Logic (Timestamp based)
    useEffect(() => {
        if (!session) return;

        // Initialize timestamp if missing
        if (!localStorage.getItem(STORAGE_KEY)) {
            localStorage.setItem(STORAGE_KEY, Date.now().toString());
        }

        const checkInactivity = () => {
            const lastActivity = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
            const now = Date.now();

            if (now - lastActivity > TIMEOUT_MS) {
                console.log("Session expired due to inactivity.");
                signOut();
                localStorage.removeItem(STORAGE_KEY);
                window.location.href = '/login';
            }
        };

        // Periodic check
        const intervalId = setInterval(checkInactivity, CHECK_INTERVAL_MS);

        // Immediate check on visibility change (welcome back)
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                checkInactivity();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Update timestamp on user activity
        const updateActivity = () => {
            // Throttle: only update if > 5 seconds have passed to avoid spamming localStorage
            const last = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
            const now = Date.now();
            if (now - last > 5000) {
                localStorage.setItem(STORAGE_KEY, now.toString());
            }
        };

        const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
        events.forEach(event => window.addEventListener(event, updateActivity));

        return () => {
            clearInterval(intervalId);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            events.forEach(event => window.removeEventListener(event, updateActivity));
        };
    }, [session, signOut]);

    // 2. Focus Refresh Logic (Supabase Session Recovery)
    useEffect(() => {
        if (!session) return;

        const handleFocus = async () => {
            if (document.visibilityState === 'visible') {
                // Ensure Supabase session is still valid
                const { data, error } = await supabase.auth.getSession();
                if (error || !data.session) {
                    console.log("Supabase session invalid, attempting refresh or logout...");
                }
            }
        };

        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [session]);

    // 3. Keep-Alive Refresh Interval (User Request)
    useEffect(() => {
        if (!session) return;

        const interval = setInterval(async () => {
            // Refresh session to prevent expiration
            // Note: supabase.auth.getSession() handles token refresh if needed.
            // But user requested specific interval refresh.
            const { data, error } = await supabase.auth.getSession();
            if (error) {
                console.error("Session refresh error:", error);
            } else if (data.session) {
                // Optional: Log refresh for debug
                // console.log("Session refreshed/verified");
            }
        }, 1000 * 60 * 5); // 5 minutes (User requested 5 mins inactivity refresh)

        return () => clearInterval(interval);
    }, [session]);

    return null;
}
