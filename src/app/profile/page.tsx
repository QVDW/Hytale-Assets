"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Navbar from "../../../components/Navbar";
import "../../styles/auth.scss";

interface UserData {
    user_id: string;
    username: string;
    profile_picture: string;
}

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            if (typeof window === "undefined") return;

            const token = localStorage.getItem("token");

            if (!token) {
                router.push("/login");
                return;
            }

            try {
                const response = await fetch("/api/user-auth/me", {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });

                if (response.status === 401) {
                    localStorage.removeItem("token");
                    router.push("/login");
                    return;
                }

                if (!response.ok) {
                    throw new Error("Failed to fetch user data");
                }

                const userData = await response.json();
                setUser({
                    user_id: userData.user_id,
                    username: userData.username,
                    profile_picture: userData.profile_picture
                });
            } catch (error) {
                console.error("Error fetching user:", error);
                router.push("/login");
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [router]);

    if (loading) {
        return (
            <div className="profile-page">
                <Navbar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
                <div className="profile-loading-container">
                    <div className="loading-spinner">Loading...</div>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="profile-page">
            <Navbar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
            <div className="profile-container">
                <div className="profile-header-section">
                    <div className="profile-picture-wrapper">
                        <Image
                            src={user.profile_picture}
                            alt={`${user.username}'s profile picture`}
                            width={150}
                            height={150}
                            className="profile-picture-large"
                        />
                    </div>
                    <div className="profile-info">
                        <h1 className="profile-username">{user.username}</h1>
                    </div>
                </div>

                <div className="profile-assets-section">
                    <h2 className="profile-section-title">Assets</h2>
                    <div className="profile-assets-container">
                        {/* Assets will be displayed here later */}
                        <p className="profile-assets-placeholder">No assets yet</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

