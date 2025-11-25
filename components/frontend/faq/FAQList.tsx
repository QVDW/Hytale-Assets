"use client";

import { useState, useEffect } from 'react';
import FAQItem from './FAQItem';
import { getApiUrl } from '../../../src/utils/apiConfig';

interface FAQ {
  _id: string;
  question: string;
  answer: string;
  isActive: boolean;
}

interface FAQListProps {
  searchQuery: string;
}

const FAQList = ({ searchQuery }: FAQListProps) => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [filteredFaqs, setFilteredFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        const response = await fetch(getApiUrl('/api/faq'));
        if (!response.ok) {
          throw new Error('Failed to fetch FAQs');
        }
        const data = await response.json();
        
        // Filter out inactive FAQs
        const activeFaqs = Array.isArray(data) 
          ? data.filter((faq: FAQ) => faq.isActive) 
          : [];
        
        setFaqs(activeFaqs);
        setFilteredFaqs(activeFaqs);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching FAQs:', err);
        setError('Failed to load FAQ data. Please try again later.');
        setLoading(false);
      }
    };

    fetchFAQs();
  }, []);

  // Filter FAQs when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredFaqs(faqs);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = faqs.filter(faq => 
      faq.question.toLowerCase().includes(query) ||
      faq.answer.toLowerCase().includes(query)
    );
    
    setFilteredFaqs(filtered);
  }, [searchQuery, faqs]);

  if (loading) {
    return <div className="faq-loading">FAQ&#39;s aan het laden...</div>;
  }

  if (error) {
    return <div className="faq-error">{error}</div>;
  }

  if (filteredFaqs.length === 0) {
    return (
      <div className="faq-empty">
        {faqs.length === 0 
          ? "Geen FAQ's beschikbaar op het moment." 
          : "Geen FAQ's gevonden die voldoen aan je zoekopdracht."}
      </div>
    );
  }

  return (
    <div className="faq-list">
      {filteredFaqs.map((faq) => (
        <FAQItem
          key={faq._id}
          question={faq.question}
          answer={faq.answer}
        />
      ))}
    </div>
  );
};

export default FAQList; 