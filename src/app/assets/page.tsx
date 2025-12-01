"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Navbar from "../../../components/Navbar";
import AssetTitle from "../../../components/AssetTitle";
import "../../styles/auth.scss";
import { FaDownload, FaEye } from "react-icons/fa";

interface Asset {
    asset_id: string;
    title: string;
    description: string;
    preview_url: string | null;
    file_url: string;
    download_count: number;
    upload_date: string;
    averageRating: number;
    category: {
        category_id: string;
        name: string;
    };
    uploader: {
        user_id: string;
        username: string;
        profile_picture: string;
    };
    logo_url?: string | null;
}

interface Category {
    category_id: string;
    name: string;
    parent_category_id: string | null;
    children?: Category[];
}

export default function AssetsPage() {
    const router = useRouter();
    const [assets, setAssets] = useState<Asset[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [hierarchicalCategories, setHierarchicalCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [assetsLoading, setAssetsLoading] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    
    // Filter states
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [sortBy, setSortBy] = useState<string>("downloads");
    const [sortOrder, setSortOrder] = useState<string>("desc");

    // Fetch categories on mount
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch("/api/assets/categories");
                if (response.ok) {
                    const data = await response.json();
                    
                    // Store hierarchical structure
                    if (data.categories && Array.isArray(data.categories) && data.categories.length > 0) {
                        setHierarchicalCategories(data.categories);
                    } else if (data.allCategories && Array.isArray(data.allCategories) && data.allCategories.length > 0) {
                        // If hierarchical structure not available, build it from flat list
                        const parentCategories = data.allCategories.filter((cat: Category) => !cat.parent_category_id);
                        const hierarchical = parentCategories.map((parent: Category) => ({
                            ...parent,
                            children: data.allCategories.filter((cat: Category) => cat.parent_category_id === parent.category_id)
                        }));
                        setHierarchicalCategories(hierarchical);
                    }
                    
                    // Also store flat list for easy lookup
                    const flattenCategories = (cats: any[]): Category[] => {
                        const result: Category[] = [];
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
                    const flatCategories = data.allCategories || flattenCategories(data.categories || []);
                    setCategories(flatCategories);
                }
            } catch (error) {
                console.error("Error fetching categories:", error);
            }
        };

        fetchCategories();
    }, []);

    // Fetch assets when filters change
    useEffect(() => {
        const fetchAssets = async () => {
            setAssetsLoading(true);
            try {
                const params = new URLSearchParams();
                if (selectedCategory) {
                    params.append("category_id", selectedCategory);
                }
                params.append("sort", sortBy);
                params.append("order", sortOrder);

                const response = await fetch(`/api/assets?${params.toString()}`);
                
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
                setLoading(false);
            }
        };

        fetchAssets();
    }, [selectedCategory, sortBy, sortOrder]);

    const handleDownload = async (asset: Asset) => {
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
    };

    if (loading) {
        return (
            <div className="assets-page">
                <Navbar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
                <div className="assets-loading-container">
                    <div className="loading-spinner">Loading...</div>
                </div>
            </div>
        );
    }

    const renderCategoryItem = (category: Category) => {
        const isSelected = selectedCategory === category.category_id;
        const hasChildren = category.children && category.children.length > 0;

        return (
            <div key={category.category_id} className="assets-category-item">
                <label className={`assets-category-label ${isSelected ? 'selected' : ''}`}>
                    <input
                        type="radio"
                        name="category"
                        value={category.category_id}
                        checked={isSelected}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="assets-category-radio"
                    />
                    <span className="assets-category-name">{category.name}</span>
                </label>
                {hasChildren && (
                    <div className="assets-category-children">
                        {category.children!.map((child) => (
                            <label
                                key={child.category_id}
                                className={`assets-category-label assets-category-child ${selectedCategory === child.category_id ? 'selected' : ''}`}
                            >
                                <input
                                    type="radio"
                                    name="category"
                                    value={child.category_id}
                                    checked={selectedCategory === child.category_id}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="assets-category-radio"
                                />
                                <span className="assets-category-name">{child.name}</span>
                            </label>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="assets-page">
            <Navbar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
            <div className="assets-container">
                <div className="assets-content">
                    <div className="assets-sidebar">
                        <div className="assets-filters">
                            <h2 className="assets-filters-title">Categories</h2>
                            <div className="assets-categories-list">
                                <label className={`assets-category-label ${selectedCategory === '' ? 'selected' : ''}`}>
                                    <input
                                        type="radio"
                                        name="category"
                                        value=""
                                        checked={selectedCategory === ''}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                        className="assets-category-radio"
                                    />
                                    <span className="assets-category-name">All Categories</span>
                                </label>
                                {hierarchicalCategories.length > 0 ? (
                                    hierarchicalCategories.map((category) => renderCategoryItem(category))
                                ) : categories.length > 0 ? (
                                    // Fallback: show all categories flat if hierarchical structure not available
                                    categories.map((category) => (
                                        <label
                                            key={category.category_id}
                                            className={`assets-category-label ${selectedCategory === category.category_id ? 'selected' : ''} ${category.parent_category_id ? 'assets-category-child' : ''}`}
                                        >
                                            <input
                                                type="radio"
                                                name="category"
                                                value={category.category_id}
                                                checked={selectedCategory === category.category_id}
                                                onChange={(e) => setSelectedCategory(e.target.value)}
                                                className="assets-category-radio"
                                            />
                                            <span className="assets-category-name">{category.name}</span>
                                        </label>
                                    ))
                                ) : (
                                    <div className="assets-categories-loading">Loading categories...</div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="assets-main">
                        <div className="profile-assets-section">
                            <div className="profile-assets-header">
                                <div className="assets-sort">
                                    <label htmlFor="sort-filter" className="assets-sort-label">
                                        Sort By
                                    </label>
                                    <select
                                        id="sort-filter"
                                        className="assets-sort-select"
                                        value={sortBy}
                                        onChange={(e) => {
                                            const newSort = e.target.value;
                                            setSortBy(newSort);
                                            // Set default order based on sort type
                                            if (newSort === "date") {
                                                setSortOrder("desc"); // Newest first by default
                                            } else if (newSort === "rating") {
                                                setSortOrder("desc"); // Highest rated first by default
                                            } else {
                                                setSortOrder("desc"); // Most downloads first by default
                                            }
                                        }}
                                    >
                                        <option value="downloads">Most Downloads</option>
                                        <option value="date">Newest</option>
                                        <option value="rating">Highest Rated</option>
                                    </select>
                                </div>
                            </div>
                            <div className="profile-assets-container">
                                {assetsLoading ? (
                                    <div className="profile-assets-loading">
                                        <div className="loading-spinner">Loading assets...</div>
                                    </div>
                                ) : assets.length === 0 ? (
                                    <div className="profile-assets-empty">
                                        <p>No assets found.</p>
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
                                                    e.currentTarget.src = "/asset-thumbnails/essentials.jpg";
                                                }}
                                            />
                                            <h3 className="profile-assets-item-title">
                                                <AssetTitle
                                                    title={asset.title}
                                                    logoUrl={asset.logo_url}
                                                    visuallyHideText
                                                />
                                            </h3>
                                            <p className="profile-assets-item-description">{asset.description}</p>
                                            <div className="profile-assets-item-meta">
                                                <span className="profile-assets-item-category">{asset.category.name}</span>
                                                <span className="profile-assets-item-downloads">
                                                    <FaDownload /> {asset.download_count}
                                                </span>
                                            </div>
                                            <div className="profile-assets-item-buttons profile-assets-item-buttons-guest">
                                                <button 
                                                    className="profile-assets-item-button"
                                                    onClick={() => router.push(`/assets/${asset.asset_id}`)}
                                                    title="View Asset"
                                                >
                                                    <FaEye />
                                                </button>
                                                <button 
                                                    className="profile-assets-item-button"
                                                    onClick={() => handleDownload(asset)}
                                                    title="Download Asset"
                                                >
                                                    <FaDownload />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

