"use client";

import { useState, ChangeEvent, FormEvent, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

import AdmNavbar from "../../../../../../components/adm/AdmNavbar";
import useAuth from "../../../../../../hooks/useAuth";
import AuthWrapper from "../../../../../../components/adm/AuthWrapper";
import { getApiUrl } from '../../../../../utils/apiConfig';

interface Category {
    category_id: string;
    name: string;
    parent_category_id: string | null;
}

export default function EditCategory() {
    useAuth();
    const params = useParams();
    const id = params.id as string;

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [parentCategoryId, setParentCategoryId] = useState<string>("");
    const [sortOrder, setSortOrder] = useState(0);
    const [iconUrl, setIconUrl] = useState("");
    const [parentCategories, setParentCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchCategory = async () => {
            try {
                const token = typeof window !== 'undefined' ? localStorage.getItem("adminToken") : null;
                
                if (!token) {
                    router.push("/adm/login");
                    return;
                }

                const res = await fetch(getApiUrl(`/api/adm/categories?id=${id}`), {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                    }
                });
                if (res.ok) {
                    const data = await res.json();
                    setName(data.name || "");
                    setDescription(data.description || "");
                    setParentCategoryId(data.parent_category_id || "");
                    setSortOrder(data.sort_order || 0);
                    setIconUrl(data.icon_url || "");
                } else {
                    alert("Category not found.");
                    router.push("/adm/categories");
                }
            } catch (error) {
                console.error("Error fetching category:", error);
                alert("An error occurred while loading the category.");
                router.push("/adm/categories");
            } finally {
                setLoading(false);
            }
        };

        const fetchCategories = async () => {
            try {
                const token = typeof window !== 'undefined' ? localStorage.getItem("adminToken") : null;
                
                const res = await fetch(getApiUrl('/api/assets/categories'), {
                    headers: token ? {
                        "Authorization": `Bearer ${token}`,
                    } : {}
                });
                if (res.ok) {
                    const data = await res.json();
                    // Get only parent categories (no parent_category_id) and exclude current category
                    const parents = (data.categories || []).filter((cat: Category) => cat.category_id !== id);
                    setParentCategories(parents);
                }
            } catch (error) {
                console.error("Error fetching categories:", error);
            }
        };

        if (id) {
            fetchCategory();
            fetchCategories();
        }
    }, [id, router]);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!name) {
            alert("Please fill in the category name.");
            return;
        }

        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem("adminToken") : null;
            
            if (!token) {
                alert("You must be logged in to edit categories.");
                router.push("/adm/login");
                return;
            }

            const res = await fetch(getApiUrl(`/api/adm/categories?id=${id}`), {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name,
                    description: description || null,
                    parent_category_id: parentCategoryId || null,
                    sort_order: sortOrder,
                    icon_url: iconUrl || null,
                }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || res.statusText);
            } else {
                router.push("/adm/categories");
                alert("Category updated successfully.");
            }

        } catch (error: any) {
            console.log(error);
            alert(error.message || "An error occurred. Please try again.");
        }
    }

    if (loading) {
        return (
            <AuthWrapper>
                <div className="flex column">
                    <AdmNavbar />
                    <div id="main-content">
                        <h1 className="adm-title">Edit Category</h1>
                        <p>Loading...</p>
                    </div>
                </div>
            </AuthWrapper>
        );
    }

    return (
        <AuthWrapper>
            <div className="flex column">
                <AdmNavbar />
                <div id="main-content">
                    <h1 className="adm-title">Edit Category</h1>
                    <form onSubmit={handleSubmit} className="adm-form">
                        <label htmlFor="name">Name: *</label>
                        <input 
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                            value={name}
                            type="text" 
                            id="name" 
                            name="name" 
                            placeholder="Enter category name"
                            required/>
                        
                        <label htmlFor="description">Description:</label>
                        <textarea 
                            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                            value={description}
                            id="description" 
                            name="description" 
                            placeholder="Enter category description (optional)"
                            rows={4}></textarea>
                        
                        <label htmlFor="parentCategory">Parent Category:</label>
                        <select
                            id="parentCategory"
                            name="parentCategory"
                            value={parentCategoryId}
                            onChange={(e: ChangeEvent<HTMLSelectElement>) => setParentCategoryId(e.target.value)}
                        >
                            <option value="">None (Top-level category)</option>
                            {parentCategories.map((cat) => (
                                <option key={cat.category_id} value={cat.category_id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                        <small style={{ color: '#666', fontSize: '0.9rem' }}>
                            Select a parent category to make this a subcategory, or leave as "None" for a top-level category.
                        </small>
                        
                        <label htmlFor="sortOrder">Sort Order:</label>
                        <input 
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setSortOrder(parseInt(e.target.value) || 0)}
                            value={sortOrder}
                            type="number" 
                            id="sortOrder" 
                            name="sortOrder" 
                            placeholder="0"
                            min="0"/>
                        <small style={{ color: '#666', fontSize: '0.9rem' }}>
                            Lower numbers appear first. Default is 0.
                        </small>
                        
                        <label htmlFor="iconUrl">Icon URL:</label>
                        <input 
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setIconUrl(e.target.value)}
                            value={iconUrl}
                            type="url" 
                            id="iconUrl" 
                            name="iconUrl" 
                            placeholder="https://example.com/icon.png (optional)"/>
                        
                        <div className="adm-form-buttons">
                            <button type="submit" className="adm-submit">
                                Update Category
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthWrapper>
    );
}

