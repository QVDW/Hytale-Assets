'use client';

import { IoTrashOutline } from "react-icons/io5";
import { useRouter } from "next/navigation";
import { getApiUrl } from "../../../src/utils/apiConfig";
import { useState, useEffect } from "react";
import { useEffectiveRank } from "../../../hooks/useViewAs";

interface RemoveBtnProps {
  id: string;
}

export default function RemoveBtn({ id }: RemoveBtnProps) {
    const router = useRouter();
    const [hasDeletePermission, setHasDeletePermission] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const effectiveRank = useEffectiveRank();

    useEffect(() => {
        const checkPermissions = async () => {
            try {
                if (effectiveRank) {
                    // Use effective rank for permission check
                    const { hasPermission, PERMISSIONS } = await import("../../../src/utils/permissions");
                    const canDelete = hasPermission(effectiveRank, PERMISSIONS.DELETE_USERS);
                    setHasDeletePermission(canDelete);
                } else {
                    // Fallback to actual user permissions
                    const token = localStorage.getItem("token");
                    const res = await fetch(getApiUrl("/api/auth/me"), {
                        headers: {
                            "Authorization": `Bearer ${token}`
                        }
                    });

                    if (res.ok) {
                        const userData = await res.json();
                        
                        const { hasPermission, PERMISSIONS } = await import("../../../src/utils/permissions");
                        const canDelete = hasPermission(userData.rank, PERMISSIONS.DELETE_USERS);
                        setHasDeletePermission(canDelete);
                    }
                }
            } catch (error) {
                console.error("Error checking permissions:", error);
            }
        };

        checkPermissions();
    }, [effectiveRank]);

    const removeUser = async () => {
        if (!hasDeletePermission) {
            alert("You don't have permission to delete users.");
            return;
        }

        const confirmed = confirm("Weet je zeker dat je deze gebruiker wilt verwijderen?");
        
        if (confirmed) {
            setIsLoading(true);
            try {
                const token = localStorage.getItem("token");
                const res = await fetch(getApiUrl(`/api/users?id=${id}`), {
                    method: "DELETE",
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });

                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.error || 'Failed to delete user');
                }

                // Refresh the page to update the user list
                router.refresh();
                window.location.reload();
            } catch (error) {
                console.error("Error deleting user:", error);
                alert(`Error deleting user: ${error instanceof Error ? error.message : 'Unknown error'}`);
            } finally {
                setIsLoading(false);
            }
        }
    };

    // Don't show the button if user doesn't have delete permission
    if (!hasDeletePermission) {
        return null;
    }
            
    return (
        <button 
            onClick={removeUser} 
            id="remove-btn"
            disabled={isLoading}
            title="Delete User"
        >
            <IoTrashOutline />
        </button>
    );
}