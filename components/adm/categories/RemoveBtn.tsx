'use client';

import { IoTrashOutline } from "react-icons/io5";
import { useRouter } from "next/navigation";
import { getApiUrl } from "../../../src/utils/apiConfig";

interface RemoveBtnProps {
    id: string;
}

export default function RemoveBtn({ id }: RemoveBtnProps) {
    const router = useRouter();
    
    const removeCategory = async () => {
        const confirmed = confirm("Are you sure you want to delete this category? This will also delete all subcategories and assets in this category.");
        
        if (confirmed) {
            try {
                const token = typeof window !== 'undefined' ? localStorage.getItem("adminToken") : null;
                
                if (!token) {
                    alert("You must be logged in to delete categories.");
                    return;
                }

                const res = await fetch(getApiUrl(`/api/adm/categories?id=${id}`), {
                    method: "DELETE",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                    }
                });
                
                if (!res.ok) {
                    const error = await res.json();
                    alert(error.error || "Failed to delete category");
                    return;
                }
                
                router.refresh();
            } catch (error) {
                console.error("Error deleting category:", error);
                alert("An error occurred while deleting the category.");
            }
        }
    };
            
    return (
        <button onClick={removeCategory} className="text-red-400">
            <IoTrashOutline size={18} />
        </button>
    );
}

