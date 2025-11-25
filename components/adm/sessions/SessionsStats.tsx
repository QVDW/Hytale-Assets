"use client";

import { FiMonitor, FiActivity, FiUsers, FiClock } from "react-icons/fi";

interface SessionsStatsProps {
    totalSessions: number;
    activeSessions: number;
}

export default function SessionsStats({ totalSessions, activeSessions }: SessionsStatsProps) {
    const inactiveSessions = totalSessions - activeSessions;
    const activePercentage = totalSessions > 0 ? Math.round((activeSessions / totalSessions) * 100) : 0;

    return (
        <div className="sessions-stats">
            <div className="stats-grid">
                <div className="stat-card total">
                    <div className="stat-icon">
                        <FiMonitor />
                    </div>
                    <div className="stat-content">
                        <h3>Total Sessions</h3>
                        <div className="stat-value">{totalSessions}</div>
                        <div className="stat-description">All tracked sessions</div>
                    </div>
                </div>

                <div className="stat-card active">
                    <div className="stat-icon">
                        <FiActivity />
                    </div>
                    <div className="stat-content">
                        <h3>Active Sessions</h3>
                        <div className="stat-value">{activeSessions}</div>
                        <div className="stat-description">{activePercentage}% of total</div>
                    </div>
                </div>

                <div className="stat-card inactive">
                    <div className="stat-icon">
                        <FiClock />
                    </div>
                    <div className="stat-content">
                        <h3>Inactive Sessions</h3>
                        <div className="stat-value">{inactiveSessions}</div>
                        <div className="stat-description">Expired or logged out</div>
                    </div>
                </div>

                <div className="stat-card activity-rate">
                    <div className="stat-icon">
                        <FiUsers />
                    </div>
                    <div className="stat-content">
                        <h3>Activity Rate</h3>
                        <div className="stat-value">{activePercentage}%</div>
                        <div className="stat-description">Sessions currently active</div>
                    </div>
                </div>
            </div>
        </div>
    );
} 