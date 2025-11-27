import { useState, useEffect } from "react";
import { FaEdit } from "react-icons/fa";
import { FaCircle } from "react-icons/fa";
import { FaFolder } from "react-icons/fa";
import RemoveBtn from "./RemoveBtn";
import Link from "next/link";
import { getApiUrl } from "../../../src/utils/apiConfig";
import Pagination from "../Pagination";

interface CategoryItem {
    category_id: string;
    name: string;
    parent_category_id: string | null;
    description: string | null;
    icon_url: string | null;
    sort_order: number;
    createdAt?: string | Date;
    updatedAt?: string | Date;
    children?: CategoryItem[];
}

interface CategoryProps {
    searchQuery: string;
}

const getCategories = async () => {
    try {
        const token = typeof window !== 'undefined' ? localStorage.getItem("adminToken") : null;
        
        const res = await fetch(getApiUrl('/api/assets/categories'), {
            cache: 'no-store',
            headers: token ? {
                "Authorization": `Bearer ${token}`,
            } : {}
        });

        if (!res.ok) {
            throw new Error(res.statusText);
        }
        const data = await res.json();
        // Flatten the hierarchical structure for display
        const allCategories: CategoryItem[] = [];
        
        const flattenCategories = (categories: CategoryItem[], parentName?: string) => {
            categories.forEach(cat => {
                const displayName = parentName ? `${parentName} > ${cat.name}` : cat.name;
                allCategories.push({
                    ...cat,
                    name: displayName
                });
                if (cat.children && cat.children.length > 0) {
                    flattenCategories(cat.children, cat.name);
                }
            });
        };
        
        if (data.categories && Array.isArray(data.categories)) {
            flattenCategories(data.categories);
        } else if (data.allCategories && Array.isArray(data.allCategories)) {
            // If we get flat list, use it directly
            return data.allCategories;
        } else if (Array.isArray(data)) {
            // If response is directly an array
            return data;
        }
        
        return allCategories;
    } catch (error) {
        console.log(error);
        return [];
    }
};

const Category = ({ searchQuery }: CategoryProps) => {
    const [categories, setCategories] = useState<CategoryItem[]>([]);
    const [filteredCategories, setFilteredCategories] = useState<CategoryItem[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        const fetchData = async () => {
            const data = await getCategories();
            setCategories(Array.isArray(data) ? data : []);
        };

        fetchData();
    }, []);

    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredCategories(categories);
            return;
        }

        const query = searchQuery.toLowerCase().trim();
        const filtered = categories.filter(category => {
            return (
                category.name.toLowerCase().includes(query) ||
                (category.description && category.description.toLowerCase().includes(query))
            );
        });

        setFilteredCategories(filtered);
        setCurrentPage(1);
    }, [searchQuery, categories]);
    
    const indexOfLastCategory = currentPage * itemsPerPage;
    const indexOfFirstCategory = indexOfLastCategory - itemsPerPage;
    const currentCategories = filteredCategories.slice(indexOfFirstCategory, indexOfLastCategory);
    
    const handlePageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber);
    };

    return (
        <>
            {filteredCategories.length > 0 ? (
                <>
                    {currentCategories.map((category) => (
                        <div className="adm-item" key={category.category_id}>
                            <div className="adm-item-left">
                                <FaFolder className="adm-item-icon"/>
                                <h2 className="adm-item-name">{category.name}</h2>
                            </div>
                            <div className="adm-item-details">
                                {category.description && (
                                    <div className="adm-item-answer">
                                        <span>Description: </span>
                                        <p>{category.description.length > 100 ? `${category.description.substring(0, 100)}...` : category.description}</p>
                                    </div>
                                )}
                                <div className="adm-item-status">
                                    <div className="status-indicator">
                                        <span className="status-label">Sort Order:</span>
                                        <span>{category.sort_order}</span>
                                    </div>
                                    {category.parent_category_id && (
                                        <div className="status-indicator">
                                            <span className="status-label">Subcategory:</span>
                                            <FaCircle className="status-circle active" />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="adm-item-buttons">
                                <Link href={`/adm/categories/edit-category/${category.category_id}`}>
                                    <FaEdit />
                                </Link>
                                <RemoveBtn id={category.category_id} />
                            </div>
                        </div>
                    ))}
                    
                    <Pagination 
                        totalItems={filteredCategories.length}
                        itemsPerPage={itemsPerPage}
                        currentPage={currentPage}
                        onPageChange={handlePageChange}
                    />
                </>
            ) : (
                <div className="no-items">
                    {searchQuery ? (
                        <p>No category found.</p>
                    ) : (
                        <p>No categories found.</p>
                    )}
                </div>
            )}
        </>
    );
};

export default Category;

