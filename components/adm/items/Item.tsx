import { useState, useEffect } from "react";
import { FaEdit } from "react-icons/fa";
import { TbBox } from "react-icons/tb";
import { FaCircle } from "react-icons/fa";
import RemoveBtn from "./RemoveBtn";
import Link from "next/link";
import { getApiUrl } from "../../../src/utils/apiConfig";
import Pagination from "../Pagination";

interface Item {
    _id: string;
    name: string;
    category?: string;
    tags?: string[];
    image?: string;
    releaseDate?: string | Date;
    isFeatured?: boolean;
    isActive?: boolean;
    createdAt?: string | Date;
    updatedAt?: string | Date;
    created_at?: string | Date;
    updated_at?: string | Date;
}

interface ItemProps {
    searchQuery: string;
}

const getItems = async () => {
    console.log("Fetching items data");
    try {
        const res = await fetch(getApiUrl('/api/items?sort=desc'), {
            cache: 'no-store',
        });

        if (!res.ok) {
            throw new Error(res.statusText);
        }
        return res.json();
    } catch (error) {
        console.log(error);
        return { items: [] };
    }
};

const Item = ({ searchQuery }: ItemProps) => {
    const [items, setItems] = useState<Item[]>([]);
    const [filteredItems, setFilteredItems] = useState<Item[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        console.log("Item component rendered");

        const fetchData = async () => {
            const data = await getItems();
            const itemsData: Item[] = Array.isArray(data) ? data : data?.items || [];
            
            if (itemsData.length > 0) {
                console.log('First item date fields:', {
                    releaseDate: itemsData[0].releaseDate,
                    updated_at: itemsData[0].updated_at,
                    created_at: itemsData[0].created_at
                });
            }
            
            const sortedItems = [...itemsData].sort((a, b) => {
                if (a.releaseDate && b.releaseDate) {
                    const dateA = new Date(a.releaseDate).getTime();
                    const dateB = new Date(b.releaseDate).getTime();
                    return dateB - dateA;
                }
                
                if (a.releaseDate && !b.releaseDate) return -1;
                if (!a.releaseDate && b.releaseDate) return 1;
                
                if (a.updated_at && b.updated_at) {
                    const dateA = new Date(a.updated_at).getTime();
                    const dateB = new Date(b.updated_at).getTime();
                    return dateB - dateA;
                }
                
                if (a.created_at && b.created_at) {
                    const dateA = new Date(a.created_at).getTime();
                    const dateB = new Date(b.created_at).getTime();
                    return dateB - dateA;
                }
                
                return b._id.localeCompare(a._id);
            });
            
            setItems(sortedItems);
        };

        fetchData();
    }, []);

    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredItems(items);
            return;
        }

        const query = searchQuery.toLowerCase().trim();
        const filtered = items.filter(item => {
            return (
                item.name.toLowerCase().includes(query) ||
                (item.category && item.category.toLowerCase().includes(query)) ||
                (item.tags && item.tags.some(tag => tag.toLowerCase().includes(query)))
            );
        });

        console.log(`Search "${query}" found ${filtered.length} items out of ${items.length}`);
        setFilteredItems(filtered);
        setCurrentPage(1);
    }, [searchQuery, items]);

    const formatDate = (dateString: string | Date | undefined) => {
        if (!dateString) return "Not set";
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };
    
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
    
    const handlePageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber);
    };

    return (
        <>
            {filteredItems.length > 0 ? (
                <>
                    {currentItems.map((item) => (
                        <div className="adm-item" key={item._id}>
                            <div className="adm-item-left">
                                <TbBox className="adm-item-icon"/>
                                <h2 className="adm-item-name">{item.name}</h2>
                            </div>
                            <div className="adm-item-details">
                                <div className="adm-item-release-date">
                                    <span>Release Date: </span>
                                    {formatDate(item.releaseDate)}
                                </div>
                                <div className="adm-item-status">
                                    <div><div className="status-indicator">
                                        <span className="status-label">Active:</span>
                                        <FaCircle className={`status-circle ${item.isActive ? 'active' : 'inactive'}`} />
                                    </div>
                                    <div className="status-indicator">
                                        <span className="status-label">Featured:</span>
                                        <FaCircle className={`status-circle ${item.isFeatured ? 'featured' : 'not-featured'}`} />
                                    </div>
                                    </div>
                                    <div className="adm-item-actions">
                                        <Link href={`/adm/items/edit-item/${item._id}`}>
                                            <FaEdit />
                                        </Link>
                                        <RemoveBtn id={item._id} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    <Pagination 
                        totalItems={filteredItems.length}
                        itemsPerPage={itemsPerPage}
                        currentPage={currentPage}
                        onPageChange={handlePageChange}
                    />
                </>
            ) : (
                <div className="no-items">
                    {searchQuery ? (
                        <p>No items match your search.</p>
                    ) : (
                        <p>No items found.</p>
                    )}
                </div>
            )}
        </>
    );
};

export default Item;