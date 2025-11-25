"use client";

import AdmNavbar from "../../../components/adm/AdmNavbar";
import AuthWrapper from "../../../components/adm/AuthWrapper";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { IoMdPerson, IoMdImages, IoMdHelp, IoMdSettings, IoMdTime, IoMdEye, IoMdRefresh } from "react-icons/io";
import { FiPlusCircle, FiAlertCircle } from "react-icons/fi";
import { TbActivityHeartbeat } from "react-icons/tb";
import { RiAdminLine } from "react-icons/ri";
import useCurrentUser from "../../../hooks/useCurrentUser";
import { useEffectiveRank } from "../../../hooks/useViewAs";
import { hasPermission, PERMISSIONS } from "../../utils/permissions";

interface DashboardStats {
    totalUsers: number;
    totalItems: number;
    activeItems: number;
    totalQuestions: number;
}

interface Activity {
    id?: number;
    type: 'user' | 'item' | 'question';
    action: string;
    name: string;
    time: string;
}

export default function ADM() {
    const { user, isLoading: isUserLoading } = useCurrentUser();
    const effectiveRank = useEffectiveRank();
    const canAddUsers = effectiveRank && hasPermission(effectiveRank, PERMISSIONS.ADD_USERS);
    
    const [stats, setStats] = useState<DashboardStats>({
        totalUsers: 0,
        totalItems: 0,
        activeItems: 0,
        totalQuestions: 0
    });
    
    const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            const response = await fetch('/api/dashboard');
            
            if (!response.ok) {
                throw new Error(`Error fetching dashboard data: ${response.status}`);
            }
            
            const data = await response.json();
            
            setStats(data.stats);
            
            const activitiesWithIds = data.recentActivity.map((activity: Activity, index: number) => ({
                ...activity,
                id: activity.id || index + 1
            }));
            
            setRecentActivity(activitiesWithIds);
            setLastUpdated(new Date());
        } catch (err) {
            console.error("Error fetching dashboard data:", err);
            setError("Failed to load dashboard data. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }, []);
    
    useEffect(() => {
        fetchData();
        
        const refreshInterval = setInterval(fetchData, 5 * 60 * 1000);
        
        return () => clearInterval(refreshInterval);
    }, [fetchData]);

    return (
        <AuthWrapper>
            <div className="flex column">
                <AdmNavbar />
                <div id="main-content">
                    <div className="admin-dashboard">
                        <div className="dashboard-header">
                            <div className="dashboard-title">
                                <h1><RiAdminLine /> Admin Dashboard</h1>
                                <p>Welcome back, {isUserLoading ? '...' : user?.name || 'Admin'}</p>
                            </div>
                            <div className="dashboard-actions">
                                <button 
                                    onClick={fetchData} 
                                    className="refresh-btn"
                                    disabled={isLoading}
                                >
                                    <IoMdRefresh className={isLoading ? 'spinning' : ''} /> 
                                    Refresh Data
                                </button>
                                <Link href="/" className="view-site-btn">
                                    <IoMdEye /> View Site
                                </Link>
                            </div>
                        </div>
                        
                        {error && (
                            <div className="error-message">
                                <FiAlertCircle /> {error}
                            </div>
                        )}
                        
                        <section className="dashboard-stats">
                            <div className="stats-header">
                                <h2>Overview</h2>
                                {lastUpdated && (
                                    <p className="last-updated">
                                        Last updated: {lastUpdated.toLocaleTimeString()}
                                    </p>
                                )}
                            </div>
                            <div className="stats-grid">
                                <div className="stat-card">
                                    <div className="stat-icon users">
                                        <IoMdPerson />
                                    </div>
                                    <div className="stat-details">
                                        <h3>Total Users</h3>
                                        {isLoading ? (
                                            <div className="skeleton-loader"></div>
                                        ) : (
                                            <p className="stat-value">{stats.totalUsers.toLocaleString()}</p>
                                        )}
                                        <Link href="/adm/users" className="stat-link">View Details</Link>
                                    </div>
                                </div>
                                
                                <div className="stat-card">
                                    <div className="stat-icon items">
                                        <IoMdImages />
                                    </div>
                                    <div className="stat-details">
                                        <h3>Total Items</h3>
                                        {isLoading ? (
                                            <div className="skeleton-loader"></div>
                                        ) : (
                                            <>
                                                <p className="stat-value">{stats.totalItems.toLocaleString()}</p>
                                                <div className="stat-progress">
                                                    <div className="progress-bar">
                                                        <div 
                                                            className="progress-fill" 
                                                            style={{ width: `${stats.totalItems ? (stats.activeItems / stats.totalItems) * 100 : 0}%` }}
                                                        ></div>
                                                    </div>
                                                    <p className="stat-meta">
                                                        <span className="highlight">{stats.activeItems}</span> active 
                                                        ({stats.totalItems ? Math.round((stats.activeItems / stats.totalItems) * 100) : 0}%)
                                                    </p>
                                                </div>
                                            </>
                                        )}
                                        <Link href="/adm/items" className="stat-link">View Details</Link>
                                    </div>
                                </div>
                                
                                <div className="stat-card">
                                    <div className="stat-icon faq">
                                        <IoMdHelp />
                                    </div>
                                    <div className="stat-details">
                                        <h3>FAQ Questions</h3>
                                        {isLoading ? (
                                            <div className="skeleton-loader"></div>
                                        ) : (
                                            <p className="stat-value">{stats.totalQuestions.toLocaleString()}</p>
                                        )}
                                        <Link href="/adm/faq" className="stat-link">View Details</Link>
                                    </div>
                                </div>
                                
                                <div className="stat-card">
                                    <div className="stat-icon settings">
                                        <IoMdSettings />
                                    </div>
                                    <div className="stat-details">
                                        <h3>Settings</h3>
                                        <p className="stat-description">Manage site configuration</p>
                                        <Link href="/adm/settings" className="stat-link">Access Settings</Link>
                                    </div>
                                </div>
                            </div>
                        </section>
                        
                        <div className="dashboard-grid">
                            <section className="recent-activity">
                                <div className="section-header">
                                    <h2><TbActivityHeartbeat /> Recent Activity</h2>
                                </div>
                                <div className="activity-list">
                                    {isLoading ? (
                                        <>
                                            <div className="activity-skeleton"></div>
                                            <div className="activity-skeleton"></div>
                                            <div className="activity-skeleton"></div>
                                        </>
                                    ) : recentActivity.length > 0 ? (
                                        recentActivity.map(activity => (
                                            <div key={activity.id} className="activity-item">
                                                <div className={`activity-icon ${activity.type}`}>
                                                    {activity.type === 'user' && <IoMdPerson />}
                                                    {activity.type === 'item' && <IoMdImages />}
                                                    {activity.type === 'question' && <IoMdHelp />}
                                                </div>
                                                <div className="activity-details">
                                                    <h4>{activity.action}</h4>
                                                    <p>{activity.name}</p>
                                                </div>
                                                <div className="activity-time">
                                                    <IoMdTime />
                                                    <span>{activity.time}</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="no-activity">
                                            <p>No recent activity found</p>
                                        </div>
                                    )}
                                </div>
                            </section>
                            
                            <section className="quick-actions">
                                <div className="section-header">
                                    <h2>Quick Actions</h2>
                                </div>
                                <div className="actions-grid">
                                    {canAddUsers && (
                                        <Link href="/adm/users/add-user" className="action-card">
                                            <div className="action-icon">
                                                <FiPlusCircle />
                                            </div>
                                            <span>Add User</span>
                                        </Link>
                                    )}
                                    
                                    <Link href="/adm/items/add-item" className="action-card">
                                        <div className="action-icon">
                                            <FiPlusCircle />
                                        </div>
                                        <span>Add Item</span>
                                    </Link>
                                    
                                    <Link href="/adm/faq/add-faq" className="action-card">
                                        <div className="action-icon">
                                            <FiPlusCircle />
                                        </div>
                                        <span>Add FAQ</span>
                                    </Link>
                                    
                                    <Link href="/adm/settings" className="action-card">
                                        <div className="action-icon">
                                            <IoMdSettings />
                                        </div>
                                        <span>Settings</span>
                                    </Link>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        </AuthWrapper>
    );
}