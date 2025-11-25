"use client";

import { useState, useEffect, useCallback } from "react";

interface User {
    _id: string;
    name: string;
    mail: string;
    rank: string;
}

export default function useCurrentUser() {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const logout = useCallback(() => {
        // Ensure we're on the client side before accessing localStorage
        if (typeof window !== 'undefined') {
            localStorage.removeItem("token");
        }
        setUser(null);
        setError("Token expired");
    }, []);

    const fetchCurrentUser = useCallback(async () => {
        if (!mounted) return;

        setIsLoading(true);
        setError(null);

        try {
            // Ensure we're on the client side before accessing localStorage
            if (typeof window === 'undefined') {
                setIsLoading(false);
                return;
            }

            const token = localStorage.getItem("token");
            
            if (!token) {
                setError("No authentication token found");
                setIsLoading(false);
                return;
            }
            
            const response = await fetch("/api/auth/me", {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Cache-Control": "no-cache, no-store, must-revalidate",
                    "Pragma": "no-cache"
                },
                cache: 'no-store'
            });
            
            if (response.status === 401) {
                // Token is expired or invalid, or session was terminated
                console.log('Authentication failed - session terminated or token expired');
                logout();
                setIsLoading(false);
                // Redirect to login immediately
                if (typeof window !== 'undefined') {
                    window.location.href = '/adm/login';
                }
                return;
            }
            
            if (!response.ok) {
                throw new Error(`Failed to fetch user data: ${response.status}`);
            }
            
            const userData = await response.json();
            setUser(userData);
        } catch (err) {
            console.error("Error fetching current user:", err);
            setError(err instanceof Error ? err.message : "Failed to fetch user data");
        } finally {
            setIsLoading(false);
        }
    }, [mounted, logout]);

    useEffect(() => {
        if (mounted) {
            fetchCurrentUser();
        }
    }, [fetchCurrentUser, mounted]);

    // Listen for force logout events (session terminated by admin)
    useEffect(() => {
        if (!mounted) return;

        const handleForceLogout = (event: any) => {
            const logoutData = event.detail;
            console.log('Force logout event received:', logoutData);
            
            // Always check session validity when a logout event is received
            // This catches cases where the session might have been terminated
            fetchCurrentUser();
            
            // If user matches the terminated session, log them out immediately
            if (user && (
                logoutData.logoutAll || 
                logoutData.userId === user._id ||
                logoutData.sessionToken === 'all'
            )) {
                console.log('Current user session terminated, logging out...');
                logout();
                if (typeof window !== 'undefined') {
                    alert('Your session has been terminated by an administrator.');
                    window.location.href = '/adm/login';
                }
            }
        };

        const handleStorageLogout = (event: StorageEvent) => {
            if (event.key === 'forceLogout' && event.newValue) {
                try {
                    const logoutData = JSON.parse(event.newValue);
                    console.log('Cross-tab logout event received:', logoutData);
                    
                    // Always check session validity when a logout event is received
                    fetchCurrentUser();
                    
                    // If user matches the terminated session, log them out
                    if (user && (
                        logoutData.logoutAll || 
                        logoutData.userId === user._id ||
                        logoutData.sessionToken === 'all'
                    )) {
                        console.log('Current user session terminated via cross-tab, logging out...');
                        logout();
                        if (typeof window !== 'undefined') {
                            alert('Your session has been terminated by an administrator.');
                            window.location.href = '/adm/login';
                        }
                    }
                } catch (error) {
                    console.error('Error parsing logout data:', error);
                }
            }
        };

        // Listen for both custom events and storage events
        window.addEventListener('forceLogout', handleForceLogout);
        window.addEventListener('storage', handleStorageLogout);

        return () => {
            window.removeEventListener('forceLogout', handleForceLogout);
            window.removeEventListener('storage', handleStorageLogout);
        };
    }, [mounted, user, logout]);

    return { user, isLoading, error, refetch: fetchCurrentUser, logout };
} 