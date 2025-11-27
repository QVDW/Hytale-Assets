"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Navbar from "../../../components/Navbar";
import "../../styles/auth.scss";
import { BsThreeDots } from "react-icons/bs";
import { FaDownload, FaEye } from "react-icons/fa";
import { FaEdit } from "react-icons/fa";
import { IoMailOutline } from "react-icons/io5";

interface UserData {
    user_id: string;
    username: string;
    profile_picture: string;
}

interface Asset {
    asset_id: string;
    title: string;
    description: string;
    preview_url: string | null;
    file_url: string;
    download_count: number;
    upload_date: string;
    category: {
        category_id: string;
        name: string;
    };
}

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState<UserData | null>(null);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const [assetsLoading, setAssetsLoading] = useState(true);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Placeholder progress value for profile level
    const progress = 70;
    const radius = 90;
    const stroke = 8;
    const normalizedRadius = radius - stroke / 2;
    const circumference = 2 * Math.PI * normalizedRadius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    useEffect(() => {
        const fetchUser = async () => {
            if (typeof window === "undefined") return;

            const token = localStorage.getItem("userToken");

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
                    localStorage.removeItem("userToken");
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

    useEffect(() => {
        const fetchAssets = async () => {
            if (!user?.user_id) return;

            try {
                const response = await fetch(`/api/assets/user/${user.user_id}`);
                
                if (response.ok) {
                    const data = await response.json();
                    setAssets(data.assets || []);
                } else {
                    console.error("Failed to fetch assets");
                    setAssets([]);
                }
            } catch (error) {
                console.error("Error fetching assets:", error);
                setAssets([]);
            } finally {
                setAssetsLoading(false);
            }
        };

        if (user?.user_id) {
            fetchAssets();
        }
    }, [user]);

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
                <div className="profile-info-section">
                    <div className="profile-header-content">
                        <div className="profile-header-settings">
                            <button className="profile-header-settings-button">
                                <IoMailOutline />
                            </button>
                            <button className="profile-header-settings-button">
                                <BsThreeDots />
                            </button>
                        </div>
                    </div>
                    <div className="profile-wrapper">
                        <div className="profile-avatar-progress">
                            <svg
                                height={radius * 2}
                                width={radius * 2}
                                className="profile-progress-ring"
                            >
                                <circle
                                    className="profile-progress-ring-bg"
                                    r={normalizedRadius}
                                    cx={radius}
                                    cy={radius}
                                />
                                <circle
                                    className="profile-progress-ring-bar"
                                    r={normalizedRadius}
                                    cx={radius}
                                    cy={radius}
                                    strokeLinecap="round"
                                    style={{
                                        strokeDasharray: `${circumference} ${circumference}`,
                                        strokeDashoffset,
                                    }}
                                />
                            </svg>
                            <div className="profile-avatar-image">
                                <Image
                                    src={user.profile_picture}
                                    alt={`${user.username}'s profile picture`}
                                    width={150}
                                    height={150}
                                    className="profile-picture-large"
                                />
                            </div>
                        </div>
                        <div className="profile-info">
                            <h1 className="profile-username">{user.username}</h1>
                        </div>
                    </div>
                    {/* <div className="profile-level-section">
                        <h2 className="profile-level-section-title">Level</h2>
                        <div className="profile-level-container">
                            <p className="profile-level-text">1</p>
                        </div>
                    </div> */}
                    {/* <div className="profile-follow-section-container">
                        <div className="profile-follow-section">
                            <h3 className="profile-follow-item-title">Followers</h3>
                            <p className="profile-follow-item-value">100</p>
                        </div>
                        <div className="profile-follow-section">
                            <h3 className="profile-follow-item-title">Following</h3>
                            <p className="profile-follow-item-value">100</p>
                        </div>
                    </div> */}
                    <div className="profile-stats-section">
                        <div className="profile-stats-container">
                        <div className="profile-stats-item">
                                <h3 className="profile-stats-item-title">Level</h3>
                                <p className="profile-stats-item-value">23</p>
                            </div>
                            <div className="profile-stats-item">
                                <h3 className="profile-stats-item-title">Assets</h3>
                                <p className="profile-stats-item-value">{assets.length}</p>
                            </div>
                            <div className="profile-stats-item">
                                <h3 className="profile-stats-item-title">Reviews</h3>
                                <p className="profile-stats-item-value">74</p>
                            </div>
                        </div>
                    </div>
                    <div className="profile-badge-section">
                        <h2 className="profile-badge-section-title">Badges</h2>
                        <div className="profile-badge-container">
                            <Image src="/badges/plugin-badge.jpg" alt="Badge 1" width={65} height={65} />
                            <Image src="/badges/art-badge.jpg" alt="Badge 2" width={65} height={65} />
                            <Image src="/badges/review-badge.jpg" alt="Badge 3" width={65} height={65} />
                            <Image src="/badges/plugin-badge.jpg" alt="Badge 1" width={65} height={65} />
                            <Image src="/badges/art-badge.jpg" alt="Badge 2" width={65} height={65} />
                            <Image src="/badges/review-badge.jpg" alt="Badge 3" width={65} height={65} />
                            <Image src="/badges/plugin-badge.jpg" alt="Badge 1" width={65} height={65} />
                            <Image src="/badges/art-badge.jpg" alt="Badge 2" width={65} height={65} />
                            <Image src="/badges/review-badge.jpg" alt="Badge 3" width={65} height={65} />
                        </div>
                    </div>
                </div>

                <div className="profile-assets-section">
                    <div className="profile-assets-container">
                        {assetsLoading ? (
                            <div className="profile-assets-loading">
                                <div className="loading-spinner">Loading assets...</div>
                            </div>
                        ) : assets.length === 0 ? (
                            <div className="profile-assets-empty">
                                <p>No assets uploaded yet.</p>
                            </div>
                        ) : (
                            assets.map((asset) => (
                                <div key={asset.asset_id} className="profile-assets-item">
                                    <Image 
                                        src={asset.preview_url || "/asset-thumbnails/essentials.jpg"} 
                                        alt={asset.title} 
                                        width={300} 
                                        height={300}
                                        onError={(e) => {
                                            // Fallback to default image if preview fails to load
                                            e.currentTarget.src = "/asset-thumbnails/essentials.jpg";
                                        }}
                                    />
                                    <h3 className="profile-assets-item-title">{asset.title}</h3>
                                    <p className="profile-assets-item-description">{asset.description}</p>
                                    <div className="profile-assets-item-buttons">
                                        <button 
                                            className="profile-assets-item-button"
                                            onClick={() => router.push(`/assets/${asset.asset_id}`)}
                                            title="View Asset"
                                        >
                                            <FaEye />
                                        </button>
                                        <button 
                                            className="profile-assets-item-button"
                                            onClick={async () => {
                                                try {
                                                    const token = localStorage.getItem("userToken");
                                                    const headers: HeadersInit = {};
                                                    
                                                    if (token) {
                                                        headers["Authorization"] = `Bearer ${token}`;
                                                    }

                                                    const response = await fetch(`/api/assets/${asset.asset_id}/download`, {
                                                        method: "POST",
                                                        headers
                                                    });

                                                    if (!response.ok) {
                                                        throw new Error("Download failed");
                                                    }

                                                    const data = await response.json();
                                                    window.open(data.file_url, "_blank");
                                                } catch (error) {
                                                    console.error("Error downloading asset:", error);
                                                    alert("Failed to download asset. Please try again.");
                                                }
                                            }}
                                            title="Download Asset"
                                        >
                                            <FaDownload />
                                        </button>
                                        <button 
                                            className="profile-assets-item-button"
                                            onClick={() => router.push(`/assets/${asset.asset_id}`)}
                                            title="Edit Asset"
                                        >
                                            <FaEdit />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

