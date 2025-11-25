import { useState, useEffect } from "react";
import { FaEdit } from "react-icons/fa";
import { FaCircle } from "react-icons/fa";
import { TbFilterQuestion } from "react-icons/tb";
import RemoveBtn from "./RemoveBtn";
import Link from "next/link";
import { getApiUrl } from "../../../src/utils/apiConfig";
import Pagination from "../Pagination";

interface FAQItem {
    _id: string;
    question: string;
    answer: string;
    isActive?: boolean;
    createdAt?: string | Date;
    updatedAt?: string | Date;
}

interface FAQProps {
    searchQuery: string;
}

const getFAQs = async () => {
    try {
        const res = await fetch(getApiUrl('/api/faq'), {
            cache: 'no-store',
        });

        if (!res.ok) {
            throw new Error(res.statusText);
        }
        return res.json();
    } catch (error) {
        console.log(error);
        return { faqs: [] };
    }
};

const FAQ = ({ searchQuery }: FAQProps) => {
    const [faqs, setFAQs] = useState<FAQItem[]>([]);
    const [filteredFAQs, setFilteredFAQs] = useState<FAQItem[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        const fetchData = async () => {
            const data = await getFAQs();
            const faqsData: FAQItem[] = Array.isArray(data) ? data : data?.faqs || [];
            setFAQs(faqsData);
        };

        fetchData();
    }, []);

    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredFAQs(faqs);
            return;
        }

        const query = searchQuery.toLowerCase().trim();
        const filtered = faqs.filter(faq => {
            return (
                faq.question.toLowerCase().includes(query) ||
                faq.answer.toLowerCase().includes(query)
            );
        });

        setFilteredFAQs(filtered);
        setCurrentPage(1);
    }, [searchQuery, faqs]);
    
    const indexOfLastFAQ = currentPage * itemsPerPage;
    const indexOfFirstFAQ = indexOfLastFAQ - itemsPerPage;
    const currentFAQs = filteredFAQs.slice(indexOfFirstFAQ, indexOfLastFAQ);
    
    const handlePageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber);
    };

    return (
        <>
            {filteredFAQs.length > 0 ? (
                <>
                    {currentFAQs.map((faq) => (
                        <div className="adm-item" key={faq._id}>
                            <div className="adm-item-left">
                                <TbFilterQuestion className="adm-item-icon"/>
                                <h2 className="adm-item-name">{faq.question}</h2>
                            </div>
                            <div className="adm-item-details">
                                <div className="adm-item-answer">
                                    <span>Answer: </span>
                                    <p>{faq.answer.length > 100 ? `${faq.answer.substring(0, 100)}...` : faq.answer}</p>
                                </div>
                                <div className="adm-item-status">
                                    <div className="status-indicator">
                                        <span className="status-label">Active:</span>
                                        <FaCircle className={`status-circle ${faq.isActive ? 'active' : 'inactive'}`} />
                                    </div>
                                </div>
                            </div>
                            <div className="adm-item-buttons">
                                <Link href={`/adm/faq/edit-faq/${faq._id}`}>
                                    <FaEdit />
                                </Link>
                                <RemoveBtn id={faq._id} />
                            </div>
                        </div>
                    ))}
                    
                    <Pagination 
                        totalItems={filteredFAQs.length}
                        itemsPerPage={itemsPerPage}
                        currentPage={currentPage}
                        onPageChange={handlePageChange}
                    />
                </>
            ) : (
                <div className="no-items">
                    {searchQuery ? (
                        <p>No FAQ found.</p>
                    ) : (
                        <p>No FAQ found.</p>
                    )}
                </div>
            )}
        </>
    );
};

export default FAQ; 