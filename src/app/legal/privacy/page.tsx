"use client";

import { useEffect, useState } from 'react';

export default function PrivacyPolicy() {
  const [privacyPolicy, setPrivacyPolicy] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrivacyPolicy = async () => {
      try {
        const response = await fetch('/api/settings/legal');
        if (!response.ok) {
          throw new Error('Failed to fetch privacy policy');
        }
        const data = await response.json();
        const formattedPrivacyPolicy = (data.privacyPolicy || '').replace(/\n/g, '<br>');
        setPrivacyPolicy(formattedPrivacyPolicy);
      } catch (err) {
        setError('Failed to load privacy policy');
        console.error('Error fetching privacy policy:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrivacyPolicy();
  }, []);

  if (isLoading) {
    return <div className="loading-text">Loading privacy policy...</div>;
  }

  if (error) {
    return <div className="error-text">{error}</div>;
  }

  return (
    <div className="legal-page">
      <h1>Privacy Policy</h1>
      <div className="legal-content" dangerouslySetInnerHTML={{ __html: privacyPolicy }} />
    </div>
  );
} 