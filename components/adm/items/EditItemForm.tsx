"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, FormEvent, ChangeEvent, useRef } from "react";
import { getApiUrl, getImageUrl } from "../../../src/utils/apiConfig";
import ImageCropper from "../../ImageCropper";
import Image from "next/image";

interface EditItemFormProps {
  id: string;
  name: string;
  category: string;
  tags: string[];
  image: string;
  link?: string;
  releaseDate?: string | Date;
  isFeatured: boolean;
  isActive: boolean;
}

export default function EditItemForm({ 
  id, 
  name, 
  category, 
  tags, 
  image, 
  link = "",
  releaseDate,
  isFeatured, 
  isActive 
}: EditItemFormProps) {
    console.log("EditItemForm received releaseDate:", releaseDate, typeof releaseDate);
    
    const setDateWithMidnight = (date = new Date()) => {
        const localDate = new Date(date);
        localDate.setHours(0, 0, 0, 0);
        
        const offset = 1 * 60 * 60 * 1000;
        const gmtPlus1Date = new Date(localDate.getTime() + offset);
        
        return gmtPlus1Date.toISOString().slice(0, 16);
    };
    
    const formatDateForInput = (dateValue: string | Date | undefined): string => {
        if (!dateValue) {
            return "";
        }
        
        if (dateValue instanceof Date) {
            const dateOnly = new Date(dateValue);
            dateOnly.setHours(0, 0, 0, 0);
            
            const offset = 1 * 60 * 60 * 1000;
            const gmtPlus1Date = new Date(dateOnly.getTime() + offset);
            
            const formattedDate = gmtPlus1Date.toISOString().slice(0, 16);
            return formattedDate;
        }
        
        try {
            const date = new Date(dateValue);
            if (!isNaN(date.getTime())) {
                date.setHours(0, 0, 0, 0);
                
                const offset = 1 * 60 * 60 * 1000;
                const gmtPlus1Date = new Date(date.getTime() + offset);
                
                const formattedDate = gmtPlus1Date.toISOString().slice(0, 16);
                return formattedDate;
            }
        } catch (error) {
            console.error("Error formatting date:", error);
        }
        
        return "";
    };

    const [newName, setNewName] = useState(name);
    const [newCategory, setNewCategory] = useState(category);
    const [newTags, setNewTags] = useState(tags);
    const [newLink, setNewLink] = useState(link);
    const [tempImage, setTempImage] = useState<File | null>(null);
    const [newImage, setNewImage] = useState<File | null>(null);
    const [newReleaseDate, setNewReleaseDate] = useState(formatDateForInput(releaseDate));
    const [currentImage, setCurrentImage] = useState(image);
    const [newIsFeatured, setNewIsFeatured] = useState(isFeatured);
    const [newIsActive, setNewIsActive] = useState(isActive);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showCropper, setShowCropper] = useState(false);
    const nameInputRef = useRef<HTMLInputElement>(null);
    const cursorPositionRef = useRef<{start: number | null, end: number | null}>({start: null, end: null});

    const router = useRouter();

    useEffect(() => {
        setCurrentImage(image);
    }, [image]);

    useEffect(() => {
        console.log("releaseDate changed:", releaseDate);
        setNewReleaseDate(formatDateForInput(releaseDate));
    }, [releaseDate]);

    useEffect(() => {
        setNewLink(link || "");
    }, [link]);

    const validateImage = (file: File) => {
        if (file.size > 5 * 1024 * 1024) {
            alert("Image file is too large. Maximum size is 5MB.");
            return false;
        }

        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            alert("Invalid image format. Please use JPEG, PNG, GIF, or WebP.");
            return false;
        }

        return true;
    };

    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            if (validateImage(file)) {
                setTempImage(file);
                setShowCropper(true);
            } else {
                e.target.value = '';
                setTempImage(null);
                setNewImage(null);
            }
        }
    };

    const handleCropComplete = (croppedFile: File) => {
        setNewImage(croppedFile);
        setShowCropper(false);
    };

    const handleCropCancel = () => {
        setTempImage(null);
        setShowCropper(false);
    };

    const handleReleaseDateChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.value) {
            const dateTimeParts = e.target.value.split('T');
            if (dateTimeParts.length === 2) {
                const dateWithMidnight = `${dateTimeParts[0]}T00:00`;
                setNewReleaseDate(dateWithMidnight);
                return;
            }
        }
        setNewReleaseDate(e.target.value);
    };

    const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
        const input = e.target;
        cursorPositionRef.current = {
            start: input.selectionStart,
            end: input.selectionEnd
        };
        
        const upperCaseName = input.value.toUpperCase();
        setNewName(upperCaseName);
    };

    useEffect(() => {
        if (nameInputRef.current && 
            cursorPositionRef.current.start !== null && 
            cursorPositionRef.current.end !== null) {
            nameInputRef.current.selectionStart = cursorPositionRef.current.start;
            nameInputRef.current.selectionEnd = cursorPositionRef.current.end;
        }
    }, [newName]);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData();
        formData.append("name", newName);
        formData.append("category", newCategory);
        formData.append("tags", newTags.join(','));
        formData.append("link", newLink);
        
        console.log("Submitting releaseDate:", newReleaseDate);
        formData.append("releaseDate", newReleaseDate);
        
        if (newImage) {
            formData.append("image", newImage);
        }
        
        formData.append("isFeatured", newIsFeatured.toString());
        formData.append("isActive", newIsActive.toString());

        try {
            const res = await fetch(getApiUrl(`/api/items/${id}`), {
                method: "PUT",
                body: formData,
            });

            if (!res.ok) {
                throw new Error(res.statusText);
            }
            
            const result = await res.json();
            console.log("Updated item:", result);
            
            alert("Item updated successfully.");
            router.push("/adm/items");
        } catch (error) {
            console.log("Error updating item:", error);
            alert("Error updating item. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="adm-form" id="edit-item-form">
                <label htmlFor="name">Name*:</label>
                <input 
                    ref={nameInputRef}
                    onChange={handleNameChange}
                    value={newName}
                    type="text" 
                    id="name" 
                    name="name" 
                    placeholder="Item Name"
                    required
                />
                
                <label htmlFor="category">Category*:</label>
                <input 
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setNewCategory(e.target.value)}
                    value={newCategory}
                    type="text" 
                    id="category" 
                    name="category" 
                    placeholder="Item Category"
                    required
                />
                
                <label htmlFor="link">Link (URL):</label>
                <input 
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setNewLink(e.target.value)}
                    value={newLink}
                    type="url" 
                    id="link" 
                    name="link" 
                    placeholder="https://example.com"
                />
                
                <label htmlFor="releaseDate">Release Date and Time:</label>
                <input 
                    onChange={handleReleaseDateChange}
                    value={newReleaseDate}
                    onClick={() => {
                        if (!newReleaseDate) {
                            setNewReleaseDate(setDateWithMidnight());
                        }
                    }}
                    min={setDateWithMidnight(new Date(2000, 0, 1))}
                    type="datetime-local" 
                    id="releaseDate" 
                    name="releaseDate"
                />
                
                <label htmlFor="tags">Tags:</label>
                <input 
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setNewTags(e.target.value.split(','))}
                    value={newTags.join(',')}
                    type="text" 
                    id="tags" 
                    name="tags" 
                    placeholder="Item Tags (comma separated)"
                />
                
                <label htmlFor="image">Current Image:</label>
                {currentImage ? (
                    <div className="current-image-container">
                        <Image 
                            src={getImageUrl(currentImage)}
                            alt="Current Image" 
                            width={100}
                            height={100}
                            style={{ width: "100px", height: "auto" }} 
                        />
                    </div>
                ) : (
                    <p>No image selected</p>
                )}
                
                <label htmlFor="newImage">New Image:</label>
                <input 
                    onChange={handleImageChange}
                    type="file" 
                    id="newImage" 
                    name="newImage"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                />
                
                {newImage && (
                    <div className="new-image-preview">
                        <p>New image selected: {newImage.name}</p>
                    </div>
                )}
                
                <label htmlFor="isFeatured">Featured:</label>
                <div className="checkbox-wrapper-22">
                    <label className="switch" htmlFor="isFeatured">
                        <input 
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setNewIsFeatured(e.target.checked)}
                            checked={newIsFeatured}
                            type="checkbox" 
                            id="isFeatured" 
                            name="isFeatured" 
                        />
                        <div className="slider round"></div>
                    </label>
                </div>
                
                <label htmlFor="isActive">Active:</label>
                <div className="checkbox-wrapper-22">
                    <label className="switch" htmlFor="isActive">
                        <input 
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setNewIsActive(e.target.checked)}
                            checked={newIsActive}
                            type="checkbox" 
                            id="isActive" 
                            name="isActive" 
                        />
                        <div className="slider round"></div>
                    </label>
                </div>
                
                <div className="adm-form-buttons">
                    <button 
                        type="submit" 
                        className="adm-submit" 
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Updating...' : 'Update Item'}
                    </button>
                </div>
            </form>
            
            {showCropper && tempImage && (
                <ImageCropper
                    imageFile={tempImage}
                    onCropComplete={handleCropComplete}
                    onCancel={handleCropCancel}
                />
            )}
        </>
    );
}