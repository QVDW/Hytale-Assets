"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import Navbar from "../../../../components/Navbar";
import "../../../styles/auth.scss";
import { FaDownload, FaEdit, FaStar, FaTrash, FaArrowUp, FaArrowDown } from "react-icons/fa";

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
    screenshots?: string[];
    isPromoted?: boolean;
}

interface UserData {
    user_id: string;
    username: string;
    profile_picture: string;
    user_role?: string;
}

type TabType = "overview" | "screenshots" | "versions" | "reviews";

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
    const [uploadingImageIndex, setUploadingImageIndex] = useState<number | null>(null);
    const [relatedAssets, setRelatedAssets] = useState<Array<{
        asset_id: string;
        title: string;
        description: string;
        preview_url: string | null;
        download_count: number;
        category: {
            category_id: string;
            name: string;
        };
        uploader: {
            user_id: string;
            username: string;
            profile_picture: string;
        };
    }>>([]);
    const [relatedAssetsLoading, setRelatedAssetsLoading] = useState(false);
    const editMenuRef = useRef<HTMLDivElement>(null);
    const [isUploadingScreenshot, setIsUploadingScreenshot] = useState(false);
    const [isDraggingScreenshot, setIsDraggingScreenshot] = useState(false);
    const [isSavingScreenshots, setIsSavingScreenshots] = useState(false);
    
    // Edit asset details state
    const [isEditingAsset, setIsEditingAsset] = useState(false);
    const [editTitle, setEditTitle] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [editCategory, setEditCategory] = useState("");
    const [editVersion, setEditVersion] = useState("");
    const [editCompatibility, setEditCompatibility] = useState("");
    const [editTags, setEditTags] = useState("");
    const [editPreviewFile, setEditPreviewFile] = useState<File | null>(null);
    const [editPreviewUrl, setEditPreviewUrl] = useState<string | null>(null);
    const [categories, setCategories] = useState<Array<{ category_id: string; name: string; parent_category_id: string | null }>>([]);
    const [editIsPromoted, setEditIsPromoted] = useState(false);
    const [isSavingAsset, setIsSavingAsset] = useState(false);

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

    // Fetch related assets when asset is loaded
    useEffect(() => {
        const fetchRelatedAssets = async () => {
            if (!asset?.category?.category_id) return;

            setRelatedAssetsLoading(true);
            try {
                const response = await fetch(
                    `/api/assets/category/${asset.category.category_id}?exclude=${asset_id}&limit=10`
                );
                
                if (response.ok) {
                    const data = await response.json();
                    setRelatedAssets(data.assets || []);
                }
            } catch (error) {
                console.error("Error fetching related assets:", error);
            } finally {
                setRelatedAssetsLoading(false);
            }
        };

        if (asset) {
            fetchRelatedAssets();
        }
    }, [asset, asset_id]);

    // Fetch categories when editing asset
    useEffect(() => {
        const fetchCategories = async () => {
            if (!isEditingAsset) return;

            try {
                const response = await fetch("/api/assets/categories");
                if (response.ok) {
                    const data = await response.json();
                    // Flatten hierarchical categories for dropdown
                    const flattenCategories = (cats: any[]): any[] => {
                        const result: any[] = [];
                        cats.forEach(cat => {
                            result.push({
                                category_id: cat.category_id,
                                name: cat.name,
                                parent_category_id: cat.parent_category_id
                            });
                            if (cat.children && cat.children.length > 0) {
                                result.push(...flattenCategories(cat.children));
                            }
                        });
                        return result;
                    };
                    const flatCategories = data.categories ? flattenCategories(data.categories) : (data.allCategories || []);
                    setCategories(flatCategories);
                }
            } catch (error) {
                console.error("Error fetching categories:", error);
            }
        };

        fetchCategories();
    }, [isEditingAsset]);

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

    const handleDeleteAsset = async () => {
        if (!asset) return;

        const confirmed = confirm(`Are you sure you want to delete "${asset.title}"? This action cannot be undone.`);
        if (!confirmed) return;

        try {
            const token = localStorage.getItem("userToken");
            if (!token) {
                alert("You must be logged in to delete assets");
                return;
            }

            const response = await fetch(`/api/assets/${asset_id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to delete asset");
            }

            // Redirect to home or user's profile after deletion
            router.push("/");
        } catch (error: any) {
            console.error("Error deleting asset:", error);
            alert(error.message || "Failed to delete asset. Please try again.");
        }
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

    const handleImageUpload = async (index: number, file: File) => {
        if (!asset) return;

        // Validate file type
        const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
        if (!allowedTypes.includes(file.type)) {
            alert("Invalid file type. Only JPEG, PNG, and WebP images are allowed.");
            return;
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            alert("File size exceeds 10MB limit.");
            return;
        }

        setUploadingImageIndex(index);

        try {
            const token = localStorage.getItem("userToken");
            if (!token) {
                alert("You must be logged in to upload images");
                return;
            }

            const formData = new FormData();
            formData.append("file", file);
            formData.append("asset_id", asset_id);

            const response = await fetch("/api/assets/overview-image", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to upload image");
            }

            const data = await response.json();
            
            // Update section content with uploaded image URL
            handleUpdateSection(index, "content", data.image_url);
        } catch (error) {
            console.error("Error uploading image:", error);
            alert(error instanceof Error ? error.message : "Failed to upload image. Please try again.");
        } finally {
            setUploadingImageIndex(null);
        }
    };

    const saveScreenshots = async (screenshots: string[]) => {
        if (!asset) return;

        setIsSavingScreenshots(true);
        try {
            const token = localStorage.getItem("userToken");
            if (!token) {
                alert("You must be logged in to modify screenshots");
                return;
            }

            const response = await fetch(`/api/assets/${asset_id}/screenshots`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ screenshots })
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.error || "Failed to update screenshots");
            }

            const data = await response.json();
            setAsset(prev => prev ? { ...prev, screenshots: data.screenshots } : prev);
        } catch (error: any) {
            console.error("Error saving screenshots:", error);
            alert(error.message || "Failed to save screenshots. Please try again.");
        } finally {
            setIsSavingScreenshots(false);
        }
    };

    const handleScreenshotImageUpload = async (file: File) => {
        if (!asset) return;

        // Validate file type
        const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
        if (!allowedTypes.includes(file.type)) {
            alert("Invalid file type. Only JPEG, PNG, and WebP images are allowed.");
            return;
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            alert("File size exceeds 10MB limit.");
            return;
        }

        setIsUploadingScreenshot(true);

        try {
            const token = localStorage.getItem("userToken");
            if (!token) {
                alert("You must be logged in to upload screenshots");
                return;
            }

            // First upload the image (server will auto-resize to 16:9 up to 1280x720)
            const uploadForm = new FormData();
            uploadForm.append("file", file);
            uploadForm.append("asset_id", asset_id);

            const uploadResponse = await fetch("/api/assets/overview-image", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: uploadForm
            });

            if (!uploadResponse.ok) {
                const errorData = await uploadResponse.json().catch(() => ({}));
                throw new Error(errorData.error || "Failed to upload screenshot");
            }

            const uploadData = await uploadResponse.json();
            const imageUrl = uploadData.image_url as string;

            // Save screenshot reference separately from overview sections
            const saveResponse = await fetch(`/api/assets/${asset_id}/screenshots`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ image_url: imageUrl })
            });

            if (!saveResponse.ok) {
                const error = await saveResponse.json().catch(() => ({}));
                throw new Error(error.error || "Failed to save screenshot");
            }

            const saveData = await saveResponse.json();

            // Update local asset state with the screenshots list returned from the server
            setAsset(prev => prev ? { ...prev, screenshots: saveData.screenshots } : prev);
        } catch (error: any) {
            console.error("Error uploading screenshot:", error);
            alert(error.message || "Failed to upload screenshot. Please try again.");
        } finally {
            setIsUploadingScreenshot(false);
        }
    };

    const handleRemoveScreenshot = async (index: number) => {
        if (!asset || !asset.screenshots) return;
        const newScreens = asset.screenshots.filter((_, i) => i !== index);
        await saveScreenshots(newScreens);
    };

    const handleMoveScreenshot = async (index: number, direction: "up" | "down") => {
        if (!asset || !asset.screenshots) return;
        const screenshots = [...asset.screenshots];
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= screenshots.length) return;
        [screenshots[index], screenshots[targetIndex]] = [screenshots[targetIndex], screenshots[index]];
        await saveScreenshots(screenshots);
    };

    const handleEditAsset = () => {
        setIsEditMenuOpen(false);
        if (!asset) return;
        
        // Initialize form with current asset data
        setEditTitle(asset.title);
        setEditDescription(asset.description);
        setEditCategory(asset.category.category_id);
        setEditVersion(asset.version);
        setEditCompatibility(asset.compatibility || "");
        setEditTags(asset.tags.join(", "));
        setEditPreviewUrl(asset.preview_url);
        setEditPreviewFile(null);
        setEditIsPromoted(!!asset.isPromoted);
        setIsEditingAsset(true);
    };

    const handleCancelEditAsset = () => {
        setIsEditingAsset(false);
        setEditPreviewFile(null);
    };

    const handleSaveAsset = async () => {
        if (!asset) return;

        if (!editTitle.trim() || !editDescription.trim()) {
            alert("Title and description are required");
            return;
        }

        setIsSavingAsset(true);
        try {
            const token = localStorage.getItem("userToken");
            if (!token) {
                alert("You must be logged in to edit asset details");
                return;
            }

            const formData = new FormData();
            formData.append("title", editTitle);
            formData.append("description", editDescription);
            if (editCategory) {
                formData.append("category_id", editCategory);
            }
            if (editVersion) {
                formData.append("version", editVersion);
            }
            if (editCompatibility) {
                formData.append("compatibility", editCompatibility);
            }
            if (editTags) {
                formData.append("tags", editTags);
            }
            if (editPreviewFile) {
                formData.append("preview", editPreviewFile);
            }
            // Always include isPromoted so API can distinguish true/false explicitly
            formData.append("isPromoted", editIsPromoted ? "true" : "false");

            const response = await fetch(`/api/assets/${asset_id}`, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to update asset");
            }

            const data = await response.json();
            
            // Update asset state with new data
            setAsset(prev => prev ? {
                ...prev,
                title: data.asset.title,
                description: data.asset.description,
                preview_url: data.asset.preview_url,
                version: data.asset.version,
                tags: data.asset.tags,
                compatibility: data.asset.compatibility,
                category: data.asset.category,
                isPromoted: data.asset.isPromoted
            } : null);
            
            setIsEditingAsset(false);
            setEditPreviewFile(null);
        } catch (error: any) {
            console.error("Error saving asset details:", error);
            alert(error.message || "Failed to save asset details");
        } finally {
            setIsSavingAsset(false);
        }
    };

    const handlePreviewFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
            if (!allowedTypes.includes(file.type)) {
                alert("Invalid file type. Only JPEG, PNG, and WebP images are allowed.");
                return;
            }

            // Validate file size (max 10MB)
            const maxSize = 10 * 1024 * 1024; // 10MB
            if (file.size > maxSize) {
                alert("File size exceeds 10MB limit.");
                return;
            }

            setEditPreviewFile(file);
            
            // Create preview URL
            const reader = new FileReader();
            reader.onloadend = () => {
                setEditPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
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
            <div className="asset-detail-wrapper">
                <div className="asset-detail-grid">
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
                                <span className="asset-detail-meta-label">Uploader:</span>
                                <span 
                                    className="asset-detail-meta-value asset-detail-meta-value-link" 
                                    onClick={() => router.push(`/profile/${asset.uploader.user_id}`)}
                                >
                                    {asset.uploader.username}
                                </span>
                            </div>
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
                                        <FaStar className="asset-detail-star-icon" />
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
                                            <button 
                                                onClick={handleDeleteAsset}
                                                className="asset-detail-delete-btn"
                                            >
                                                <FaTrash />
                                                Delete Asset
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
                        className={`asset-detail-tab ${activeTab === "screenshots" ? "active" : ""}`}
                        onClick={() => setActiveTab("screenshots")}
                    >
                        Screenshots
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
                                                    ) : section.section_type === "image" ? (
                                                        <div className="asset-overview-edit-image-upload">
                                                            <input
                                                                type="file"
                                                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                                                onChange={(e) => {
                                                                    const file = e.target.files?.[0];
                                                                    if (file) {
                                                                        handleImageUpload(index, file);
                                                                    }
                                                                    // Reset input
                                                                    e.target.value = "";
                                                                }}
                                                                id={`image-upload-${index}`}
                                                                className="asset-overview-edit-file-input"
                                                                disabled={uploadingImageIndex === index}
                                                            />
                                                            {section.content ? (
                                                                <div className="asset-overview-edit-image-preview-container">
                                                                    <div className="asset-overview-edit-image-preview">
                                                                        <img src={section.content} alt="Preview" onError={(e) => {
                                                                            e.currentTarget.src = "/placeholder.svg";
                                                                        }} />
                                                                    </div>
                                                                    <label
                                                                        htmlFor={`image-upload-${index}`}
                                                                        className="asset-overview-edit-upload-button"
                                                                    >
                                                                        {uploadingImageIndex === index ? (
                                                                            <span>Uploading...</span>
                                                                        ) : (
                                                                            <span>Change Image</span>
                                                                        )}
                                                                    </label>
                                                                </div>
                                                            ) : (
                                                                <label
                                                                    htmlFor={`image-upload-${index}`}
                                                                    className="asset-overview-edit-upload-button"
                                                                >
                                                                    {uploadingImageIndex === index ? (
                                                                        <span>Uploading...</span>
                                                                    ) : (
                                                                        <span>Upload Image</span>
                                                                    )}
                                                                </label>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <input
                                                            type="text"
                                                            value={section.content}
                                                            onChange={(e) => handleUpdateSection(index, "content", e.target.value)}
                                                            placeholder="Enter YouTube URL..."
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

                    {activeTab === "screenshots" && (
                        <div className="asset-detail-screenshots">
                            {canEdit() && (
                                <div className="asset-screenshots-upload">
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/jpg,image/png,image/webp"
                                        id="asset-screenshots-upload-input"
                                        style={{ display: "none" }}
                                        onChange={(e) => {
                                            const files = e.target.files;
                                            if (files && files.length > 0) {
                                                Array.from(files).forEach((file) => {
                                                    void handleScreenshotImageUpload(file);
                                                });
                                            }
                                            e.target.value = "";
                                        }}
                                        disabled={isUploadingScreenshot}
                                        multiple
                                    />
                                    <div
                                        className={`asset-screenshots-dropzone ${isDraggingScreenshot ? "dragging" : ""}`}
                                        onClick={() => {
                                            const input = document.getElementById("asset-screenshots-upload-input") as HTMLInputElement | null;
                                            if (input && !isUploadingScreenshot) {
                                                input.click();
                                            }
                                        }}
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            if (!isUploadingScreenshot) {
                                                setIsDraggingScreenshot(true);
                                            }
                                        }}
                                        onDragLeave={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setIsDraggingScreenshot(false);
                                        }}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setIsDraggingScreenshot(false);
                                            if (isUploadingScreenshot) return;
                                            const files = e.dataTransfer.files;
                                            if (files && files.length > 0) {
                                                Array.from(files).forEach((file) => {
                                                    void handleScreenshotImageUpload(file);
                                                });
                                            }
                                        }}
                                    >
                                        <div className="asset-screenshots-dropzone-content">
                                            <p className="asset-screenshots-dropzone-title">
                                                {isUploadingScreenshot ? "Uploading screenshot..." : "Drag & drop screenshots here"}
                                            </p>
                                            <p className="asset-screenshots-dropzone-subtitle">
                                                or click to browse your files
                                            </p>
                                            <p className="asset-screenshots-dropzone-hint">
                                                JPEG, PNG, or WebP images, auto-resized to 16:9 (max 1280×720)
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="asset-screenshots-list">
                                {(asset.screenshots || []).length === 0 ? (
                                    <p className="asset-detail-empty">No screenshots yet.</p>
                                ) : (
                                    (asset.screenshots || []).map((url, index) => (
                                        <div key={`${url}-${index}`} className="asset-screenshot-item">
                                            <Image
                                                src={url}
                                                alt="Screenshot"
                                                width={800}
                                                height={450}
                                                onError={(e) => {
                                                    e.currentTarget.src = "/asset-thumbnails/essentials.jpg";
                                                }}
                                            />
                                            {canEdit() && (
                                                <div className="asset-screenshot-controls">
                                                    <button
                                                        type="button"
                                                        className="asset-screenshot-btn"
                                                        onClick={() => handleMoveScreenshot(index, "up")}
                                                        disabled={index === 0 || isSavingScreenshots}
                                                        title="Move up"
                                                    >
                                                        <FaArrowUp />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="asset-screenshot-btn"
                                                        onClick={() => handleMoveScreenshot(index, "down")}
                                                        disabled={index === (asset.screenshots?.length || 0) - 1 || isSavingScreenshots}
                                                        title="Move down"
                                                    >
                                                        <FaArrowDown />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="asset-screenshot-btn remove"
                                                        onClick={() => handleRemoveScreenshot(index)}
                                                        disabled={isSavingScreenshots}
                                                        title="Remove screenshot"
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
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
                                                <FaStar className="asset-reviews-star-icon" />
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
                                                                        className={`asset-review-star-icon ${i < review.rating ? '' : 'asset-review-star-empty'}`}
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
                    
                    {/* Related Assets Sidebar */}
                    <div className="asset-detail-related">
                        <h3 className="asset-detail-related-title">More {asset.category.name}</h3>
                        {relatedAssetsLoading ? (
                            <div className="asset-detail-related-loading">
                                <div className="loading-spinner">Loading...</div>
                            </div>
                        ) : relatedAssets.length === 0 ? (
                            <div className="asset-detail-related-empty">
                                <p>No other {asset.category.name.toLowerCase()} available.</p>
                            </div>
                        ) : (
                            <div className="asset-detail-related-list">
                                {relatedAssets.map((relatedAsset) => (
                                    <div 
                                        key={relatedAsset.asset_id} 
                                        className="asset-detail-related-item"
                                        onClick={() => router.push(`/assets/${relatedAsset.asset_id}`)}
                                    >
                                        <div className="asset-detail-related-image">
                                            <Image
                                                src={relatedAsset.preview_url || "/asset-thumbnails/essentials.jpg"}
                                                alt={relatedAsset.title}
                                                width={200}
                                                height={200}
                                                onError={(e) => {
                                                    e.currentTarget.src = "/asset-thumbnails/essentials.jpg";
                                                }}
                                            />
                                        </div>
                                        <div className="asset-detail-related-info">
                                            <h4 className="asset-detail-related-item-title">{relatedAsset.title}</h4>
                                            <p className="asset-detail-related-item-description">
                                                {relatedAsset.description.length > 100 
                                                    ? relatedAsset.description.substring(0, 100) + "..." 
                                                    : relatedAsset.description}
                                            </p>
                                            <div className="asset-detail-related-item-meta">
                                                <span className="asset-detail-related-item-downloads">
                                                    <FaDownload className="asset-version-download-icon" />
                                                    {relatedAsset.download_count}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Asset Details Modal */}
            {isEditingAsset && (
                <div className="asset-edit-modal-overlay" onClick={handleCancelEditAsset}>
                    <div className="asset-edit-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="asset-edit-modal-header">
                            <h2>Edit Asset Details</h2>
                            <button 
                                className="asset-edit-modal-close"
                                onClick={handleCancelEditAsset}
                                disabled={isSavingAsset}
                            >
                                ×
                            </button>
                        </div>
                        
                        <div className="asset-edit-modal-content">
                            <div className="asset-edit-form-group">
                                <label htmlFor="edit-title">Title *</label>
                                <input
                                    id="edit-title"
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    placeholder="Asset title"
                                    disabled={isSavingAsset}
                                />
                            </div>

                            <div className="asset-edit-form-group">
                                <label htmlFor="edit-description">Description *</label>
                                <textarea
                                    id="edit-description"
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                    placeholder="Asset description"
                                    rows={5}
                                    disabled={isSavingAsset}
                                />
                            </div>

                            <div className="asset-edit-form-group">
                                <label htmlFor="edit-category">Category</label>
                                <select
                                    id="edit-category"
                                    value={editCategory}
                                    onChange={(e) => setEditCategory(e.target.value)}
                                    disabled={isSavingAsset}
                                >
                                    <option value="">Select a category</option>
                                    {categories.map((cat) => (
                                        <option key={cat.category_id} value={cat.category_id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="asset-edit-form-row">
                                <div className="asset-edit-form-group">
                                    <label htmlFor="edit-version">Version</label>
                                    <input
                                        id="edit-version"
                                        type="text"
                                        value={editVersion}
                                        onChange={(e) => setEditVersion(e.target.value)}
                                        placeholder="e.g., 1.0.0"
                                        disabled={isSavingAsset}
                                    />
                                </div>

                                <div className="asset-edit-form-group">
                                    <label htmlFor="edit-compatibility">Compatibility</label>
                                    <input
                                        id="edit-compatibility"
                                        type="text"
                                        value={editCompatibility}
                                        onChange={(e) => setEditCompatibility(e.target.value)}
                                        placeholder="Game version"
                                        disabled={isSavingAsset}
                                    />
                                </div>
                            </div>

                            <div className="asset-edit-form-group">
                                <label htmlFor="edit-tags">Tags (comma-separated)</label>
                                <input
                                    id="edit-tags"
                                    type="text"
                                    value={editTags}
                                    onChange={(e) => setEditTags(e.target.value)}
                                    placeholder="tag1, tag2, tag3"
                                    disabled={isSavingAsset}
                                />
                            </div>

                            <div className="asset-edit-form-group asset-edit-form-group-inline">
                                <label className="asset-edit-checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={editIsPromoted}
                                        onChange={(e) => setEditIsPromoted(e.target.checked)}
                                        disabled={isSavingAsset}
                                    />
                                    <span>Promote on homepage</span>
                                </label>
                            </div>

                            <div className="asset-edit-form-group">
                                <label htmlFor="edit-preview">Thumbnail</label>
                                <div className="asset-edit-preview-container">
                                    {editPreviewUrl && (
                                        <div className="asset-edit-preview-image">
                                            <Image
                                                src={editPreviewUrl}
                                                alt="Preview"
                                                width={200}
                                                height={200}
                                                className="asset-edit-preview-image"
                                            />
                                        </div>
                                    )}
                                    <input
                                        id="edit-preview"
                                        type="file"
                                        accept="image/jpeg,image/jpg,image/png,image/webp"
                                        onChange={handlePreviewFileChange}
                                        disabled={isSavingAsset}
                                        className="asset-edit-file-input"
                                    />
                                    <label htmlFor="edit-preview" className="asset-edit-upload-button">
                                        {editPreviewFile ? "Change Thumbnail" : "Upload Thumbnail"}
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="asset-edit-modal-actions">
                            <button
                                className="asset-edit-btn cancel"
                                onClick={handleCancelEditAsset}
                                disabled={isSavingAsset}
                            >
                                Cancel
                            </button>
                            <button
                                className="asset-edit-btn save"
                                onClick={handleSaveAsset}
                                disabled={isSavingAsset}
                            >
                                {isSavingAsset ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

