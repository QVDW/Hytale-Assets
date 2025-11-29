"use client";

import { useState, useEffect, useCallback } from "react";
import AdmNavbar from "../../../../components/adm/AdmNavbar";
import FrontendAdmin from "../../../../components/adm/frontend-admins/FrontendAdmin";
import AuthWrapper from "../../../../components/adm/AuthWrapper";
import { getApiUrl } from "../../../../src/utils/apiConfig";
import { FaUserShield, FaCheckCircle, FaTimesCircle, FaSearch, FaUserPlus, FaUser } from "react-icons/fa";

interface SearchUser {
    user_id: string;
    username: string;
    email: string;
    user_role: string;
    join_date: string;
    last_login: string | null;
    profile_picture: string;
    status: string;
}

export default function FrontendAdmins() {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [confirmDialog, setConfirmDialog] = useState<{ show: boolean; user: SearchUser | null }>({ show: false, user: null });

    // Search for users
    const handleSearch = useCallback(async (e?: React.FormEvent) => {
        if (e) {
            e.preventDefault();
        }
        
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        setSearchLoading(true);
        setError(null);

        try {
            const res = await fetch(getApiUrl(`/api/user-auth/search?q=${encodeURIComponent(searchQuery.trim())}`));
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to search users');
            }

            setSearchResults(data.users || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to search users');
            setSearchResults([]);
            setTimeout(() => setError(null), 5000);
        } finally {
            setSearchLoading(false);
        }
    }, [searchQuery]);

    // Show confirmation dialog
    const handleAddAdminClick = (user: SearchUser) => {
        setConfirmDialog({ show: true, user });
    };

    // Confirm and add admin
    const handleConfirmAddAdmin = async () => {
        if (!confirmDialog.user) return;

        const user_id = confirmDialog.user.user_id;
        setLoading(true);
        setError(null);
        setMessage(null);
        setConfirmDialog({ show: false, user: null });

        try {
            const res = await fetch(getApiUrl('/api/user-auth/admin'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ user_id })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to add admin');
            }

            setMessage(data.message || `Successfully added ${data.user?.username || 'user'} as admin`);
            setTimeout(() => setMessage(null), 5000);
            
            // Refresh search results and admin list
            if (searchQuery.trim()) {
                handleSearch();
            }
            window.location.reload();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add admin');
            setTimeout(() => setError(null), 5000);
        } finally {
            setLoading(false);
        }
    };

    // Cancel confirmation
    const handleCancelAddAdmin = () => {
        setConfirmDialog({ show: false, user: null });
    };

    // Auto-search on query change (debounced)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery.trim().length >= 2) {
                handleSearch();
            } else {
                setSearchResults([]);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery, handleSearch]);

    return (
        <AuthWrapper>
            <div className="flex column">
                <AdmNavbar />
                <div id="main-content">
                    <div className="adm-header">
                        <h1 className="adm-title">
                            <FaUserShield style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                            Frontend Admin Accounts
                        </h1>
                    </div>
                    
                    {message && (
                        <div style={{
                            padding: '0.75rem',
                            backgroundColor: '#4caf50',
                            color: 'white',
                            borderRadius: '4px',
                            marginBottom: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <FaCheckCircle /> {message}
                        </div>
                    )}
                    
                    {error && (
                        <div style={{
                            padding: '0.75rem',
                            backgroundColor: '#f44336',
                            color: 'white',
                            borderRadius: '4px',
                            marginBottom: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <FaTimesCircle /> {error}
                        </div>
                    )}

                    <div style={{
                        backgroundColor: '#f5f5f5',
                        padding: '1.5rem',
                        borderRadius: '8px',
                        marginBottom: '2rem',
                        border: '1px solid #ddd'
                    }}>
                        <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Search Users</h2>
                        <p style={{ marginBottom: '1rem', color: '#666', fontSize: '0.875rem' }}>
                            Search for users by ID, username, or email. Then add them as admin from the search results.
                        </p>
                        
                        <form onSubmit={handleSearch} style={{ marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <div style={{ flex: 1, position: 'relative' }}>
                                    <FaSearch style={{
                                        position: 'absolute',
                                        left: '0.75rem',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        color: '#666'
                                    }} />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search by user ID, username, or email..."
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px',
                                            fontSize: '1rem'
                                        }}
                                        disabled={searchLoading}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={searchLoading || !searchQuery.trim()}
                                    style={{
                                        padding: '0.75rem 1.5rem',
                                        backgroundColor: searchLoading ? '#ccc' : '#2196F3',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: searchLoading ? 'not-allowed' : 'pointer',
                                        fontSize: '1rem',
                                        fontWeight: '500',
                                        whiteSpace: 'nowrap',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    <FaSearch /> {searchLoading ? 'Searching...' : 'Search'}
                                </button>
                            </div>
                        </form>

                        {searchResults.length > 0 && (
                            <div>
                                <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: '600' }}>
                                    Search Results ({searchResults.length})
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {searchResults.map((user) => (
                                        <div
                                            key={user.user_id}
                                            style={{
                                                backgroundColor: 'white',
                                                padding: '1rem',
                                                borderRadius: '6px',
                                                border: '1px solid #ddd',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}
                                        >
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                                    <FaUser style={{ color: user.user_role === 'admin' ? '#ff6b6b' : '#666' }} />
                                                    <div>
                                                        <div style={{ fontWeight: '600', fontSize: '1rem' }}>
                                                            {user.username}
                                                            {user.user_role === 'admin' && (
                                                                <span style={{
                                                                    marginLeft: '0.5rem',
                                                                    padding: '0.2rem 0.5rem',
                                                                    backgroundColor: '#ff6b6b',
                                                                    color: 'white',
                                                                    borderRadius: '12px',
                                                                    fontSize: '0.75rem',
                                                                    fontWeight: '600'
                                                                }}>
                                                                    ADMIN
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.25rem' }}>
                                                            {user.email}
                                                        </div>
                                                        <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.25rem' }}>
                                                            ID: {user.user_id}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                {user.user_role === 'admin' ? (
                                                    <span style={{
                                                        padding: '0.5rem 1rem',
                                                        backgroundColor: '#e0e0e0',
                                                        color: '#666',
                                                        borderRadius: '4px',
                                                        fontSize: '0.875rem',
                                                        fontWeight: '500'
                                                    }}>
                                                        Already Admin
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={() => handleAddAdminClick(user)}
                                                        disabled={loading}
                                                        style={{
                                                            padding: '0.5rem 1rem',
                                                            backgroundColor: '#4caf50',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            cursor: loading ? 'not-allowed' : 'pointer',
                                                            fontSize: '0.875rem',
                                                            fontWeight: '500',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '0.5rem',
                                                            transition: 'background-color 0.2s'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            if (!loading) {
                                                                e.currentTarget.style.backgroundColor = '#45a049';
                                                            }
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            if (!loading) {
                                                                e.currentTarget.style.backgroundColor = '#4caf50';
                                                            }
                                                        }}
                                                    >
                                                        <FaUserPlus /> Add Admin
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {searchQuery.trim() && searchResults.length === 0 && !searchLoading && (
                            <p style={{ color: '#666', textAlign: 'center', padding: '2rem' }}>
                                No users found matching "{searchQuery}"
                            </p>
                        )}
                    </div>

                    {/* Confirmation Dialog */}
                    {confirmDialog.show && confirmDialog.user && (
                        <div style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1000
                        }}>
                            <div style={{
                                backgroundColor: 'white',
                                padding: '2rem',
                                borderRadius: '8px',
                                maxWidth: '500px',
                                width: '90%',
                                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                            }}>
                                <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '600' }}>
                                    Confirm Add Admin
                                </h3>
                                <p style={{ marginBottom: '1.5rem', color: '#666' }}>
                                    Are you sure you want to make <strong>{confirmDialog.user.username}</strong> ({confirmDialog.user.email}) an admin?
                                </p>
                                <p style={{ marginBottom: '1.5rem', fontSize: '0.875rem', color: '#999' }}>
                                    User ID: {confirmDialog.user.user_id}
                                </p>
                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                    <button
                                        onClick={handleCancelAddAdmin}
                                        disabled={loading}
                                        style={{
                                            padding: '0.75rem 1.5rem',
                                            backgroundColor: '#e0e0e0',
                                            color: '#333',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: loading ? 'not-allowed' : 'pointer',
                                            fontSize: '1rem',
                                            fontWeight: '500'
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleConfirmAddAdmin}
                                        disabled={loading}
                                        style={{
                                            padding: '0.75rem 1.5rem',
                                            backgroundColor: loading ? '#ccc' : '#4caf50',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: loading ? 'not-allowed' : 'pointer',
                                            fontSize: '1rem',
                                            fontWeight: '500'
                                        }}
                                    >
                                        {loading ? 'Adding...' : 'Yes, Add Admin'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div style={{ marginBottom: '1rem' }}>
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Current Admin Accounts</h2>
                    </div>
                    
                    <div className="adm-items">
                        <FrontendAdmin />
                    </div>
                </div>
            </div>
        </AuthWrapper>
    );
}

