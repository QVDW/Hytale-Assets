"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import useCurrentUser from "../../../../hooks/useCurrentUser";
import useAuth from "../../../../hooks/useAuth";
import { hasPermission, PERMISSIONS } from "../../../utils/permissions";
import { authenticatedFetch } from "../../../utils/apiConfig";
import AdmNavbar from "../../../../components/adm/AdmNavbar";
import AuthWrapper from "../../../../components/adm/AuthWrapper";
import SessionsList from "../../../../components/adm/sessions/SessionsList";
import SessionsStats from "../../../../components/adm/sessions/SessionsStats";
import SessionFilters from "../../../../components/adm/sessions/SessionFilters";
import { FiShield, FiSettings, FiRefreshCw } from "react-icons/fi";



export default function SessionsPage() {
    useAuth();
    const { user, isLoading: userLoading } = useCurrentUser();
    const router = useRouter();
    
    const [sessions, setSessions] = useState<Record<string, unknown>[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState({
        userId: '',
        activeOnly: true,
        page: 1,
        limit: 20
    });
    const [pagination, setPagination] = useState({
        current: 1,
        total: 1,
        count: 0,
        totalSessions: 0
    });
    const [refreshing, setRefreshing] = useState(false);

    // Check permissions
    useEffect(() => {
        if (!userLoading && user) {
            if (!hasPermission(user.rank, PERMISSIONS.VIEW_ALL_SESSIONS)) {
                router.push('/adm');
                return;
            }
        }
    }, [user, userLoading, router]);

    // Fetch sessions
    const fetchSessions = useCallback(async (newFilters = filters) => {
        try {
            setLoading(true);
            setError(null);

            const queryParams = new URLSearchParams();
            if (newFilters.userId) queryParams.append('userId', newFilters.userId);
            if (newFilters.activeOnly) queryParams.append('activeOnly', 'true');
            queryParams.append('page', newFilters.page.toString());
            queryParams.append('limit', newFilters.limit.toString());

            const response = await authenticatedFetch(`/api/sessions?${queryParams}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch sessions');
            }

            const data = await response.json();
            setSessions(data.sessions);
            setPagination(data.pagination);
        } catch (err) {
            console.error('Error fetching sessions:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch sessions');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    // Refresh sessions
    const refreshSessions = async () => {
        setRefreshing(true);
        await fetchSessions();
        setRefreshing(false);
    };

    // Handle filter changes
    const handleFiltersChange = (newFilters: Record<string, unknown>) => {
        const updatedFilters = { ...filters, ...newFilters, page: 1 };
        setFilters(updatedFilters);
        fetchSessions(updatedFilters);
    };

    // Handle pagination
    const handlePageChange = (page: number) => {
        const updatedFilters = { ...filters, page };
        setFilters(updatedFilters);
        fetchSessions(updatedFilters);
    };

    // Force logout session
    const handleForceLogout = async (sessionToken: string, userId: string, logoutAll = false) => {
        try {
            const response = await authenticatedFetch('/api/sessions', {
                method: 'DELETE',
                body: JSON.stringify({
                    sessionToken: logoutAll ? undefined : sessionToken,
                    userId: logoutAll ? userId : undefined,
                    logoutAll
                })
            });

            if (!response.ok) {
                throw new Error('Failed to terminate session');
            }

            const data = await response.json();
            alert(data.message);
            
            // Broadcast logout event for immediate logout across all tabs
            if (typeof window !== 'undefined') {
                const logoutData = {
                    sessionToken: logoutAll ? 'all' : sessionToken,
                    userId,
                    logoutAll,
                    timestamp: Date.now(),
                    reason: 'session_terminated_by_admin'
                };
                
                // Dispatch custom event for current tab
                const logoutEvent = new CustomEvent('forceLogout', {
                    detail: logoutData
                });
                window.dispatchEvent(logoutEvent);
                
                // Use localStorage to communicate across tabs
                localStorage.setItem('forceLogout', JSON.stringify(logoutData));
                
                // Clean up the logout event after a short delay
                setTimeout(() => {
                    localStorage.removeItem('forceLogout');
                }, 2000);
            }
            
            // Refresh sessions list
            await refreshSessions();
        } catch (err) {
            console.error('Error terminating session:', err);
            alert('Failed to terminate session: ' + (err instanceof Error ? err.message : 'Unknown error'));
        }
    };

    // Initial load
    useEffect(() => {
        if (user && hasPermission(user.rank, PERMISSIONS.VIEW_ALL_SESSIONS)) {
            fetchSessions();
        }
    }, [user, fetchSessions]);

    if (userLoading) {
        return <div className="loading-text">Loading...</div>;
    }

    if (!user || !hasPermission(user.rank, PERMISSIONS.VIEW_ALL_SESSIONS)) {
        return (
            <AuthWrapper>
                <div className="access-denied">
                    <h1>Access Denied</h1>
                    <p>You don&apos;t have permission to view session management.</p>
                </div>
            </AuthWrapper>
        );
    }

    return (
        <AuthWrapper>
            <div className="flex column">
                <AdmNavbar />
                <div id="main-content">
                    <div className="adm-header">
                        <h1 className="adm-title">
                            Session Management
                        </h1>
                        <div className="header-actions flex gap-3">
                            <button 
                                className="refresh-btn adm-btn"
                                onClick={refreshSessions}
                                disabled={refreshing}
                            >
                                <FiRefreshCw className={refreshing ? 'spinning' : ''} />
                                Refresh
                            </button>
                            
                            <button 
                                className="settings-btn adm-btn"
                                onClick={() => router.push('/adm/sessions/config')}
                            >
                                <FiSettings />
                                Configuration
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="error-message">
                            <FiShield />
                            {error}
                        </div>
                    )}

                    <SessionsStats 
                        totalSessions={pagination.totalSessions}
                        activeSessions={sessions.filter(s => s.isActive).length}
                    />

                    <SessionFilters 
                        filters={filters}
                        onFiltersChange={handleFiltersChange}
                        userRank={user.rank}
                    />

                    <SessionsList
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        sessions={sessions as any}
                        loading={loading}
                        pagination={pagination}
                        onPageChange={handlePageChange}
                        onForceLogout={handleForceLogout}
                        currentUserRank={user.rank}
                    />
                </div>
            </div>
        </AuthWrapper>
    );
} 