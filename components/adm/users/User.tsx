import { useState, useEffect } from "react";
    import { FaUserEdit, FaCrown, FaUserTie, FaUser, FaUserShield } from "react-icons/fa";
import { TbUser } from "react-icons/tb";
import RemoveBtn from "./RemoveBtn";
import Link from "next/link";
import { getApiUrl } from "../../../src/utils/apiConfig";
import Pagination from "../Pagination";
import { useEffectiveRank } from "../../../hooks/useViewAs";
import { hasPermission, PERMISSIONS } from "../../../src/utils/permissions";

interface User {
    _id: string;
    name: string;
    mail: string;
    rank: string;
}

// Function to get rank icon
const getRankIcon = (rank: string) => {
    switch (rank) {
        case "Developer":
            return <FaCrown className="adm-item-icon" style={{ color: "#ff6b6b" }} />;
        case "Eigenaar":
            return <FaUserShield className="adm-item-icon" style={{ color: "#4ecdc4" }} />;
        case "Manager":
            return <FaUserTie className="adm-item-icon" style={{ color: "#45b7d1" }} />;
        case "Werknemer":
            return <FaUser className="adm-item-icon" style={{ color: "#96ceb4" }} />;
        default:
            return <TbUser className="adm-item-icon" />;
    }
};

// Function to get rank color
const getRankColor = (rank: string) => {
    switch (rank) {
        case "Developer":
            return "#ff6b6b";
        case "Eigenaar":
            return "#4ecdc4";
        case "Manager":
            return "#45b7d1";
        case "Werknemer":
            return "#96ceb4";
        default:
            return "#666";
    }
};

const getUser = async (effectiveRank: string | null) => {
    console.log("Fetching user data with effective rank:", effectiveRank);
    try {
        const token = localStorage.getItem("adminToken");
        const res = await fetch(getApiUrl('/api/users'), {
            cache: 'no-store',
            headers: {
                'Authorization': `Bearer ${token}`,
                'X-Simulated-Rank': effectiveRank || '' // Send simulated rank to server for filtering
            }
        });

        if (!res.ok) {
            throw new Error(res.statusText);
        }
        return res.json();
    } catch (error) {
        console.log(error);
        return { users: [] };
    }
};

const User = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const effectiveRank = useEffectiveRank();
    const itemsPerPage = 10;

    // Check if user can edit users
    const canEditUsers = effectiveRank && hasPermission(effectiveRank, PERMISSIONS.EDIT_USERS);

    useEffect(() => {
        console.log("User component rendered with effective rank:", effectiveRank);

        const fetchData = async () => {
            try {
                setLoading(true);
                
                if (effectiveRank) {
                    // Filter users based on effective rank
                    const { getVisibleRanks } = await import("../../../src/utils/permissions");
                    const visibleRanks = getVisibleRanks(effectiveRank);
                    
                    const data = await getUser(effectiveRank);
                    const allUsers = Array.isArray(data) ? data : data?.users || [];
                    
                    // Client-side filtering for ViewAs simulation
                    const filteredUsers = allUsers.filter((user: User) => visibleRanks.includes(user.rank));
                    setUsers(filteredUsers);
                } else {
                    const data = await getUser(null);
                    setUsers(Array.isArray(data) ? data : data?.users || []);
                }
                
                setError(null);
            } catch (err) {
                setError("Failed to load users");
                console.error("Error fetching users:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [effectiveRank]);
    
    // Get current users for the current page
    const indexOfLastUser = currentPage * itemsPerPage;
    const indexOfFirstUser = indexOfLastUser - itemsPerPage;
    const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);
    
    // Change page
    const handlePageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber);
    };

    if (loading) {
        return (
            <div className="loading-text">
                Loading users...
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-text">
                {error}
            </div>
        );
    }

    return (
        <>
            {users.length > 0 ? (
                <>
                    {currentUsers.map((user) => (
                        <div className="adm-item" key={user._id}>
                            <div className="adm-item-left">
                                {getRankIcon(user.rank)}
                                <div style={{ marginLeft: "1rem" }}>
                                    <h2 className="adm-item-name">{user.name}</h2>
                                </div>
                            </div>
                            <div className="user-rank-badge-container">
                            <span 
                                        className="user-rank-badge"
                                        style={{
                                            backgroundColor: getRankColor(user.rank),
                                            color: "white",
                                            padding: "0.2rem 0.5rem",
                                            borderRadius: "12px",
                                            fontSize: "0.75rem",
                                            fontWeight: "600",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.5px"
                                        }}
                                    >
                                        {user.rank}
                                    </span>
                            </div>
                            <div className="adm-item-details">
                                <div className="adm-item-email">
                                    <p>{user.mail}</p>
                                </div>
                            </div>
                            <div className="adm-item-buttons">
                                {canEditUsers && (
                                    <Link href={`/adm/users/edit-user/${user._id}`}>
                                        <FaUserEdit title="Edit User" />
                                    </Link>
                                )}
                                <RemoveBtn id={user._id} />
                            </div>
                        </div>
                    ))}
                    
                    <Pagination 
                        totalItems={users.length}
                        itemsPerPage={itemsPerPage}
                        currentPage={currentPage}
                        onPageChange={handlePageChange}
                    />
                </>
            ) : (
                <p>Geen gebruikers gevonden.</p>
            )}
        </>
    );
};

export default User;