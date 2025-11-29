"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../../components/Navbar";
import ImageCropper from "../../../components/ImageCropper";
import "../../styles/auth.scss";
import { FaUpload, FaFile, FaImage, FaTag, FaCheck, FaArrowLeft, FaArrowRight, FaGithub } from "react-icons/fa";

interface Category {
    category_id: string;
    name: string;
    parent_category_id: string | null;
    description: string | null;
    children?: Category[];
}

interface UserData {
    user_id: string;
    username: string;
    profile_picture: string;
}

export default function UploadPage() {
    const router = useRouter();
    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [categories, setCategories] = useState<Category[]>([]);
    const [subcategories, setSubcategories] = useState<Category[]>([]);
    
    // Form state
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedSubcategory, setSelectedSubcategory] = useState("");
    const [version, setVersion] = useState("1.0.0");
    const [compatibility, setCompatibility] = useState("");
    const [tags, setTags] = useState("");
    const [githubUrl, setGithubUrl] = useState("");
    const [mainFile, setMainFile] = useState<File | null>(null);
    const [previewFile, setPreviewFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [showCropper, setShowCropper] = useState(false);
    const [tempPreviewFile, setTempPreviewFile] = useState<File | null>(null);
    
    // UI state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [uploadedAssetId, setUploadedAssetId] = useState<string | null>(null);

    // Check authentication
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

    // Fetch categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch("/api/assets/categories");
                if (response.ok) {
                    const data = await response.json();
                    setCategories(data.categories || []);
                }
            } catch (error) {
                console.error("Error fetching categories:", error);
            }
        };

        if (!loading) {
            fetchCategories();
        }
    }, [loading]);

    // Update subcategories when parent category changes
    useEffect(() => {
        if (selectedCategory) {
            const parent = categories.find(cat => cat.category_id === selectedCategory);
            setSubcategories(parent?.children || []);
            setSelectedSubcategory(""); // Reset subcategory when parent changes
        } else {
            setSubcategories([]);
            setSelectedSubcategory("");
        }
    }, [selectedCategory, categories]);

    // Handle preview file selection
    const handlePreviewChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate image type
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            if (!validTypes.includes(file.type)) {
                setError("Preview must be an image (jpg, png, or webp)");
                return;
            }
            // Show cropper instead of directly setting the file
            setTempPreviewFile(file);
            setShowCropper(true);
        }
    };

    // Handle crop complete
    const handleCropComplete = (croppedFile: File) => {
        setPreviewFile(croppedFile);
        const url = URL.createObjectURL(croppedFile);
        setPreviewUrl(url);
        setShowCropper(false);
        setTempPreviewFile(null);
    };

    // Handle crop cancel
    const handleCropCancel = () => {
        setShowCropper(false);
        setTempPreviewFile(null);
        // Reset the file input
        const fileInput = document.getElementById('preview') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }
    };

    // Check if selected category is a plugin
    const isPluginCategory = () => {
        const category = categories.find(cat => cat.category_id === selectedCategory);
        return category?.name.toLowerCase().includes('plugin') || false;
    };

    // Validate current step
    const validateStep = (step: number): boolean => {
        setError("");
        
        switch (step) {
            case 1:
                if (!title.trim()) {
                    setError("Title is required");
                    return false;
                }
                if (!description.trim()) {
                    setError("Description is required");
                    return false;
                }
                if (!selectedCategory) {
                    setError("Category is required");
                    return false;
                }
                return true;
            case 2:
                const isPlugin = isPluginCategory();
                if (isPlugin) {
                    if (!githubUrl.trim()) {
                        setError("GitHub release URL is required for plugins");
                        return false;
                    }
                    // Basic URL validation
                    try {
                        new URL(githubUrl);
                        if (!githubUrl.includes('github.com') || !githubUrl.includes('/releases/')) {
                            setError("Please provide a valid GitHub release URL");
                            return false;
                        }
                    } catch {
                        setError("Please provide a valid GitHub release URL");
                        return false;
                    }
                } else {
                    if (!mainFile) {
                        setError("File upload is required");
                        return false;
                    }
                }
                if (!previewFile) {
                    setError("Preview image is required");
                    return false;
                }
                return true;
            case 3:
                // Version and tags are optional, but validate version format if provided
                if (version && !/^\d+\.\d+\.\d+$/.test(version)) {
                    setError("Version must be in format X.Y.Z (e.g., 1.0.0)");
                    return false;
                }
                return true;
            default:
                return true;
        }
    };

    // Handle next step
    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(currentStep + 1);
        }
    };

    // Handle previous step
    const handlePrevious = () => {
        setCurrentStep(currentStep - 1);
        setError("");
    };

    // Handle form submission
    const handleSubmit = async () => {
        if (!validateStep(3)) {
            return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            const token = localStorage.getItem("userToken");
            if (!token) {
                router.push("/login");
                return;
            }

            const formData = new FormData();
            formData.append("title", title);
            formData.append("description", description);
            formData.append("category_id", selectedSubcategory || selectedCategory);
            formData.append("version", version);
            formData.append("compatibility", compatibility);
            formData.append("tags", tags);
            
            if (isPluginCategory()) {
                formData.append("github_url", githubUrl);
            } else if (mainFile) {
                formData.append("file", mainFile);
            }
            
            if (previewFile) {
                formData.append("preview", previewFile);
            }

            const response = await fetch("/api/assets/upload", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to upload asset");
            }

            setUploadedAssetId(data.asset?.asset_id || null);
            setSuccess(true);
        } catch (error: any) {
            setError(error.message || "Failed to upload asset");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="upload-page">
                <Navbar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
                <div className="upload-loading-container">
                    <div className="loading-spinner">Loading...</div>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    if (success) {
        return (
            <div className="upload-page">
                <Navbar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
                <div className="upload-wrapper">
                    <div className="upload-container">
                        <div className="upload-card success-card">
                            <div className="success-icon">✓</div>
                            <h2 className="upload-title">Upload Successful!</h2>
                            <p className="upload-subtitle">Your asset has been uploaded successfully.</p>
                            <div className="upload-actions">
                                <button 
                                    className="upload-button"
                                    onClick={() => {
                                        // Reset form
                                        setTitle("");
                                        setDescription("");
                                        setSelectedCategory("");
                                        setSelectedSubcategory("");
                                        setVersion("1.0.0");
                                        setCompatibility("");
                                        setTags("");
                                        setGithubUrl("");
                                        setMainFile(null);
                                        setPreviewFile(null);
                                        setPreviewUrl(null);
                                        setCurrentStep(1);
                                        setSuccess(false);
                                        setError("");
                                    }}
                                >
                                    Upload Another Asset
                                </button>
                                <button 
                                    className="upload-button secondary"
                                    onClick={() => router.push("/")}
                                >
                                    Go to Home
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="upload-page">
            <Navbar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
            <div className="upload-wrapper">
                <div className="upload-container">
                    <div className="upload-card">
                        <div className="upload-header">
                            <h1 className="upload-title">Upload Asset</h1>
                            <p className="upload-subtitle">Share your creation with the community</p>
                        </div>

                    {/* Progress Steps */}
                    <div className="upload-steps">
                        <div className={`step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
                            <div className="step-number">1</div>
                            <div className="step-label">Basic Info</div>
                        </div>
                        <div className={`step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
                            <div className="step-number">2</div>
                            <div className="step-label">Files</div>
                        </div>
                        <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
                            <div className="step-number">3</div>
                            <div className="step-label">Metadata</div>
                        </div>
                    </div>

                    {error && (
                        <div className="upload-error">
                            {error}
                        </div>
                    )}

                    {/* Step 1: Basic Info */}
                    {currentStep === 1 && (
                        <div className="upload-form-step">
                            <div className="form-group">
                                <label htmlFor="title">Title *</label>
                                <input
                                    type="text"
                                    id="title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Enter asset title"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="description">Description *</label>
                                <textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Describe your asset..."
                                    rows={6}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="category">Category *</label>
                                <select
                                    id="category"
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                >
                                    <option value="">Select a category</option>
                                    {categories.map((cat) => (
                                        <option key={cat.category_id} value={cat.category_id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {subcategories.length > 0 && (
                                <div className="form-group">
                                    <label htmlFor="subcategory">Subcategory</label>
                                    <select
                                        id="subcategory"
                                        value={selectedSubcategory}
                                        onChange={(e) => setSelectedSubcategory(e.target.value)}
                                    >
                                        <option value="">Select a subcategory (optional)</option>
                                        {subcategories.map((subcat) => (
                                            <option key={subcat.category_id} value={subcat.category_id}>
                                                {subcat.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="upload-form-actions">
                                <button 
                                    className="upload-button"
                                    onClick={handleNext}
                                    disabled={!title || !description || !selectedCategory}
                                >
                                    Next <FaArrowRight />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: File Upload */}
                    {currentStep === 2 && (
                        <div className="upload-form-step">
                            {isPluginCategory() ? (
                                <div className="form-group">
                                    <label htmlFor="github_url">
                                        <FaGithub /> GitHub Release URL *
                                    </label>
                                    <input
                                        type="url"
                                        id="github_url"
                                        value={githubUrl}
                                        onChange={(e) => setGithubUrl(e.target.value)}
                                        placeholder="https://github.com/username/repo/releases/tag/v1.0.0"
                                    />
                                    <small className="form-hint">
                                        For plugins, provide a link to the GitHub release page
                                    </small>
                                </div>
                            ) : (
                                <div className="form-group">
                                    <label htmlFor="file">
                                        <FaFile /> Asset File *
                                    </label>
                                    <div className="file-upload-area">
                                        <input
                                            type="file"
                                            id="file"
                                            onChange={(e) => setMainFile(e.target.files?.[0] || null)}
                                            className="file-input"
                                        />
                                        <div className="file-upload-label">
                                            <FaUpload />
                                            <span>{mainFile ? mainFile.name : "Click to upload or drag and drop"}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="form-group">
                                <label htmlFor="preview">
                                    <FaImage /> Preview Image *
                                </label>
                                <div className="file-upload-area">
                                    <input
                                        type="file"
                                        id="preview"
                                        accept="image/jpeg,image/jpg,image/png,image/webp"
                                        onChange={handlePreviewChange}
                                        className="file-input"
                                    />
                                    <div className="file-upload-label">
                                        <FaUpload />
                                        <span>{previewFile ? previewFile.name : "Click to upload preview image"}</span>
                                    </div>
                                </div>
                                {previewUrl && (
                                    <div className="preview-image-container">
                                        <img src={previewUrl} alt="Preview" className="preview-image" />
                                    </div>
                                )}
                            </div>

                            <div className="upload-form-actions">
                                <button 
                                    className="upload-button secondary"
                                    onClick={handlePrevious}
                                >
                                    <FaArrowLeft /> Previous
                                </button>
                                <button 
                                    className="upload-button"
                                    onClick={handleNext}
                                    disabled={
                                        (isPluginCategory() ? !githubUrl : !mainFile) || !previewFile
                                    }
                                >
                                    Next <FaArrowRight />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Metadata */}
                    {currentStep === 3 && (
                        <div className="upload-form-step">
                            <div className="form-group">
                                <label htmlFor="version">Version</label>
                                <input
                                    type="text"
                                    id="version"
                                    value={version}
                                    onChange={(e) => setVersion(e.target.value)}
                                    placeholder="1.0.0"
                                />
                                <small className="form-hint">Format: X.Y.Z (e.g., 1.0.0)</small>
                            </div>

                            <div className="form-group">
                                <label htmlFor="compatibility">Compatibility</label>
                                <input
                                    type="text"
                                    id="compatibility"
                                    value={compatibility}
                                    onChange={(e) => setCompatibility(e.target.value)}
                                    placeholder="Game version (e.g., 1.0.0)"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="tags">
                                    <FaTag /> Tags
                                </label>
                                <input
                                    type="text"
                                    id="tags"
                                    value={tags}
                                    onChange={(e) => setTags(e.target.value)}
                                    placeholder="tag1, tag2, tag3"
                                />
                                <small className="form-hint">Separate tags with commas</small>
                            </div>

                            <div className="upload-form-actions">
                                <button 
                                    className="upload-button secondary"
                                    onClick={handlePrevious}
                                >
                                    <FaArrowLeft /> Previous
                                </button>
                                <button 
                                    className="upload-button"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? "Uploading..." : "Upload Asset"}
                                </button>
                            </div>
                        </div>
                    )}
                    </div>
                </div>
            </div>
            
            {showCropper && tempPreviewFile && (
                <ImageCropper
                    imageFile={tempPreviewFile}
                    onCropComplete={handleCropComplete}
                    onCancel={handleCropCancel}
                    aspectRatio={1}
                />
            )}
        </div>
    );
}

