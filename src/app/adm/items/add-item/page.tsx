"use client";

import { useState, ChangeEvent, FormEvent, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

import AdmNavbar from "../../../../../components/adm/AdmNavbar";
import useAuth from "../../../../../hooks/useAuth";
import AuthWrapper from "../../../../../components/adm/AuthWrapper";
import { getApiUrl } from '../../../../utils/apiConfig';
import ImageCropper from "../../../../../components/ImageCropper";

export default function AddItem() {
    useAuth();

    const setDateWithMidnight = (date = new Date()) => {
        const localDate = new Date(date);
        localDate.setHours(0, 0, 0, 0);
        
        const offset = 1 * 60 * 60 * 1000; 
        const gmtPlus1Date = new Date(localDate.getTime() + offset);
        
        return gmtPlus1Date.toISOString().slice(0, 16);
    };

    const [name, setName] = useState("");
    const [category, setCategory] = useState("");
    const [tags, setTags] = useState<string[]>([]);
    const [link, setLink] = useState("");
    const [tempImage, setTempImage] = useState<File | null>(null);
    const [image, setImage] = useState<File | null>(null);
    const [releaseDate, setReleaseDate] = useState("");
    const [isFeatured, setIsFeatured] = useState(false);
    const [isActive, setIsActive] = useState(true);
    const [showCropper, setShowCropper] = useState(false);
    const nameInputRef = useRef<HTMLInputElement>(null);
    const cursorPositionRef = useRef<{start: number | null, end: number | null}>({start: null, end: null});

    const router = useRouter();

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

const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name || !category || !isActive) {
        alert("Please fill in all required fields.");
        return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("category", category);
    formData.append("tags", tags.join(','));
    formData.append("link", link);
    if (image) {
        formData.append("image", image);
    }
    formData.append("releaseDate", releaseDate);
    formData.append("isFeatured", isFeatured.toString());
    formData.append("isActive", isActive.toString());

    try {
        const res = await fetch(getApiUrl("/api/items"), {
            method: "POST",
            body: formData,
        });

        if (!res.ok) {
            throw new Error(res.statusText);
        } else {
            router.push("/adm/items");
            alert("Item added successfully.");
        }

    } catch (error) {
        console.log(error);
        alert("An error occurred. Please try again.");
    }
}

const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        if (validateImage(file)) {
            setTempImage(file);
            setShowCropper(true);
        } else {
            e.target.value = '';
            setTempImage(null);
            setImage(null);
        }
    }
};

const handleCropComplete = (croppedFile: File) => {
    setImage(croppedFile);
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
            setReleaseDate(dateWithMidnight);
            return;
        }
    }
    setReleaseDate(e.target.value);
};

const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    cursorPositionRef.current = {
        start: input.selectionStart,
        end: input.selectionEnd
    };
    
    const upperCaseName = input.value.toUpperCase();
    setName(upperCaseName);
};

useEffect(() => {
    if (nameInputRef.current && 
        cursorPositionRef.current.start !== null && 
        cursorPositionRef.current.end !== null) {
        nameInputRef.current.selectionStart = cursorPositionRef.current.start;
        nameInputRef.current.selectionEnd = cursorPositionRef.current.end;
    }
}, [name]);

    return (
        <AuthWrapper>
            <div className="flex column">
                <AdmNavbar />
                <div id="main-content">
                    <h1 className="adm-title">Add Item</h1>
                    <form onSubmit={handleSubmit} className="adm-form">
                        <label htmlFor="name">Name:</label>
                        <input 
                            ref={nameInputRef}
                            onChange={handleNameChange}
                            value={name}
                            type="text" 
                            id="name" 
                            name="name" 
                            placeholder="Item Name"/>
                        
                        <label htmlFor="category">Category:</label>
                        <input 
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setCategory(e.target.value)}
                            value={category}
                            type="text" 
                            id="category" 
                            name="category" 
                            placeholder="Item Category"/>
                        
                        <label htmlFor="link">Link (URL):</label>
                        <input 
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setLink(e.target.value)}
                            value={link}
                            type="url" 
                            id="link" 
                            name="link" 
                            placeholder="https://example.com"/>
                        
                        <label htmlFor="releaseDate">Release Date and Time:</label>
                        <input 
                            onChange={handleReleaseDateChange}
                            value={releaseDate}
                            onClick={() => {
                                if (!releaseDate) {
                                    setReleaseDate(setDateWithMidnight());
                                }
                            }}
                            min={setDateWithMidnight(new Date(2000, 0, 1))}
                            type="datetime-local" 
                            id="releaseDate" 
                            name="releaseDate"/>
                        
                        <label htmlFor="tags">Tags:</label>
                        <input 
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setTags(e.target.value.split(', '))}
                            value={tags.join(', ')}
                            type="text" 
                            id="tags" 
                            name="tags" 
                            placeholder="Item 1, Item 2, Item 3"/>
                        
                        <label htmlFor="image">Image:</label>
                        <input 
                            onChange={handleImageChange}
                            type="file" 
                            id="image" 
                            name="image"
                            accept="image/jpeg,image/png,image/gif,image/webp"
                        />
                        
                        {image && (
                            <div className="image-preview">
                                <p>Image selected: {image.name}</p>
                            </div>
                        )}
                        
                        <label htmlFor="isFeatured">Featured:</label>
                        <div className="checkbox-wrapper-22">
                            <label className="switch" htmlFor="isFeatured">
                                <input 
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setIsFeatured(e.target.checked)}
                                    checked={isFeatured}
                                    type="checkbox" 
                                    id="isFeatured" 
                                    name="isFeatured"/>
                                <div className="slider round"></div>
                            </label>
                        </div>
                        
                        <label htmlFor="isActive">Active:</label>
                        <div className="checkbox-wrapper-22">
                            <label className="switch" htmlFor="isActive">
                                <input 
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setIsActive(e.target.checked)}
                                    checked={isActive}
                                    type="checkbox" 
                                    id="isActive" 
                                    name="isActive"/>
                                <div className="slider round"></div>
                            </label>
                        </div>
                        
                        <div className="adm-form-buttons">
                            <button type="submit" className="adm-submit">
                                Add Item
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            
            {showCropper && tempImage && (
                <ImageCropper
                    imageFile={tempImage}
                    onCropComplete={handleCropComplete}
                    onCancel={handleCropCancel}
                />
            )}
        </AuthWrapper>
    );
}
