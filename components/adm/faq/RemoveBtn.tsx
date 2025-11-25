'use client';

import { IoTrashOutline } from "react-icons/io5";
import { useRouter } from "next/navigation";
import { getApiUrl } from "../../../src/utils/apiConfig";

interface RemoveBtnProps {
    id: string;
}

export default function RemoveBtn({ id }: RemoveBtnProps) {
    const router = useRouter();
    
    const removeFaq = async () => {
        const confirmed = confirm("Are you sure you want to delete this FAQ?");
        
        if (confirmed) {
            try {
                await fetch(getApiUrl(`/api/faq?id=${id}`), {
                    method: "DELETE",
                });
                router.refresh();
            } catch (error) {
                console.error("Error deleting FAQ:", error);
            }
        }
    };
            
    return (
        <button onClick={removeFaq} className="text-red-400">
            <IoTrashOutline size={18} />
        </button>
    );
} 