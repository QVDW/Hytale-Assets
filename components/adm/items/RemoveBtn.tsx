'use client';

import { IoTrashOutline } from "react-icons/io5";
import { useRouter } from "next/navigation";
import { getApiUrl } from "../../../src/utils/apiConfig";

interface RemoveBtnProps {
  id: string;
}

export default function RemoveBtn({ id }: RemoveBtnProps) {
  const router = useRouter();
  const removeItem = async () => {
    const confirmed = confirm("Are you sure you want to delete this item?");
    
    if (confirmed) {
      await fetch(getApiUrl(`/api/items?id=${id}`), {
        method: "DELETE",
      });
      
      router.refresh();
    }
  };

  return (
    <button onClick={removeItem} className="text-red-400">
      <IoTrashOutline size={18} />
    </button>
  );
}