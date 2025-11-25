"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import AuthWrapper from "../../../../components/adm/AuthWrapper";
import AdmNavbar from "../../../../components/adm/AdmNavbar";
import { FaExclamationTriangle, FaInfoCircle, FaExclamationCircle, FaBug, FaFilter, FaTrash, FaCheck, FaTimes, FaEye, FaEyeSlash } from "react-icons/fa";
import { TbRefresh } from "react-icons/tb";
import { authenticatedFetch } from "../../../utils/apiConfig";
import { hasPermission, PERMISSIONS } from "../../../utils/permissions";
import { useEffectiveRank } from "../../../../hooks/useViewAs";
import Pagination from "../../../../components/adm/Pagination";

interface ErrorLog {
    _id: string;
    message: string;
    stack?: string;
    level: 'error' | 'warning' | 'info' | 'debug';
    source?: string;
    userId?: {
        _id: string;
        name: string;
        mail: string;
        rank: string;
    };
    userAgent?: string;
    ipAddress?: string;
    url?: string;
    resolved: boolean;
    resolvedBy?: {
        _id: string;
        name: string;
        mail: string;
    };
    resolvedAt?: string;
    tags?: string[];
    metadata?: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
}

interface ErrorLogResponse {
    errorLogs: ErrorLog[];
    totalCount: number;
    currentPage: number;
    totalPages: number;
    stats: {
        error?: number;
        warning?: number;
        info?: number;
        debug?: number;
    };
}

const levelIcons = {
    error: <FaExclamationTriangle />,
    warning: <FaExclamationCircle />,
    info: <FaInfoCircle />,
    debug: <FaBug />
};

const levelColors = {
    error: '#dc2626',
    warning: '#d97706',
    info: '#2563eb',
    debug: '#059669'
};

