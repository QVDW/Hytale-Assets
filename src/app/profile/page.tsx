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

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
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
                                <p className="profile-stats-item-value">32</p>
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
                        <div className="profile-assets-item">
                            <Image src="/asset-thumbnails/essentials.jpg" alt="Asset 1" width={300} height={300} />
                            <h3 className="profile-assets-item-title">Asset 1</h3>
                            <p className="profile-assets-item-description">Description of Asset 1 long text to test the description text overflow and see how it looks lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos.</p>
                            <div className="profile-assets-item-buttons">
                                <button className="profile-assets-item-button">
                                    <FaEye />
                                </button>
                                <button className="profile-assets-item-button">
                                    <FaDownload />
                                </button>
                                <button className="profile-assets-item-button">
                                    <FaEdit />
                                </button>
                            </div>
                        </div>
                        <div className="profile-assets-item">
                            <Image src="/asset-thumbnails/essentials.jpg" alt="Asset 1" width={300} height={300} />
                            <h3 className="profile-assets-item-title">Asset 1</h3>
                            <p className="profile-assets-item-description">Description of Asset 1 long text to test the description text overflow and see how it looks lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos.</p>
                            <div className="profile-assets-item-buttons">
                                <button className="profile-assets-item-button">
                                    <FaEye />
                                </button>
                                <button className="profile-assets-item-button">
                                    <FaDownload />
                                </button>
                                <button className="profile-assets-item-button">
                                    <FaEdit />
                                </button>
                            </div>
                        </div>
                        <div className="profile-assets-item">
                            <Image src="/asset-thumbnails/essentials.jpg" alt="Asset 1" width={300} height={300} />
                            <h3 className="profile-assets-item-title">Asset 1</h3>
                            <p className="profile-assets-item-description">Description of Asset 1 long text to test the description text overflow and see how it looks lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos.</p>
                            <div className="profile-assets-item-buttons">
                                <button className="profile-assets-item-button">
                                    <FaEye />
                                </button>
                                <button className="profile-assets-item-button">
                                    <FaDownload />
                                </button>
                                <button className="profile-assets-item-button">
                                    <FaEdit />
                                </button>
                            </div>
                        </div>
                        <div className="profile-assets-item">
                            <Image src="/asset-thumbnails/essentials.jpg" alt="Asset 1" width={300} height={300} />
                            <h3 className="profile-assets-item-title">Asset 1</h3>
                            <p className="profile-assets-item-description">Description of Asset 1 long text to test the description text overflow and see how it looks lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos.</p>
                            <div className="profile-assets-item-buttons">
                                <button className="profile-assets-item-button">
                                    <FaEye />
                                </button>
                                <button className="profile-assets-item-button">
                                    <FaDownload />
                                </button>
                                <button className="profile-assets-item-button">
                                    <FaEdit />
                                </button>
                            </div>
                        </div>
                        <div className="profile-assets-item">
                            <Image src="/asset-thumbnails/essentials.jpg" alt="Asset 1" width={300} height={300} />
                            <h3 className="profile-assets-item-title">Asset 1</h3>
                            <p className="profile-assets-item-description">Description of Asset 1 long text to test the description text overflow and see how it looks lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos.</p>
                            <div className="profile-assets-item-buttons">
                                <button className="profile-assets-item-button">
                                    <FaEye />
                                </button>
                                <button className="profile-assets-item-button">
                                    <FaDownload />
                                </button>
                                <button className="profile-assets-item-button">
                                    <FaEdit />
                                </button>
                            </div>
                        </div>
                        <div className="profile-assets-item">
                            <Image src="/asset-thumbnails/essentials.jpg" alt="Asset 1" width={300} height={300} />
                            <h3 className="profile-assets-item-title">Asset 1</h3>
                            <p className="profile-assets-item-description">Description of Asset 1 long text to test the description text overflow and see how it looks lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos.</p>
                            <div className="profile-assets-item-buttons">
                                <button className="profile-assets-item-button">
                                    <FaEye />
                                </button>
                                <button className="profile-assets-item-button">
                                    <FaDownload />
                                </button>
                                <button className="profile-assets-item-button">
                                    <FaEdit />
                                </button>
                            </div>
                        </div>
                        <div className="profile-assets-item">
                            <Image src="/asset-thumbnails/essentials.jpg" alt="Asset 1" width={300} height={300} />
                            <h3 className="profile-assets-item-title">Asset 1</h3>
                            <p className="profile-assets-item-description">Description of Asset 1 long text to test the description text overflow and see how it looks lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos.</p>
                            <div className="profile-assets-item-buttons">
                                <button className="profile-assets-item-button">
                                    <FaEye />
                                </button>
                                <button className="profile-assets-item-button">
                                    <FaDownload />
                                </button>
                                <button className="profile-assets-item-button">
                                    <FaEdit />
                                </button>
                            </div>
                        </div>
                        <div className="profile-assets-item">
                            <Image src="/asset-thumbnails/essentials.jpg" alt="Asset 1" width={300} height={300} />
                            <h3 className="profile-assets-item-title">Asset 1</h3>
                            <p className="profile-assets-item-description">Description of Asset 1 long text to test the description text overflow and see how it looks lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos.</p>
                            <div className="profile-assets-item-buttons">
                                <button className="profile-assets-item-button">
                                    <FaEye />
                                </button>
                                <button className="profile-assets-item-button">
                                    <FaDownload />
                                </button>
                                <button className="profile-assets-item-button">
                                    <FaEdit />
                                </button>
                            </div>
                        </div>
                        <div className="profile-assets-item">
                            <Image src="/asset-thumbnails/essentials.jpg" alt="Asset 1" width={300} height={300} />
                            <h3 className="profile-assets-item-title">Asset 1</h3>
                            <p className="profile-assets-item-description">Description of Asset 1 long text to test the description text overflow and see how it looks lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos.</p>
                            <div className="profile-assets-item-buttons">
                                <button className="profile-assets-item-button">
                                    <FaEye />
                                </button>
                                <button className="profile-assets-item-button">
                                    <FaDownload />
                                </button>
                                <button className="profile-assets-item-button">
                                    <FaEdit />
                                </button>
                            </div>
                        </div>
                        <div className="profile-assets-item">
                            <Image src="/asset-thumbnails/essentials.jpg" alt="Asset 1" width={300} height={300} />
                            <h3 className="profile-assets-item-title">Asset 1</h3>
                            <p className="profile-assets-item-description">Description of Asset 1 long text to test the description text overflow and see how it looks lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos.</p>
                            <div className="profile-assets-item-buttons">
                                <button className="profile-assets-item-button">
                                    <FaEye />
                                </button>
                                <button className="profile-assets-item-button">
                                    <FaDownload />
                                </button>
                                <button className="profile-assets-item-button">
                                    <FaEdit />
                                </button>
                            </div>
                        </div>
                        <div className="profile-assets-item">
                            <Image src="/asset-thumbnails/essentials.jpg" alt="Asset 1" width={300} height={300} />
                            <h3 className="profile-assets-item-title">Asset 1</h3>
                            <p className="profile-assets-item-description">Description of Asset 1 long text to test the description text overflow and see how it looks lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos.</p>
                            <div className="profile-assets-item-buttons">
                                <button className="profile-assets-item-button">
                                    <FaEye />
                                </button>
                                <button className="profile-assets-item-button">
                                    <FaDownload />
                                </button>
                                <button className="profile-assets-item-button">
                                    <FaEdit />
                                </button>
                            </div>
                        </div>
                        <div className="profile-assets-item">
                            <Image src="/asset-thumbnails/essentials.jpg" alt="Asset 1" width={300} height={300} />
                            <h3 className="profile-assets-item-title">Asset 1</h3>
                            <p className="profile-assets-item-description">Description of Asset 1 long text to test the description text overflow and see how it looks lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos.</p>
                            <div className="profile-assets-item-buttons">
                                <button className="profile-assets-item-button">
                                    <FaEye />
                                </button>
                                <button className="profile-assets-item-button">
                                    <FaDownload />
                                </button>
                                <button className="profile-assets-item-button">
                                    <FaEdit />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

