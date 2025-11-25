"use client";

import { useEffect, useState } from "react";
import { FiFilter, FiX } from "react-icons/fi";
import { authenticatedFetch } from "../../../src/utils/apiConfig";
import { getVisibleSessionUsers } from "../../../src/utils/permissions";

interface User {
    _id: string;
    name: string;
    mail: string;
    rank: string;
}

interface Filters {
    userId: string;
    activeOnly: boolean;
    page: number;
    limit: number;
}

interface SessionFiltersProps {
    filters: Filters;
    onFiltersChange: (newFilters: Partial<Filters>) => void;
    userRank: string;
}

export default function SessionFilters({ filters, onFiltersChange, userRank }: SessionFiltersProps) {
    const [users, setUsers] = useState<User[]>([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    // Fetch users for filter dropdown
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setUsersLoading(true);
                const response = await authenticatedFetch('/api/users');
                
                if (response.ok) {
                    const userData = await response.json();
                    // Filter users based on current user's permissions
                    const visibleRanks = getVisibleSessionUsers(userRank);
                    const filteredUsers = userData.filter((user: User) => 
                        visibleRanks.includes(user.rank)
                    );
                    setUsers(filteredUsers);
                }
            } catch (error) {
                console.error('Error fetching users:', error);
            } finally {
                setUsersLoading(false);
            }
        };

        fetchUsers();
    }, [userRank]);

    const handleUserChange = (userId: string) => {
        onFiltersChange({ userId });
    };

    const handleActiveOnlyChange = (activeOnly: boolean) => {
        onFiltersChange({ activeOnly });
    };

    const handleLimitChange = (limit: number) => {
        onFiltersChange({ limit });
    };

    const clearFilters = () => {
        onFiltersChange({
            userId: '',
            activeOnly: true,
            page: 1
        });
    };

    const hasActiveFilters = filters.userId || !filters.activeOnly;

    return (
        <div className="session-filters">
            <div className="filters-header">
                <button 
                    className={`filters-toggle ${showFilters ? 'active' : ''}`}
                    onClick={() => setShowFilters(!showFilters)}
                >
                    <FiFilter />
                    Filters
                    {hasActiveFilters && <span className="active-indicator"></span>}
                </button>

                {hasActiveFilters && (
                    <button className="clear-filters" onClick={clearFilters}>
                        <FiX />
                        Clear Filters
                    </button>
                )}
            </div>

            {showFilters && (
                <div className="filters-content">
                    <div className="filter-row">
                        <div className="filter-group">
                            <label htmlFor="user-select">Filter by User</label>
                            <select
                                id="user-select"
                                value={filters.userId}
                                onChange={(e) => handleUserChange(e.target.value)}
                                disabled={usersLoading}
                            >
                                <option value="">All Users</option>
                                {users.map((user) => (
                                    <option key={user._id} value={user._id}>
                                        {user.name} ({user.rank})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-group">
                            <label htmlFor="active-only">Session Status</label>
                            <select
                                id="active-only"
                                value={filters.activeOnly ? 'active' : 'all'}
                                onChange={(e) => handleActiveOnlyChange(e.target.value === 'active')}
                            >
                                <option value="active">Active Only</option>
                                <option value="all">All Sessions</option>
                            </select>
                        </div>

                        <div className="filter-group">
                            <label htmlFor="limit-select">Sessions per Page</label>
                            <select
                                id="limit-select"
                                value={filters.limit}
                                onChange={(e) => handleLimitChange(parseInt(e.target.value))}
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>
                    </div>

                    <div className="filter-summary">
                        <p>
                            Showing {filters.activeOnly ? 'active' : 'all'} sessions
                            {filters.userId && users.length > 0 && (
                                <span>
                                    {' '}for {users.find(u => u._id === filters.userId)?.name || 'selected user'}
                                </span>
                            )}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
} 