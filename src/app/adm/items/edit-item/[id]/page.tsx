"use client";

import { useEffect, useState } from "react";
import AdmNavbar from "../../../../../../components/adm/AdmNavbar";
import EditItemForm from "../../../../../../components/adm/items/EditItemForm";
import useAuth from "../../../../../../hooks/useAuth";
import AuthWrapper from "../../../../../../components/adm/AuthWrapper";
import { getApiUrl } from '../../../../../utils/apiConfig';

interface Item {
    _id: string;
    name: string;
    category?: string;
    tags?: string[];
    image?: string;
    link?: string;
    releaseDate?: string | Date;
    isFeatured?: boolean;
    isActive?: boolean;
}

interface PageParams {
    params: {
        id: string;
    };
}

export default function EditItem({ params }: PageParams) {
    const itemId = typeof params.id === 'string' ? params.id : '';
    
    const [item, setItem] = useState<Item | null>(null);
    const [loading, setLoading] = useState(true);
    const [isMounted, setIsMounted] = useState(false);
    useAuth();

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!isMounted) return;

        const fetchItem = async () => {
            try {
                const res = await fetch(getApiUrl(`/api/items/${itemId}`));
                if (!res.ok) throw new Error('Failed to fetch item');
                const data = await res.json();
                console.log("Fetched item data:", data); // Debug log
                
                // Check if data has an 'item' property (new API format)
                const itemData = data.item || data;
                setItem(itemData);
            } catch (error) {
                console.error('Error:', error);
            } finally {
                setLoading(false);
            }
        };

        if (itemId) fetchItem();
    }, [itemId, isMounted]);
    
    if (!isMounted) {
        return (
            <AuthWrapper>
                <div className="flex">
                    <AdmNavbar />
                    <div id="main-content">
                        <div aria-hidden="true"></div>
                    </div>
                </div>
            </AuthWrapper>
        );
    }

    if (loading) return (
        <AuthWrapper>
            <div className="flex">
                <AdmNavbar />
                <div id="main-content">
                    <div>Loading...</div>
                </div>
            </div>
        </AuthWrapper>
    );

    if (!item) return (
        <AuthWrapper>
            <div className="flex">
                <AdmNavbar />
                <div id="main-content">
                    <div>Item not found</div>
                </div>
            </div>
        </AuthWrapper>
    );

    return (
        <AuthWrapper>
            <div className="flex column">
                <AdmNavbar />
                <div id="main-content">
                    <h1 className="adm-title">Edit Item</h1>
                    <EditItemForm 
                        id={itemId}
                        name={item.name}
                        category={item.category || ''}
                        tags={item.tags || []}
                        image={item.image || ''}
                        link={item.link || ''}
                        releaseDate={item.releaseDate}
                        isFeatured={!!item.isFeatured}
                        isActive={!!item.isActive}
                    />
                </div>
            </div>
        </AuthWrapper>
    );
}