export default function ErrorLogsPage() {
    const router = useRouter();
    const effectiveRank = useEffectiveRank();
    const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
    const [stats, setStats] = useState<{
        error?: number;
        warning?: number;
        info?: number;
        debug?: number;
    }>({});
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isRemoving, setIsRemoving] = useState(false);
    
    // Filters
    const [filters, setFilters] = useState({
        level: '',
        resolved: '',
        source: '',
        search: ''
    });
    const [showFilters, setShowFilters] = useState(false);
    const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

    // Check if user has permission to view error logs
    useEffect(() => {
        if (effectiveRank && !hasPermission(effectiveRank, PERMISSIONS.VIEW_ERROR_LOGS)) {
            router.push('/adm');
        }
    }, [effectiveRank, router]);

    const fetchErrorLogs = useCallback(async (page = 1) => {
        try {
            setIsLoading(true);
            setError(null);

            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20'
            });

            if (filters.level) params.append('level', filters.level);
            if (filters.resolved) params.append('resolved', filters.resolved);
            if (filters.source) params.append('source', filters.source);
            if (filters.search) params.append('search', filters.search);

            const response = await authenticatedFetch(`/api/error-logs?${params}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch error logs');
            }

            const data: ErrorLogResponse = await response.json();
            setErrorLogs(data.errorLogs || []);
            setStats(data.stats || {});
            setCurrentPage(data.currentPage || 1);
            setTotalPages(data.totalPages || 1);
            setTotalCount(data.totalCount || 0);
        } catch (err) {
            console.error('Error fetching error logs:', err);
            setError('Failed to load error logs');
        } finally {
            setIsLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        if (effectiveRank && hasPermission(effectiveRank, PERMISSIONS.VIEW_ERROR_LOGS)) {
            fetchErrorLogs(currentPage);
        }
    }, [currentPage, filters, effectiveRank, fetchErrorLogs]);

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setCurrentPage(1);
    };

    const handleRemoveAll = async () => {
        const hasFilters = Object.values(filters).some(filter => filter);
        const confirmMessage = hasFilters 
            ? 'Are you sure you want to delete all filtered error logs? This action cannot be undone.'
            : 'Are you sure you want to delete ALL error logs? This action cannot be undone.';
            
        if (!confirm(confirmMessage)) {
            return;
        }

        try {
            setIsRemoving(true);

            const params = new URLSearchParams();
            if (filters.level) params.append('level', filters.level);
            if (filters.resolved) params.append('resolved', filters.resolved);
            if (filters.source) params.append('source', filters.source);
            if (filters.search) params.append('search', filters.search);

            const response = await authenticatedFetch(`/api/error-logs?${params}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete error logs');
            }

            const result = await response.json();
            
            // Show success message
            alert(result.message);

            // Refresh the list
            fetchErrorLogs(1);
            setCurrentPage(1);
        } catch (err) {
            console.error('Error deleting error logs:', err);
            alert('Failed to delete error logs');
        } finally {
            setIsRemoving(false);
        }
    };

    const handleResolveToggle = async (logId: string, resolved: boolean) => {
        try {
            const response = await authenticatedFetch(`/api/error-logs/${logId}`, {
                method: 'PUT',
                body: JSON.stringify({ resolved: !resolved })
            });

            if (!response.ok) {
                throw new Error('Failed to update error log');
            }

            // Refresh the list
            fetchErrorLogs(currentPage);
        } catch (err) {
            console.error('Error updating error log:', err);
        }
    };

    const handleDelete = async (logId: string) => {
        if (!confirm('Are you sure you want to delete this error log?')) {
            return;
        }

        try {
            const response = await authenticatedFetch(`/api/error-logs/${logId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete error log');
            }

            // Refresh the list
            fetchErrorLogs(currentPage);
        } catch (err) {
            console.error('Error deleting error log:', err);
        }
    };

    const toggleExpanded = (logId: string) => {
        setExpandedLogs(prev => {
            const newSet = new Set(prev);
            if (newSet.has(logId)) {
                newSet.delete(logId);
            } else {
                newSet.add(logId);
            }
            return newSet;
        });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    const clearFilters = () => {
        setFilters({
            level: '',
            resolved: '',
            source: '',
            search: ''
        });
        setCurrentPage(1);
    };

    if (!effectiveRank || !hasPermission(effectiveRank, PERMISSIONS.VIEW_ERROR_LOGS)) {
        return (
            <AuthWrapper>
                <div className="access-denied">
                    <h1>Access Denied</h1>
                    <p>You don&apos;t have permission to view error logs.</p>
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
                        <h1>Error Logs</h1>
                        <div className="adm-header-actions">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="adm-btn adm-btn-secondary"
                            >
                                <FaFilter /> Filters
                            </button>
                            <button
                                onClick={() => fetchErrorLogs(currentPage)}
                                className="adm-btn adm-btn-primary"
                                disabled={isLoading}
                            >
                                <TbRefresh /> Refresh
                            </button>
                            <button
                                onClick={handleRemoveAll}
                                className="adm-btn adm-btn-danger"
                                disabled={isLoading || isRemoving || totalCount === 0}
                                title={totalCount === 0 ? "No error logs to remove" : "Remove all error logs (filtered)"}
                            >
                                <FaTrash /> {isRemoving ? 'Removing...' : 'Remove All'}
                            </button>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="error-stats">
                        <div className="stat-item">
                            <span className="stat-label">Total:</span>
                            <span className="stat-value">{totalCount}</span>
                        </div>
                        {(['error', 'warning', 'info', 'debug'] as const).map((level) => (
                            <div key={level} className="stat-item">
                                <div 
                                    className="stat-level-indicator"
                                    style={{ backgroundColor: levelColors[level] }}
                                    title={level.toUpperCase()}
                                >
                                    <span className="stat-level-icon">
                                        {levelIcons[level]}
                                    </span>
                                </div>
                                <span className="stat-value">{stats[level] || 0}</span>
                            </div>
                        ))}
                    </div>

                    {/* Filters */}
                    {showFilters && (
                        <div className="error-filters">
                            <div className="filter-row">
                                <div className="filter-group">
                                    <label>Search:</label>
                                    <input
                                        type="text"
                                        placeholder="Search messages, source, or stack..."
                                        value={filters.search}
                                        onChange={(e) => handleFilterChange('search', e.target.value)}
                                    />
                                </div>
                                <div className="filter-group">
                                    <label>Level:</label>
                                    <div className="level-filter-buttons">
                                        <button
                                            type="button"
                                            className={`level-filter-btn ${filters.level === '' ? 'active' : ''}`}
                                            onClick={() => handleFilterChange('level', '')}
                                        >
                                            All
                                        </button>
                                        {(['error', 'warning', 'info', 'debug'] as const).map((level) => (
                                            <button
                                                key={level}
                                                type="button"
                                                className={`level-filter-btn ${filters.level === level ? 'active' : ''}`}
                                                style={{ 
                                                    backgroundColor: filters.level === level ? levelColors[level] : 'transparent',
                                                    borderColor: levelColors[level],
                                                    color: filters.level === level ? 'white' : levelColors[level]
                                                }}
                                                onClick={() => handleFilterChange('level', level)}
                                                title={level.toUpperCase()}
                                            >
                                                <span className="level-filter-icon">
                                                    {levelIcons[level]}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="filter-group">
                                    <label>Status:</label>
                                    <select
                                        value={filters.resolved}
                                        onChange={(e) => handleFilterChange('resolved', e.target.value)}
                                    >
                                        <option value="">All Status</option>
                                        <option value="false">Unresolved</option>
                                        <option value="true">Resolved</option>
                                    </select>
                                </div>
                                <div className="filter-group">
                                    <label>Source:</label>
                                    <input
                                        type="text"
                                        placeholder="Filter by source..."
                                        value={filters.source}
                                        onChange={(e) => handleFilterChange('source', e.target.value)}
                                    />
                                </div>
                                <button
                                    onClick={clearFilters}
                                    className="adm-btn adm-btn-secondary"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Error display */}
                    {error && (
                        <div className="error-message">
                            <FaExclamationTriangle /> {error}
                        </div>
                    )}

                    {/* Loading state */}
                    {isLoading && (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>Loading error logs...</p>
                        </div>
                    )}

                    {/* Error logs list */}
                    {!isLoading && errorLogs.length > 0 && (
                        <div className="error-logs-list">
                            {errorLogs.map((log) => (
                                <div
                                    key={log._id}
                                    className={`error-log-item ${log.level} ${log.resolved ? 'resolved' : ''}`}
                                >
                                    <div className="error-log-header">
                                        <div 
                                            className="error-log-level"
                                            style={{ backgroundColor: levelColors[log.level] }}
                                            title={log.level.toUpperCase()}
                                        >
                                            <span className="level-icon">
                                                {levelIcons[log.level]}
                                            </span>
                                        </div>
                                        <div className="error-log-message">
                                            <h3>{log.message}</h3>
                                            <div className="error-log-meta">
                                                <span className="timestamp">{formatDate(log.createdAt)}</span>
                                                {log.source && <span className="source">Source: {log.source}</span>}
                                                {log.userId && (
                                                    <span className="user">
                                                        User: {log.userId.name} ({log.userId.rank})
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="error-log-actions">
                                            <button
                                                onClick={() => toggleExpanded(log._id)}
                                                className="action-btn"
                                                title="View details"
                                            >
                                                {expandedLogs.has(log._id) ? <FaEyeSlash /> : <FaEye />}
                                            </button>
                                            <button
                                                onClick={() => handleResolveToggle(log._id, log.resolved)}
                                                className={`action-btn ${log.resolved ? 'resolved' : 'unresolved'}`}
                                                title={log.resolved ? 'Mark as unresolved' : 'Mark as resolved'}
                                            >
                                                {log.resolved ? <FaTimes /> : <FaCheck />}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(log._id)}
                                                className="action-btn delete"
                                                title="Delete error log"
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Expanded details */}
                                    {expandedLogs.has(log._id) && (
                                        <div className="error-log-details">
                                            {log.stack && (
                                                <div className="detail-section">
                                                    <h4>Stack Trace:</h4>
                                                    <pre className="stack-trace">{log.stack}</pre>
                                                </div>
                                            )}
                                            
                                            <div className="detail-section">
                                                <h4>Additional Information:</h4>
                                                <div className="detail-grid">
                                                    {log.ipAddress && (
                                                        <div className="detail-item">
                                                            <span className="detail-label">IP Address:</span>
                                                            <span className="detail-value">{log.ipAddress}</span>
                                                        </div>
                                                    )}
                                                    {log.userAgent && (
                                                        <div className="detail-item">
                                                            <span className="detail-label">User Agent:</span>
                                                            <span className="detail-value">{log.userAgent}</span>
                                                        </div>
                                                    )}
                                                    {log.url && (
                                                        <div className="detail-item">
                                                            <span className="detail-label">URL:</span>
                                                            <span className="detail-value">{log.url}</span>
                                                        </div>
                                                    )}
                                                    {log.tags && log.tags.length > 0 && (
                                                        <div className="detail-item">
                                                            <span className="detail-label">Tags:</span>
                                                            <span className="detail-value">
                                                                {log.tags.map(tag => (
                                                                    <span key={tag} className="tag">{tag}</span>
                                                                ))}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {log.resolved && log.resolvedBy && (
                                                <div className="detail-section">
                                                    <h4>Resolution Info:</h4>
                                                    <p>
                                                        Resolved by <strong>{log.resolvedBy.name}</strong> on{' '}
                                                        {formatDate(log.resolvedAt!)}
                                                    </p>
                                                </div>
                                            )}

                                            {log.metadata && Object.keys(log.metadata).length > 0 && (
                                                <div className="detail-section">
                                                    <h4>Metadata:</h4>
                                                    <pre className="metadata">{JSON.stringify(log.metadata, null, 2)}</pre>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Empty state */}
                    {!isLoading && errorLogs.length === 0 && (
                        <div className="empty-state">
                            <FaInfoCircle />
                            <h3>No error logs found</h3>
                            <p>
                                {Object.values(filters).some(filter => filter) 
                                    ? 'Try adjusting your filters to see more results.'
                                    : 'No errors have been logged yet.'}
                            </p>
                        </div>
                    )}

                    {/* Pagination */}
                    {!isLoading && errorLogs.length > 0 && totalPages > 1 && (
                        <Pagination
                            totalItems={totalCount}
                            itemsPerPage={20}
                            currentPage={currentPage}
                            onPageChange={setCurrentPage}
                        />
                    )}
                </div>
            </div>
        </AuthWrapper>
    );
}