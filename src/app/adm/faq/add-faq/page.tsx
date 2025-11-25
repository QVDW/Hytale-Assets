"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";

import AdmNavbar from "../../../../../components/adm/AdmNavbar";
import useAuth from "../../../../../hooks/useAuth";
import AuthWrapper from "../../../../../components/adm/AuthWrapper";
import { getApiUrl } from '../../../../utils/apiConfig';

export default function AddFAQ() {
    useAuth();

    const [question, setQuestion] = useState("");
    const [answer, setAnswer] = useState("");
    const [isActive, setIsActive] = useState(true);

    const router = useRouter();

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!question || !answer) {
            alert("Please fill in all required fields.");
            return;
        }

        try {
            const res = await fetch(getApiUrl("/api/faq"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    question,
                    answer,
                    isActive,
                }),
            });

            if (!res.ok) {
                throw new Error(res.statusText);
            } else {
                router.push("/adm/faq");
                alert("FAQ added successfully.");
            }

        } catch (error) {
            console.log(error);
            alert("An error occurred. Please try again.");
        }
    }

    return (
        <AuthWrapper>
            <div className="flex column">
                <AdmNavbar />
                <div id="main-content">
                    <h1 className="adm-title">Add FAQ</h1>
                    <form onSubmit={handleSubmit} className="adm-form">
                        <label htmlFor="question">Question:</label>
                        <input 
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setQuestion(e.target.value)}
                            value={question}
                            type="text" 
                            id="question" 
                            name="question" 
                            placeholder="Enter the question"/>
                        
                        <label htmlFor="answer">Answer:</label>
                        <textarea 
                            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setAnswer(e.target.value)}
                            value={answer}
                            id="answer" 
                            name="answer" 
                            placeholder="Enter the answer"
                            rows={6}></textarea>
                        
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
                                Add FAQ
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthWrapper>
    );
} 