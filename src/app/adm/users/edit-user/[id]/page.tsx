"use client";

import { useEffect, useState } from "react";
import AdmNavbar from "../../../../../../components/adm/AdmNavbar";
import EditUserForm from "../../../../../../components/adm/users/EditUserForm";
import AuthWrapper from "../../../../../../components/adm/AuthWrapper";
import { getApiUrl } from '../../../../../utils/apiConfig';

interface User {
    _id: string;
    name: string;
    mail: string;
    rank: string;
}

interface PageParams {
    params: {
        id: string;
    };
}

export default function EditUser({ params }: PageParams) {
    const userId = typeof params.id === 'string' ? params.id : '';
    
    const [userData, setUserData] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!isMounted) return;

        const fetchUser = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch(getApiUrl(`/api/users/${userId}`), {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                
                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.error || 'Failed to fetch user');
                }
                
                const data = await res.json();
                setUserData(data);
                setError(null);
            } catch (error) {
                console.error('Error:', error);
                setError(error instanceof Error ? error.message : 'Failed to fetch user');
            } finally {
                setLoading(false);
            }
        };

        if (userId) fetchUser();
    }, [userId, isMounted]);

    if (!isMounted) {
        return (
            <AuthWrapper>
                <div className="flex column">
                    <AdmNavbar />
                    <div id="main-content">
                        <div aria-hidden="true"></div>
                    </div>
                </div>
            </AuthWrapper>
        );
    }

    if (loading) return (
        <AuthWrapper>
            <div className="flex">
                <AdmNavbar />
                <div id="main-content">
                    <div className="loading-text">Loading...</div>
                </div>
            </div>
        </AuthWrapper>
    );

    if (error) return (
        <AuthWrapper>
            <div className="flex">
                <AdmNavbar />
                <div id="main-content">
                    <div className="error-text">Error: {error}</div>
                </div>
            </div>
        </AuthWrapper>
    );

    if (!userData) return (
        <AuthWrapper>
            <div className="flex">
                <AdmNavbar />
                <div id="main-content">
                    <div className="error-text">User not found</div>
                </div>
            </div>
        </AuthWrapper>
    );

    return (
        <AuthWrapper>
            <div className="flex">
                <AdmNavbar />
                <div id="main-content">
                    <h1 className="adm-title">Edit User</h1>
                    <EditUserForm 
                        id={userId}
                        name={userData.name}
                        email={userData.mail}
                        rank={userData.rank}
                    />
                </div>
            </div>
        </AuthWrapper>
    );
}