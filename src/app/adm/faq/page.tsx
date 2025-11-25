"use client";

import { useState } from "react";
import { CiSearch } from "react-icons/ci";
import { IoMdAddCircleOutline } from "react-icons/io";
import AdmNavbar from "../../../../components/adm/AdmNavbar";
import FAQ from "../../../../components/adm/faq/FAQ";
import Link from "next/link";
import useAuth from "../../../../hooks/useAuth";
import AuthWrapper from "../../../../components/adm/AuthWrapper";


export default function FAQs() {
    useAuth();
    const [searchQuery, setSearchQuery] = useState("");

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
    };

    return (
        <AuthWrapper>
            <div className="flex column">
                <AdmNavbar />
                <div id="main-content">
                    <h1 className="adm-title">FAQs</h1>
                    <form id="adm-search" onSubmit={handleSearchSubmit}>
                        <input 
                            type="text" 
                            placeholder="Search FAQs..." 
                            value={searchQuery}
                            onChange={handleSearch}
                        />
                        <button type="submit" className="adm-search-button adm-button">
                            <CiSearch />
                        </button>
                        <Link href="/adm/faq/add-faq" className="adm-button adm-add">
                            <IoMdAddCircleOutline />
                        </Link>
                    </form>
                    <div className="adm-items adm-long-text">
                        <FAQ searchQuery={searchQuery} />
                    </div>
                </div>
            </div>
        </AuthWrapper>
    );
} 