"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useCurrentUser from "../../../../../hooks/useCurrentUser";
import { hasPermission, PERMISSIONS } from "../../../../utils/permissions";
import { authenticatedFetch } from "../../../../utils/apiConfig";
import { FiSettings, FiShield, FiClock, FiArrowLeft, FiSave } from "react-icons/fi";

interface SessionConfig {
    sessionTimeoutDays: number;
    maxActiveSessions: number;
    enforceLocationTracking: boolean;
    enableSuspiciousActivityDetection: boolean;
    autoLogoutOnSuspiciousActivity: boolean;
    requireReauthenticationHours: number;
    cleanupExpiredSessionsIntervalHours: number;
}

export default function SessionConfigPage() {
    const { user, isLoading: userLoading } = useCurrentUser();
    const router = useRouter();
    
    const [config, setConfig] = useState<SessionConfig>({
        sessionTimeoutDays: 30,
        maxActiveSessions: 5,
        enforceLocationTracking: true,
        enableSuspiciousActivityDetection: true,
        autoLogoutOnSuspiciousActivity: false,
        requireReauthenticationHours: 24,
        cleanupExpiredSessionsIntervalHours: 1
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Check permissions
    useEffect(() => {
        if (!userLoading && user) {
            if (!hasPermission(user.rank, PERMISSIONS.CONFIGURE_SESSION_TIMEOUT)) {
                router.push('/adm/sessions');
                return;
            }
        }
    }, [user, userLoading, router]);

    // Fetch current configuration
    useEffect(() => {
        const fetchConfig = async () => {
            if (!user || !hasPermission(user.rank, PERMISSIONS.CONFIGURE_SESSION_TIMEOUT)) {
                return;
            }

            try {
                setLoading(true);
                setError(null);

                const response = await authenticatedFetch('/api/session-config');
                
                if (!response.ok) {
                    throw new Error('Failed to fetch session configuration');
                }

                const data = await response.json();
                setConfig(data.config);
            } catch (err) {
                console.error('Error fetching session config:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch configuration');
            } finally {
                setLoading(false);
            }
        };

        fetchConfig();
    }, [user]);

    const handleConfigChange = (key: keyof SessionConfig, value: number | boolean) => {
        setConfig(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setError(null);
            setSuccess(null);

            const response = await authenticatedFetch('/api/session-config', {
                method: 'PUT',
                body: JSON.stringify(config)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save configuration');
            }

            const data = await response.json();
            setSuccess(data.message);
            
            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error('Error saving session config:', err);
            setError(err instanceof Error ? err.message : 'Failed to save configuration');
        } finally {
            setSaving(false);
        }
    };

    if (userLoading) {
        return <div className="loading-text">Loading...</div>;
    }

    if (!user || !hasPermission(user.rank, PERMISSIONS.CONFIGURE_SESSION_TIMEOUT)) {
        return (
            <div className="access-denied">
                <h1>Access Denied</h1>
                <p>You don&apos;t have permission to configure session settings.</p>
            </div>
        );
    }

    return (
        <div className="session-config-page">
            <div className="config-header">
                <div className="header-content">
                    <button 
                        className="back-btn"
                        onClick={() => router.push('/adm/sessions')}
                    >
                        <FiArrowLeft />
                        Back to Sessions
                    </button>
                    
                    <h1>
                        <FiSettings />
                        Session Configuration
                    </h1>
                    <p>Configure session timeout, security settings, and cleanup policies</p>
                </div>
            </div>

            {error && (
                <div className="error-message">
                    <FiShield />
                    {error}
                </div>
            )}

            {success && (
                <div className="success-message">
                    <FiShield />
                    {success}
                </div>
            )}

            {loading ? (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading configuration...</p>
                </div>
            ) : (
                <div className="config-form">
                    <div className="config-section">
                        <h3>
                            <FiClock />
                            Session Timeout Settings
                        </h3>
                        
                        <div className="form-group">
                            <label htmlFor="sessionTimeout">Session Timeout (days)</label>
                            <input
                                type="number"
                                id="sessionTimeout"
                                min="1"
                                max="365"
                                value={config.sessionTimeoutDays}
                                onChange={(e) => handleConfigChange('sessionTimeoutDays', parseInt(e.target.value))}
                            />
                            <small>How long a session remains valid (1-365 days)</small>
                        </div>

                        <div className="form-group">
                            <label htmlFor="maxSessions">Maximum Active Sessions per User</label>
                            <input
                                type="number"
                                id="maxSessions"
                                min="1"
                                max="50"
                                value={config.maxActiveSessions}
                                onChange={(e) => handleConfigChange('maxActiveSessions', parseInt(e.target.value))}
                            />
                            <small>Maximum number of concurrent sessions allowed (1-50)</small>
                        </div>

                        <div className="form-group">
                            <label htmlFor="reauthTime">Require Re-authentication (hours)</label>
                            <input
                                type="number"
                                id="reauthTime"
                                min="1"
                                max="168"
                                value={config.requireReauthenticationHours}
                                onChange={(e) => handleConfigChange('requireReauthenticationHours', parseInt(e.target.value))}
                            />
                            <small>Force re-authentication after this many hours (1-168 hours)</small>
                        </div>
                    </div>

                    <div className="config-section">
                        <h3>
                            <FiShield />
                            Security Settings
                        </h3>
                        
                        <div className="form-group checkbox-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={config.enforceLocationTracking}
                                    onChange={(e) => handleConfigChange('enforceLocationTracking', e.target.checked)}
                                />
                                <span>Enforce Location Tracking</span>
                            </label>
                            <small>Track user location and detect unusual login locations</small>
                        </div>

                        <div className="form-group checkbox-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={config.enableSuspiciousActivityDetection}
                                    onChange={(e) => handleConfigChange('enableSuspiciousActivityDetection', e.target.checked)}
                                />
                                <span>Enable Suspicious Activity Detection</span>
                            </label>
                            <small>Monitor and flag suspicious login patterns</small>
                        </div>

                        <div className="form-group checkbox-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={config.autoLogoutOnSuspiciousActivity}
                                    onChange={(e) => handleConfigChange('autoLogoutOnSuspiciousActivity', e.target.checked)}
                                />
                                <span>Auto-logout on Suspicious Activity</span>
                            </label>
                            <small>Automatically terminate sessions when suspicious activity is detected</small>
                        </div>
                    </div>

                    <div className="config-section">
                        <h3>
                            <FiSettings />
                            Maintenance Settings
                        </h3>
                        
                        <div className="form-group">
                            <label htmlFor="cleanupInterval">Cleanup Interval (hours)</label>
                            <input
                                type="number"
                                id="cleanupInterval"
                                min="1"
                                max="168"
                                value={config.cleanupExpiredSessionsIntervalHours}
                                onChange={(e) => handleConfigChange('cleanupExpiredSessionsIntervalHours', parseInt(e.target.value))}
                            />
                            <small>How often to clean up expired sessions (1-168 hours)</small>
                        </div>
                    </div>

                    <div className="config-actions">
                        <button
                            className="save-config-btn"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            <FiSave />
                            {saving ? 'Saving...' : 'Save Configuration'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
} 