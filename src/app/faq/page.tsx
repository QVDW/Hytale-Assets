"use client";

import { useState } from "react";
import { CiSearch } from "react-icons/ci";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import FAQList from "../../../components/frontend/faq/FAQList";

export default function FAQPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div>
      <Navbar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
      <div className="container">
        <main className="faq-page">
          <h1 className="faq-title">Frequently Asked Questions</h1>
          <p className="faq-intro">
            Find answers to the most common questions.
          </p>
          
          <div className="faq-search">
            <input 
              type="text" 
              placeholder="Search FAQs..." 
              value={searchQuery}
              onChange={handleSearch}
            />
            <span className="faq-search-icon">
              <CiSearch />
            </span>
          </div>
          
          <FAQList searchQuery={searchQuery} />
        </main>
      </div>
      <Footer />
    </div>
  );
} 