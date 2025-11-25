"use client";

import { useState, useEffect, ChangeEvent, FormEvent, use } from "react";
import { useRouter } from "next/navigation";

import AdmNavbar from "../../../../../../components/adm/AdmNavbar";
import useAuth from "../../../../../../hooks/useAuth";
import AuthWrapper from "../../../../../../components/adm/AuthWrapper";
import { getApiUrl } from '../../../../../utils/apiConfig';

interface EditFAQParams {
    params: Promise<{
        id: string;
    }>;
}

interface FAQData {
    question: string;
    answer: string;
    isActive: boolean;
}

export default function EditFAQ(props: EditFAQParams) {
    useAuth();
    
    const params = use(props.params);
    const faqId = typeof params.id === 'string' ? params.id : '';
    const [faqData, setFaqData] = useState<FAQData>({
        question: "",
        answer: "",
        isActive: true
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const router = useRouter();
    
    useEffect(() => {
        async function fetchFAQ() {
            try {
                const res = await fetch(getApiUrl(`/api/faq/${faqId}`));
                if (!res.ok) {
                    throw new Error('Failed to fetch FAQ data');
                }
                const data = await res.json();
                setFaqData({
                    question: data.question,
                    answer: data.answer,
                    isActive: data.isActive ?? true
                });
                setIsLoading(false);
            } catch (error) {
                console.error('Error loading FAQ:', error);
                setError('Failed to load FAQ data. Please try again.');
                setIsLoading(false);
            }
        }

        if (faqId) {
            fetchFAQ();
        }
    }, [faqId]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFaqData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCheckboxChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFaqData(prev => ({
            ...prev,
            [name]: checked
        }));
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!faqData.question || !faqData.answer) {
            alert("Please fill in all required fields.");
            return;
        }

        try {
            const res = await fetch(getApiUrl(`/api/faq/${faqId}`), {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(faqData),
            });

            if (!res.ok) {
                throw new Error(res.statusText);
            } else {
                router.push("/adm/faq");
                alert("FAQ updated successfully.");
            }

        } catch (error) {
            console.log(error);
            alert("An error occurred. Please try again.");
        }
    }

    if (isLoading) return (
        <AuthWrapper>
            <div className="flex column">
                <AdmNavbar />
                <div id="main-content">
                    <h1 className="adm-title">Edit FAQ</h1>
                    <p>Loading...</p>
                </div>
            </div>
        </AuthWrapper>
    );

    if (error) return (
        <AuthWrapper>
            <div className="flex">
                <AdmNavbar />
                <div id="main-content">
                    <h1 className="adm-title">Edit FAQ</h1>
                    <p className="error">{error}</p>
                </div>
            </div>
        </AuthWrapper>
    );

    return (
        <AuthWrapper>
            <div className="flex">
                <AdmNavbar />
                <div id="main-content">
                    <h1 className="adm-title">Edit FAQ</h1>
                    <form onSubmit={handleSubmit} className="adm-form">
                        <label htmlFor="question">Question:</label>
                        <input 
                            onChange={handleChange}
                            value={faqData.question}
                            type="text" 
                            id="question" 
                            name="question" 
                            placeholder="Enter the question"/>
                        
                        <label htmlFor="answer">Answer:</label>
                        <textarea 
                            onChange={handleChange}
                            value={faqData.answer}
                            id="answer" 
                            name="answer" 
                            placeholder="Enter the answer"
                            rows={6}></textarea>
                        
                        <label htmlFor="isActive">Active:</label>
                        <div className="checkbox-wrapper-22">
                            <label className="switch" htmlFor="isActive">
                                <input 
                                    onChange={handleCheckboxChange}
                                    checked={faqData.isActive}
                                    type="checkbox" 
                                    id="isActive" 
                                    name="isActive"/>
                                <div className="slider round"></div>
                            </label>
                        </div>
                        
                        <div className="adm-form-buttons">
                            <button type="submit" className="adm-submit">
                                Update FAQ
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthWrapper>
    );
} 