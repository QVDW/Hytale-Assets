"use client";

import React from "react";
// Simple time formatting function
const formatDistanceToNow = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
};
import { 
    FiMonitor, 
    FiSmartphone, 
    FiTablet, 
    FiGlobe, 
    FiClock, 
    FiMapPin, 
    FiLogOut,
    FiAlertTriangle,
    FiCheck,
    FiX
} from "react-icons/fi";
import { canViewUserSessions } from "../../../src/utils/permissions";

interface Session {
    _id: string;
    sessionToken: string;
    userId: {
        _id: string;
        name: string;
        mail: string;
        rank: string;
    };
    deviceInfo: {
        userAgent: string;
        browser: string;
        os: string;
        device: string;
        isMobile: boolean;
    };
    location: {
        ipAddress: string;
        country?: string;
        region?: string;
        city?: string;
    };
    loginTime: string;
    lastActivity: string;
    isActive: boolean;
    expiresAt: string;
}

interface Pagination {
    current: number;
    total: number;
    count: number;
    totalSessions: number;
}

interface SessionsListProps {
    sessions: Session[];
    loading: boolean;
    pagination: Pagination;
    onPageChange: (page: number) => void;
    onForceLogout: (sessionToken: string, userId: string, logoutAll?: boolean) => void;
    currentUserRank: string;
}

export default function SessionsList({ 
    sessions, 
    loading, 
    pagination, 
    onPageChange, 
    onForceLogout,
    currentUserRank 
}: SessionsListProps) {
    const getDeviceIcon = (device: string, isMobile: boolean) => {
        if (isMobile) {
            return device === 'Tablet' ? <FiTablet /> : <FiSmartphone />;
        }
        return <FiMonitor />;
    };

    const formatLocation = (location: Session['location']) => {
        const parts = [];
        if (location.city) parts.push(location.city);
        if (location.region) parts.push(location.region);
        if (location.country) parts.push(location.country);
        
        return parts.length > 0 ? parts.join(', ') : location.ipAddress;
    };

    const handleLogoutConfirm = (sessionToken: string, userId: string, logoutAll = false) => {
        const confirmMessage = logoutAll 
            ? "Are you sure you want to force logout ALL sessions for this user?"
            : "Are you sure you want to force logout this session?";
            
        if (window.confirm(confirmMessage)) {
            onForceLogout(sessionToken, userId, logoutAll);
        }
    };

    if (loading) {
        return (
            <div className="sessions-loading">
                <div className="loading-spinner"></div>
                <p>Loading sessions...</p>
            </div>
        );
    }

    if (sessions.length === 0) {
        return (
            <div className="sessions-empty">
                <FiMonitor />
                <h3>No Sessions Found</h3>
                <p>No active sessions match your current filters.</p>
            </div>
        );
    }

    return (
        <div className="sessions-list">
            <div className="sessions-header-info">
                <h3>Active Sessions</h3>
                <span className="sessions-count">
                    {pagination.count} of {pagination.totalSessions} sessions
                </span>
            </div>

            <div className="sessions-grid">
                {sessions.map((session) => {
                    const canManage = canViewUserSessions(currentUserRank, session.userId.rank);
                    const isExpiringSoon = new Date(session.expiresAt) < new Date(Date.now() + 24 * 60 * 60 * 1000);
                    
                    return (
                        <div 
                            key={session._id} 
                            className={`session-card ${!session.isActive ? 'inactive' : ''} ${isExpiringSoon ? 'expiring' : ''}`}
                        >
                            <div className="session-card-header">
                                <div className="user-info">
                                    <h4>{session.userId.name}</h4>
                                    <span className={`user-rank ${session.userId.rank.toLowerCase()}`}>
                                        {session.userId.rank}
                                    </span>
                                </div>
                                
                                <div className="session-status">
                                    {session.isActive ? (
                                        <div className="status-active">
                                            <FiCheck />
                                            <span>Active</span>
                                        </div>
                                    ) : (
                                        <div className="status-inactive">
                                            <FiX />
                                            <span>Inactive</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="session-details">
                                <div className="device-info">
                                    <div className="device-icon">
                                        {getDeviceIcon(session.deviceInfo.device, session.deviceInfo.isMobile)}
                                    </div>
                                    <div className="device-text">
                                        <span className="device-name">
                                            {session.deviceInfo.browser} on {session.deviceInfo.os}
                                        </span>
                                        <span className="device-type">
                                            {session.deviceInfo.device}
                                        </span>
                                    </div>
                                </div>

                                <div className="location-info">
                                    <FiMapPin />
                                    <span>{formatLocation(session.location)}</span>
                                </div>

                                <div className="time-info">
                                    <div className="time-item">
                                        <FiClock />
                                        <span>
                                            Login: {formatDistanceToNow(new Date(session.loginTime))}
                                        </span>
                                    </div>
                                    <div className="time-item">
                                        <FiGlobe />
                                        <span>
                                            Last Activity: {formatDistanceToNow(new Date(session.lastActivity))}
                                        </span>
                                    </div>
                                </div>

                                {isExpiringSoon && (
                                    <div className="expiring-warning">
                                        <FiAlertTriangle />
                                        <span>Expires soon</span>
                                    </div>
                                )}
                            </div>

                            {canManage && session.isActive && (
                                <div className="session-actions">
                                    <button
                                        className="logout-session-btn"
                                        onClick={() => handleLogoutConfirm(session.sessionToken, session.userId._id)}
                                        title="Force logout this session"
                                    >
                                        <FiLogOut />
                                        End Session
                                    </button>
                                    
                                    <button
                                        className="logout-all-btn"
                                        onClick={() => handleLogoutConfirm(session.sessionToken, session.userId._id, true)}
                                        title="Force logout all sessions for this user"
                                    >
                                        <FiLogOut />
                                        End All Sessions
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {pagination.total > 1 && (
                <div className="sessions-pagination">
                    <button
                        onClick={() => onPageChange(pagination.current - 1)}
                        disabled={pagination.current <= 1}
                        className="pagination-btn prev"
                    >
                        Previous
                    </button>

                    <div className="pagination-info">
                        Page {pagination.current} of {pagination.total}
                    </div>

                    <button
                        onClick={() => onPageChange(pagination.current + 1)}
                        disabled={pagination.current >= pagination.total}
                        className="pagination-btn next"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
} 