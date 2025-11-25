"use client";

import { useEffect, useState } from 'react';

export default function LegalDisclaimer() {
  const [disclaimer, setDisclaimer] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDisclaimer = async () => {
      try {
        const response = await fetch('/api/settings/legal');
        if (!response.ok) {
          throw new Error('Failed to fetch legal disclaimer');
        }
        const data = await response.json();
        const formattedDisclaimer = (data.disclaimer || '').replace(/\n/g, '<br>');
        setDisclaimer(formattedDisclaimer);
      } catch (err) {
        setError('Failed to load legal disclaimer');
        console.error('Error fetching legal disclaimer:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDisclaimer();
  }, []);

  if (isLoading) {
    return <div className="loading-text">Loading legal disclaimer...</div>;
  }

  if (error) {
    return <div className="error-text">{error}</div>;
  }

  return (
    <div className="legal-page">
      <h1>Legal Disclaimer</h1>
      <div className="legal-content" dangerouslySetInnerHTML={{ __html: disclaimer }} />
    </div>
  );
} 