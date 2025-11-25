import React, { useState, useEffect } from 'react';

interface LegalSettings {
  disclaimer: string;
  privacyPolicy: string;
}

const LegalSettings: React.FC = () => {
  const defaultSettings: LegalSettings = {
    disclaimer: '',
    privacyPolicy: ''
  };
  
  const [legalSettings, setLegalSettings] = useState<LegalSettings>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      
      try {
        const res = await fetch('/api/settings/legal');
        
        if (!res.ok) {
          throw new Error(`API returned ${res.status}: ${res.statusText}`);
        }
        
        const data = await res.json();
        
        const parsedSettings: LegalSettings = {
          disclaimer: data.disclaimer || '',
          privacyPolicy: data.privacyPolicy || ''
        };
        
        setLegalSettings(parsedSettings);
      } catch (error) {
        console.error('Error fetching legal settings:', error);
        setErrorMessage('Failed to load settings. Please try refreshing the page.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleTextChange = (field: keyof LegalSettings, value: string) => {
    setLegalSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    
    try {
      const res = await fetch('/api/settings/legal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(legalSettings),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(`API error: ${errorData.message || res.statusText}`);
      }

      alert('Legal settings saved successfully!');
    } catch (error) {
      console.error('Error saving legal settings:', error);
      setErrorMessage('Failed to save settings. Please try again.');
      alert('Failed to save legal settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (confirm('Are you sure you want to reset all legal settings? This cannot be undone.')) {
      setIsLoading(true);
      try {
        const res = await fetch('/api/settings/legal', {
          method: 'DELETE'
        });
        
        if (res.ok) {
          const data = await res.json();
          
          if (data.settings) {
            setLegalSettings({
              disclaimer: data.settings.disclaimer || '',
              privacyPolicy: data.settings.privacyPolicy || ''
            });
          } else {
            fetchNewSettings();
          }
          
          alert('Legal settings reset successfully!');
        } else {
          throw new Error('Failed to reset settings');
        }
      } catch (error) {
        console.error('Error resetting settings:', error);
        setErrorMessage('Failed to reset settings. Please try refreshing the page.');
        fetchNewSettings();
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const fetchNewSettings = async () => {
    try {
      const res = await fetch('/api/settings/legal');
      if (res.ok) {
        const data = await res.json();
        
        setLegalSettings({
          disclaimer: data.disclaimer || '',
          privacyPolicy: data.privacyPolicy || ''
        });
      }
    } catch (error) {
      console.error('Error fetching settings after reset:', error);
    }
  };

  if (isLoading) {
    return <div className="loading-indicator">Legal settings are loading...</div>;
  }

  return (
    <div className="legal-settings-container">
      <h2>Legal Settings</h2>
      
      {errorMessage && (
        <div className="error-message">
          {errorMessage}
        </div>
      )}
      
      <div className="legal-section">
        <h3 className="settings-section-title">Legal Disclaimer</h3>
        <textarea
          value={legalSettings.disclaimer}
          onChange={(e) => handleTextChange('disclaimer', e.target.value)}
          placeholder="Enter your legal disclaimer text here..."
          rows={10}
        />
      </div>

      <div className="legal-section">
        <h3 className="settings-section-title">Privacy Policy</h3>
        <textarea
          value={legalSettings.privacyPolicy}
          onChange={(e) => handleTextChange('privacyPolicy', e.target.value)}
          placeholder="Enter your privacy policy text here..."
          rows={10}
        />
      </div>
      
      <div className="legal-actions">
        <button 
          className="reset-button" 
          onClick={handleReset} 
          disabled={isSaving || isLoading}
        >
          Reset to default
        </button>
        
        <button 
          className="save-button" 
          onClick={handleSave} 
          disabled={isSaving || isLoading}
        >
          {isSaving ? 'Saving...' : 'Save Legal Settings'}
        </button>
      </div>
    </div>
  );
};

export default LegalSettings; 