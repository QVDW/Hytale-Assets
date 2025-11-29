import { useState, useEffect } from "react";
import { FaUserShield, FaTrash, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { getApiUrl } from "../../../src/utils/apiConfig";
import Pagination from "../Pagination";

interface FrontendAdmin {
    user_id: string;
    username: string;
    email: string;
    user_role: string;
    join_date: string;
    last_login: string | null;
    profile_picture: string;
}

const getAdmins = async () => {
    try {
        const res = await fetch(getApiUrl('/api/user-auth/admin'), {
            cache: 'no-store'
        });

        if (!res.ok) {
            throw new Error(res.statusText);
        }
        const data = await res.json();
        return data.admins || [];
    } catch (error) {
        console.log(error);
        return [];
    }
};

const FrontendAdmin = () => {
    const [admins, setAdmins] = useState<FrontendAdmin[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const itemsPerPage = 10;

    const fetchAdmins = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getAdmins();
            setAdmins(data);
        } catch (err) {
            setError("Failed to load admin accounts");
            console.error("Error fetching admins:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdmins();
    }, []);

    const handleRemoveAdmin = async (user_id: string, username: string) => {
        if (!confirm(`Are you sure you want to remove admin status from ${username}?`)) {
            return;
        }

        try {
            const res = await fetch(getApiUrl('/api/user-auth/admin'), {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ user_id })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to remove admin');
            }

            setMessage(`Successfully removed admin status from ${username}`);
            setTimeout(() => setMessage(null), 3000);
            fetchAdmins();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to remove admin');
            setTimeout(() => setError(null), 5000);
        }
    };

    // Get current admins for the current page
    const indexOfLastAdmin = currentPage * itemsPerPage;
    const indexOfFirstAdmin = indexOfLastAdmin - itemsPerPage;
    const currentAdmins = admins.slice(indexOfFirstAdmin, indexOfLastAdmin);

    // Change page
    const handlePageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber);
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Never';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="loading-text">
                Loading admin accounts...
            </div>
        );
    }

    return (
        <>
            {message && (
                <div className="success-message" style={{
                    padding: '1rem',
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
                <div className="error-message" style={{
                    padding: '1rem',
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
            {admins.length > 0 ? (
                <>
                    {currentAdmins.map((admin) => (
                        <div className="adm-item" key={admin.user_id}>
                            <div className="adm-item-left">
                                <FaUserShield className="adm-item-icon" style={{ color: "#ff6b6b" }} />
                                <div style={{ marginLeft: "1rem" }}>
                                    <h2 className="adm-item-name">{admin.username}</h2>
                                    <p className="adm-item-email" style={{ marginTop: "0.25rem", fontSize: "0.875rem", color: "#666" }}>
                                        {admin.email}
                                    </p>
                                </div>
                            </div>
                            <div className="adm-item-details">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    <p style={{ fontSize: "0.875rem" }}>
                                        <strong>User ID:</strong> {admin.user_id}
                                    </p>
                                    <p style={{ fontSize: "0.875rem" }}>
                                        <strong>Joined:</strong> {formatDate(admin.join_date)}
                                    </p>
                                    <p style={{ fontSize: "0.875rem" }}>
                                        <strong>Last Login:</strong> {formatDate(admin.last_login)}
                                    </p>
                                </div>
                            </div>
                            <div className="adm-item-buttons">
                                <button
                                    onClick={() => handleRemoveAdmin(admin.user_id, admin.username)}
                                    className="adm-remove-btn"
                                    title="Remove Admin Status"
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#f44336',
                                        cursor: 'pointer',
                                        padding: '0.5rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: '4px',
                                        transition: 'background-color 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(244, 67, 54, 0.1)'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    <FaTrash />
                                </button>
                            </div>
                        </div>
                    ))}
                    
                    <Pagination 
                        totalItems={admins.length}
                        itemsPerPage={itemsPerPage}
                        currentPage={currentPage}
                        onPageChange={handlePageChange}
                    />
                </>
            ) : (
                <p>No admin accounts found.</p>
            )}
        </>
    );
};

export default FrontendAdmin;

