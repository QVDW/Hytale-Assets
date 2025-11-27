"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import Navbar from "../../../../components/Navbar";
import "../../../styles/auth.scss";
import { FaDownload, FaEdit, FaStar } from "react-icons/fa";

interface AssetData {
    asset_id: string;
    title: string;
    description: string;
    preview_url: string | null;
    file_url: string;
    download_count: number;
    upload_date: string;
    version: string;
    tags: string[];
    compatibility: string | null;
    averageRating: number;
    uploader: {
        user_id: string;
        username: string;
        profile_picture: string;
    };
    category: {
        category_id: string;
        name: string;
    };
    versions: Array<{
        version_id: string;
        version_number: string;
        file_url: string;
        changelog: string | null;
        upload_date: string;
    }>;
    reviews: Array<{
        review_id: string;
        rating: number;
        title: string | null;
        review_text: string;
        review_date: string;
        user: {
            user_id: string;
            username: string;
            profile_picture: string;
        };
    }>;
    overviewSections: Array<{
        section_id: string;
        section_type: "image" | "youtube" | "text";
        content: string;
        order: number;
    }>;
}

interface UserData {
    user_id: string;
    username: string;
    profile_picture: string;
    user_role?: string;
}

type TabType = "overview" | "versions" | "reviews";

export default function AssetDetailPage() {
    const router = useRouter();
    const params = useParams();
    const asset_id = params?.asset_id as string;

    const [asset, setAsset] = useState<AssetData | null>(null);
    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>("overview");
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isEditMenuOpen, setIsEditMenuOpen] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isEditingOverview, setIsEditingOverview] = useState(false);
    const [editingSections, setEditingSections] = useState<Array<{
        section_id?: string;
        section_type: "image" | "youtube" | "text";
        content: string;
        order: number;
    }>>([]);
    const [isSavingOverview, setIsSavingOverview] = useState(false);
    const editMenuRef = useRef<HTMLDivElement>(null);

    // Close edit menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (editMenuRef.current && !editMenuRef.current.contains(event.target as Node)) {
                setIsEditMenuOpen(false);
            }
        };

        if (isEditMenuOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isEditMenuOpen]);

    useEffect(() => {
        const fetchAsset = async () => {
            if (!asset_id) return;

            try {
                const response = await fetch(`/api/assets/${asset_id}`);
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    console.error("API Error:", response.status, errorData);
                    
                    if (response.status === 404) {
                        router.push("/404");
                        return;
                    }
                    throw new Error(errorData.error || "Failed to fetch asset");
                }

                const data = await response.json();
                
                if (!data.asset) {
                    console.error("No asset data in response");
                    router.push("/404");
                    return;
                }
                
                setAsset(data.asset);
            } catch (error) {
                console.error("Error fetching asset:", error);
                // Don't redirect on network errors, just show error
                setLoading(false);
            } finally {
                setLoading(false);
            }
        };

        const fetchUser = async () => {
            if (typeof window === "undefined") return;

            const token = localStorage.getItem("userToken");
            if (!token) return;

            try {
                const response = await fetch("/api/user-auth/me", {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const userData = await response.json();
                    setUser(userData);
                }
            } catch (error) {
                console.error("Error fetching user:", error);
            }
        };

        fetchAsset();
        fetchUser();
    }, [asset_id, router]);

    const handleDownload = async () => {
        if (!asset) return;

        setIsDownloading(true);
        try {
            const token = localStorage.getItem("userToken");
            const headers: HeadersInit = {};
            
            if (token) {
                headers["Authorization"] = `Bearer ${token}`;
            }

            const response = await fetch(`/api/assets/${asset_id}/download`, {
                method: "POST",
                headers
            });

            if (!response.ok) {
                throw new Error("Download failed");
            }

            const data = await response.json();
            
            // Trigger file download
            window.open(data.file_url, "_blank");
            
            // Update download count in state
            setAsset(prev => prev ? { ...prev, download_count: data.download_count } : null);
        } catch (error) {
            console.error("Error downloading asset:", error);
            alert("Failed to download asset. Please try again.");
        } finally {
            setIsDownloading(false);
        }
    };

    const canEdit = () => {
        if (!asset || !user) return false;
        return asset.uploader.user_id === user.user_id || user.user_role === "admin";
    };

    const handleEditOverview = () => {
        setIsEditMenuOpen(false);
        setActiveTab("overview");
        setIsEditingOverview(true);
        // Initialize editing sections with current sections
        if (asset) {
            setEditingSections([...asset.overviewSections]);
        }
    };

    const handleSaveOverview = async () => {
        if (!asset) return;

        setIsSavingOverview(true);
        try {
            const token = localStorage.getItem("userToken");
            if (!token) {
                alert("You must be logged in to edit overview sections");
                return;
            }

            const response = await fetch(`/api/assets/${asset_id}/overview`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    sections: editingSections
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to save overview sections");
            }

            const data = await response.json();
            
            // Update asset with new sections
            setAsset(prev => prev ? { ...prev, overviewSections: data.sections } : null);
            setIsEditingOverview(false);
        } catch (error: any) {
            console.error("Error saving overview sections:", error);
            alert(error.message || "Failed to save overview sections");
        } finally {
            setIsSavingOverview(false);
        }
    };

    const handleCancelEditOverview = () => {
        setIsEditingOverview(false);
        if (asset) {
            setEditingSections([...asset.overviewSections]);
        }
    };

    const handleAddSection = (type: "image" | "youtube" | "text") => {
        const newSection = {
            section_type: type,
            content: "",
            order: editingSections.length
        };
        setEditingSections([...editingSections, newSection]);
    };

    const handleRemoveSection = (index: number) => {
        const newSections = editingSections.filter((_, i) => i !== index);
        // Reorder sections
        const reorderedSections = newSections.map((section, i) => ({
            ...section,
            order: i
        }));
        setEditingSections(reorderedSections);
    };

    const handleMoveSection = (index: number, direction: "up" | "down") => {
        if (direction === "up" && index === 0) return;
        if (direction === "down" && index === editingSections.length - 1) return;

        const newSections = [...editingSections];
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
        
        // Update order
        const reorderedSections = newSections.map((section, i) => ({
            ...section,
            order: i
        }));
        setEditingSections(reorderedSections);
    };

    const handleUpdateSection = (index: number, field: "section_type" | "content", value: string) => {
        const newSections = [...editingSections];
        newSections[index] = {
            ...newSections[index],
            [field]: value
        };
        setEditingSections(newSections);
    };

    const handleEditAsset = () => {
        setIsEditMenuOpen(false);
        // Navigate to edit page or show edit modal
        // For now, just show alert
        alert("Edit asset functionality coming soon!");
    };

    if (loading) {
        return (
            <div className="asset-detail-page">
                <Navbar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
                <div className="asset-detail-loading">
                    <div className="loading-spinner">Loading asset...</div>
                </div>
            </div>
        );
    }

    if (!asset) {
        return null;
    }

    // Extract YouTube video ID from URL
    const getYouTubeVideoId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return match && match[2].length === 11 ? match[2] : null;
    };

    return (
        <div className="asset-detail-page">
            <Navbar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
            <div className="asset-detail-container">
                {/* Header Section */}
                <div className="asset-detail-header">
                    <div className="asset-detail-header-image">
                        <Image
                            src={asset.preview_url || "/asset-thumbnails/essentials.jpg"}
                            alt={asset.title}
                            width={400}
                            height={400}
                            onError={(e) => {
                                e.currentTarget.src = "/asset-thumbnails/essentials.jpg";
                            }}
                        />
                    </div>
                    <div className="asset-detail-header-info">
                        <h1 className="asset-detail-title">{asset.title}</h1>
                        <p className="asset-detail-description">{asset.description}</p>
                        
                        <div className="asset-detail-meta">
                            <div className="asset-detail-meta-item">
                                <span className="asset-detail-meta-label">Category:</span>
                                <span className="asset-detail-meta-value">{asset.category.name}</span>
                            </div>
                            <div className="asset-detail-meta-item">
                                <span className="asset-detail-meta-label">Downloads:</span>
                                <span className="asset-detail-meta-value">{asset.download_count}</span>
                            </div>
                            {asset.averageRating > 0 && (
                                <div className="asset-detail-meta-item">
                                    <span className="asset-detail-meta-label">Rating:</span>
                                    <span className="asset-detail-meta-value">
                                        <FaStar style={{ color: "#ffc107", marginRight: "4px" }} />
                                        {asset.averageRating.toFixed(1)} ({asset.reviews.length})
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="asset-detail-actions">
                            <button 
                                className="asset-detail-download-btn"
                                onClick={handleDownload}
                                disabled={isDownloading}
                            >
                                <FaDownload />
                                {isDownloading ? "Downloading..." : "Download"}
                            </button>
                            {canEdit() && (
                                <div className="asset-detail-edit-menu" ref={editMenuRef}>
                                    <button 
                                        className="asset-detail-edit-btn"
                                        onClick={() => setIsEditMenuOpen(!isEditMenuOpen)}
                                    >
                                        <FaEdit />
                                        Edit
                                    </button>
                                    {isEditMenuOpen && (
                                        <div className="asset-detail-edit-dropdown">
                                            <button onClick={handleEditOverview}>
                                                Edit Overview Sections
                                            </button>
                                            <button onClick={handleEditAsset}>
                                                Edit Asset Details
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="asset-detail-tabs">
                    <button
                        className={`asset-detail-tab ${activeTab === "overview" ? "active" : ""}`}
                        onClick={() => setActiveTab("overview")}
                    >
                        Overview
                    </button>
                    <button
                        className={`asset-detail-tab ${activeTab === "versions" ? "active" : ""}`}
                        onClick={() => setActiveTab("versions")}
                    >
                        Versions
                    </button>
                    <button
                        className={`asset-detail-tab ${activeTab === "reviews" ? "active" : ""}`}
                        onClick={() => setActiveTab("reviews")}
                    >
                        Reviews ({asset.reviews.length})
                    </button>
                </div>

                {/* Tab Content */}
                <div className="asset-detail-content">
                    {activeTab === "overview" && (
                        <div className="asset-detail-overview">
                            {isEditingOverview && canEdit() ? (
                                <div className="asset-overview-edit">
                                    <div className="asset-overview-edit-header">
                                        <h3>Edit Overview Sections</h3>
                                        <div className="asset-overview-edit-actions">
                                            <button
                                                className="asset-overview-edit-btn cancel"
                                                onClick={handleCancelEditOverview}
                                                disabled={isSavingOverview}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                className="asset-overview-edit-btn save"
                                                onClick={handleSaveOverview}
                                                disabled={isSavingOverview}
                                            >
                                                {isSavingOverview ? "Saving..." : "Save"}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="asset-overview-edit-sections">
                                        {editingSections.map((section, index) => (
                                            <div key={index} className="asset-overview-edit-section">
                                                <div className="asset-overview-edit-section-header">
                                                    <select
                                                        value={section.section_type}
                                                        onChange={(e) => handleUpdateSection(index, "section_type", e.target.value)}
                                                        className="asset-overview-edit-type-select"
                                                    >
                                                        <option value="image">Image</option>
                                                        <option value="youtube">YouTube Video</option>
                                                        <option value="text">Text</option>
                                                    </select>
                                                    <div className="asset-overview-edit-section-actions">
                                                        <button
                                                            onClick={() => handleMoveSection(index, "up")}
                                                            disabled={index === 0}
                                                            className="asset-overview-edit-move-btn"
                                                        >
                                                            ↑
                                                        </button>
                                                        <button
                                                            onClick={() => handleMoveSection(index, "down")}
                                                            disabled={index === editingSections.length - 1}
                                                            className="asset-overview-edit-move-btn"
                                                        >
                                                            ↓
                                                        </button>
                                                        <button
                                                            onClick={() => handleRemoveSection(index)}
                                                            className="asset-overview-edit-remove-btn"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="asset-overview-edit-section-content">
                                                    {section.section_type === "text" ? (
                                                        <textarea
                                                            value={section.content}
                                                            onChange={(e) => handleUpdateSection(index, "content", e.target.value)}
                                                            placeholder="Enter text content..."
                                                            className="asset-overview-edit-textarea"
                                                            rows={6}
                                                        />
                                                    ) : (
                                                        <input
                                                            type="text"
                                                            value={section.content}
                                                            onChange={(e) => handleUpdateSection(index, "content", e.target.value)}
                                                            placeholder={section.section_type === "image" ? "Enter image URL..." : "Enter YouTube URL..."}
                                                            className="asset-overview-edit-input"
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="asset-overview-edit-add">
                                        <button
                                            onClick={() => handleAddSection("image")}
                                            className="asset-overview-edit-add-btn"
                                        >
                                            + Add Image
                                        </button>
                                        <button
                                            onClick={() => handleAddSection("youtube")}
                                            className="asset-overview-edit-add-btn"
                                        >
                                            + Add YouTube Video
                                        </button>
                                        <button
                                            onClick={() => handleAddSection("text")}
                                            className="asset-overview-edit-add-btn"
                                        >
                                            + Add Text
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {asset.overviewSections.length === 0 ? (
                                        <p className="asset-detail-empty">No overview sections yet.</p>
                                    ) : (
                                        asset.overviewSections.map((section) => (
                                            <div key={section.section_id} className="asset-overview-section">
                                                {section.section_type === "image" && (
                                                    <div className="asset-overview-image">
                                                        <Image
                                                            src={section.content}
                                                            alt="Overview image"
                                                            width={800}
                                                            height={600}
                                                            onError={(e) => {
                                                                e.currentTarget.src = "/asset-thumbnails/essentials.jpg";
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                                {section.section_type === "youtube" && (
                                                    <div className="asset-overview-youtube">
                                                        {(() => {
                                                            const videoId = getYouTubeVideoId(section.content);
                                                            if (videoId) {
                                                                return (
                                                                    <iframe
                                                                        width="100%"
                                                                        height="500"
                                                                        src={`https://www.youtube.com/embed/${videoId}`}
                                                                        frameBorder="0"
                                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                                        allowFullScreen
                                                                    />
                                                                );
                                                            }
                                                            return <p>Invalid YouTube URL</p>;
                                                        })()}
                                                    </div>
                                                )}
                                                {section.section_type === "text" && (
                                                    <div className="asset-overview-text">
                                                        <p>{section.content}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {activeTab === "versions" && (
                        <div className="asset-detail-versions">
                            {asset.versions.length === 0 ? (
                                <p className="asset-detail-empty">No versions available.</p>
                            ) : (
                                asset.versions.map((version) => (
                                    <div key={version.version_id} className="asset-version-item">
                                        <div className="asset-version-header">
                                            <h3>Version {version.version_number}</h3>
                                            <span className="asset-version-date">
                                                {new Date(version.upload_date).toLocaleDateString()}
                                            </span>
                                        </div>
                                        {version.changelog && (
                                            <p className="asset-version-changelog">{version.changelog}</p>
                                        )}
                                        <a
                                            href={version.file_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="asset-version-download"
                                        >
                                            <FaDownload />
                                            Download Version {version.version_number}
                                        </a>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === "reviews" && (
                        <div className="asset-detail-reviews">
                            {asset.reviews.length === 0 ? (
                                <p className="asset-detail-empty">No reviews yet.</p>
                            ) : (
                                <>
                                    {asset.averageRating > 0 && (
                                        <div className="asset-reviews-summary">
                                            <div className="asset-reviews-rating">
                                                <FaStar style={{ color: "#ffc107", fontSize: "2rem" }} />
                                                <span className="asset-reviews-average">{asset.averageRating.toFixed(1)}</span>
                                                <span className="asset-reviews-count">({asset.reviews.length} reviews)</span>
                                            </div>
                                        </div>
                                    )}
                                    <div className="asset-reviews-list">
                                        {asset.reviews.map((review) => (
                                            <div key={review.review_id} className="asset-review-item">
                                                <div className="asset-review-header">
                                                    <div className="asset-review-user">
                                                        <Image
                                                            src={review.user.profile_picture}
                                                            alt={review.user.username}
                                                            width={40}
                                                            height={40}
                                                            className="asset-review-avatar"
                                                        />
                                                        <div>
                                                            <div className="asset-review-username">{review.user.username}</div>
                                                            <div className="asset-review-rating">
                                                                {[...Array(5)].map((_, i) => (
                                                                    <FaStar
                                                                        key={i}
                                                                        style={{
                                                                            color: i < review.rating ? "#ffc107" : "#ccc",
                                                                            fontSize: "0.9rem"
                                                                        }}
                                                                    />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <span className="asset-review-date">
                                                        {new Date(review.review_date).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                {review.title && (
                                                    <h4 className="asset-review-title">{review.title}</h4>
                                                )}
                                                <p className="asset-review-text">{review.review_text}</p>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

