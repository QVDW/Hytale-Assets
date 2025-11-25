import React, { useState, useEffect } from 'react';
import { IoMdAddCircleOutline, IoMdRemoveCircleOutline } from "react-icons/io";
import { FaYoutube, FaFacebook, FaInstagram, FaTwitter, FaLinkedin, FaPhone, FaEnvelope, FaMapMarkerAlt, FaUser } from "react-icons/fa";

interface FooterItem {
  text: string;
  link: string;
  isExternal: boolean;
}

interface FooterColumn {
  title: string;
  items: FooterItem[];
}

interface SocialMedia {
  youtube: string;
  facebook: string;
  instagram: string;
  twitter: string;
  linkedin: string;
}

interface ContactInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
}

interface FooterSettings {
  columns: FooterColumn[];
  socialMedia: SocialMedia;
  contactInfo: ContactInfo;
  backgroundColor: string;
  textColor: string;
}

const defaultSettings: FooterSettings = {
  columns: [],
  socialMedia: {
    youtube: "",
    facebook: "",
    instagram: "",
    twitter: "",
    linkedin: ""
  },
  contactInfo: {
    name: "",
    address: "",
    phone: "",
    email: ""
  },
  backgroundColor: "#202020",
  textColor: "#fefefe"
};

const FooterSettings: React.FC = () => {
  
  const [footerSettings, setFooterSettings] = useState<FooterSettings>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      
      try {
        const res = await fetch('/api/settings/footer');
        
        if (!res.ok) {
          throw new Error(`API returned ${res.status}: ${res.statusText}`);
        }
        
        const data = await res.json();
        
        const parsedSettings: FooterSettings = {
          columns: Array.isArray(data.columns) ? data.columns : defaultSettings.columns,
          socialMedia: {
            youtube: data.socialMedia?.youtube || "",
            facebook: data.socialMedia?.facebook || "",
            instagram: data.socialMedia?.instagram || "",
            twitter: data.socialMedia?.twitter || "",
            linkedin: data.socialMedia?.linkedin || ""
          },
          contactInfo: {
            name: data.contactInfo?.name || "",
            address: data.contactInfo?.address || "",
            phone: data.contactInfo?.phone || "",
            email: data.contactInfo?.email || ""
          },
          backgroundColor: data.backgroundColor || defaultSettings.backgroundColor,
          textColor: data.textColor || defaultSettings.textColor
        };
        
        setFooterSettings(parsedSettings);
      } catch (error) {
        console.error('Error fetching footer settings:', error);
        setErrorMessage('Failed to load settings. Please try refreshing the page.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleColumnTitleChange = (index: number, value: string) => {
    const newColumns = [...footerSettings.columns];
    newColumns[index].title = value;
    setFooterSettings({ ...footerSettings, columns: newColumns });
  };

  const handleItemChange = (colIndex: number, itemIndex: number, field: keyof FooterItem, value: string | boolean) => {
    const newColumns = [...footerSettings.columns];
    if (field === 'text' || field === 'link') {
      newColumns[colIndex].items[itemIndex][field] = value as string;
    } else if (field === 'isExternal') {
      newColumns[colIndex].items[itemIndex][field] = value as boolean;
    }
    setFooterSettings({ ...footerSettings, columns: newColumns });
  };

  const handleAddItem = (colIndex: number) => {
    const newColumns = [...footerSettings.columns];
    newColumns[colIndex].items.push({ text: 'New Item', link: '/', isExternal: false });
    setFooterSettings({ ...footerSettings, columns: newColumns });
  };

  const handleRemoveItem = (colIndex: number, itemIndex: number) => {
    const newColumns = [...footerSettings.columns];
    newColumns[colIndex].items.splice(itemIndex, 1);
    setFooterSettings({ ...footerSettings, columns: newColumns });
  };

  const handleAddColumn = () => {
    const newColumns = [...footerSettings.columns];
    newColumns.push({
      title: 'New Column',
      items: [
        { text: 'Item 1', link: '/', isExternal: false },
        { text: 'Item 2', link: '/', isExternal: false }
      ]
    });
    setFooterSettings({ ...footerSettings, columns: newColumns });
  };

  const handleRemoveColumn = (index: number) => {
    const newColumns = [...footerSettings.columns];
    newColumns.splice(index, 1);
    setFooterSettings({ ...footerSettings, columns: newColumns });
  };

  const handleColorChange = (field: 'backgroundColor' | 'textColor', value: string) => {
    setFooterSettings({ ...footerSettings, [field]: value });
  };

  const handleSocialMediaChange = (platform: keyof SocialMedia, value: string) => {
    const updatedSocialMedia = {
      ...footerSettings.socialMedia,
      [platform]: value
    };
    
    setFooterSettings({
      ...footerSettings,
      socialMedia: updatedSocialMedia
    });
  };

  const handleContactInfoChange = (field: keyof ContactInfo, value: string) => {
    const updatedContactInfo = {
      ...footerSettings.contactInfo,
      [field]: value
    };
    
    setFooterSettings({
      ...footerSettings,
      contactInfo: updatedContactInfo
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    
    try {
      const dataToSend = {
        ...footerSettings,
        socialMedia: {
          youtube: footerSettings.socialMedia?.youtube || "",
          facebook: footerSettings.socialMedia?.facebook || "",
          instagram: footerSettings.socialMedia?.instagram || "",
          twitter: footerSettings.socialMedia?.twitter || "",
          linkedin: footerSettings.socialMedia?.linkedin || ""
        },
        contactInfo: {
          name: footerSettings.contactInfo?.name || "",
          address: footerSettings.contactInfo?.address || "",
          phone: footerSettings.contactInfo?.phone || "",
          email: footerSettings.contactInfo?.email || ""
        }
      };
      
      const res = await fetch('/api/settings/footer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(`API error: ${errorData.message || res.statusText}`);
      }

      const responseData = await res.json();
      
      if (responseData.settings && responseData.settings.socialMedia) {
        const returnedSettings = responseData.settings;
        
        const updatedSettings: FooterSettings = {
          columns: Array.isArray(returnedSettings.columns) ? returnedSettings.columns : footerSettings.columns,
          socialMedia: {
            youtube: returnedSettings.socialMedia?.youtube || "",
            facebook: returnedSettings.socialMedia?.facebook || "",
            instagram: returnedSettings.socialMedia?.instagram || "",
            twitter: returnedSettings.socialMedia?.twitter || "",
            linkedin: returnedSettings.socialMedia?.linkedin || ""
          },
          contactInfo: {
            name: returnedSettings.contactInfo?.name || "",
            address: returnedSettings.contactInfo?.address || "",
            phone: returnedSettings.contactInfo?.phone || "",
            email: returnedSettings.contactInfo?.email || ""
          },
          backgroundColor: returnedSettings.backgroundColor || footerSettings.backgroundColor,
          textColor: returnedSettings.textColor || footerSettings.textColor
        };
        
        setFooterSettings(updatedSettings);
      } else {
        const updatedRes = await fetch('/api/settings/footer');
        if (updatedRes.ok) {
          const updatedData = await updatedRes.json();
          
          const parsedSettings: FooterSettings = {
            columns: Array.isArray(updatedData.columns) ? updatedData.columns : defaultSettings.columns,
            socialMedia: {
              youtube: updatedData.socialMedia?.youtube || "",
              facebook: updatedData.socialMedia?.facebook || "",
              instagram: updatedData.socialMedia?.instagram || "",
              twitter: updatedData.socialMedia?.twitter || "",
              linkedin: updatedData.socialMedia?.linkedin || ""
            },
            contactInfo: {
              name: updatedData.contactInfo?.name || "",
              address: updatedData.contactInfo?.address || "",
              phone: updatedData.contactInfo?.phone || "",
              email: updatedData.contactInfo?.email || ""
            },
            backgroundColor: updatedData.backgroundColor || defaultSettings.backgroundColor,
            textColor: updatedData.textColor || defaultSettings.textColor
          };
          
          setFooterSettings(parsedSettings);
        }
      }
      
      alert('Footer instellingen succesvol opgeslagen!');
    } catch (error) {
      console.error('Error saving footer settings:', error);
      setErrorMessage('Failed to save settings. Please try again.');
      alert('Fout bij opslaan van footer instellingen');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (confirm('Weet je zeker dat je alle footer instellingen wilt resetten? Dit kan niet ongedaan worden gemaakt.')) {
      setIsLoading(true);
      try {
        const res = await fetch('/api/settings/footer', {
          method: 'DELETE'
        });
        
        if (res.ok) {
          const data = await res.json();
          
          if (data.settings) {
            const resetSettings: FooterSettings = {
              columns: Array.isArray(data.settings.columns) ? data.settings.columns : defaultSettings.columns,
              socialMedia: {
                youtube: data.settings.socialMedia?.youtube || "",
                facebook: data.settings.socialMedia?.facebook || "",
                instagram: data.settings.socialMedia?.instagram || "",
                twitter: data.settings.socialMedia?.twitter || "",
                linkedin: data.settings.socialMedia?.linkedin || ""
              },
              contactInfo: {
                name: data.settings.contactInfo?.name || "",
                address: data.settings.contactInfo?.address || "",
                phone: data.settings.contactInfo?.phone || "",
                email: data.settings.contactInfo?.email || ""
              },
              backgroundColor: data.settings.backgroundColor || defaultSettings.backgroundColor,
              textColor: data.settings.textColor || defaultSettings.textColor
            };
            
            setFooterSettings(resetSettings);
          } else {
            fetchNewSettings();
          }
          
          alert('Footer instellingen succesvol teruggezet!');
        } else {
          throw new Error('Fout bij terugzetten van footer instellingen');
        }
      } catch (error) {
        console.error('Error resetting settings:', error);
        setErrorMessage('Fout bij terugzetten van footer instellingen. Probeer het opnieuw.');
        fetchNewSettings();
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const fetchNewSettings = async () => {
    try {
      const res = await fetch('/api/settings/footer');
      if (res.ok) {
        const data = await res.json();
        
        const parsedSettings: FooterSettings = {
          columns: Array.isArray(data.columns) ? data.columns : defaultSettings.columns,
          socialMedia: {
            youtube: data.socialMedia?.youtube || "",
            facebook: data.socialMedia?.facebook || "",
            instagram: data.socialMedia?.instagram || "",
            twitter: data.socialMedia?.twitter || "",
            linkedin: data.socialMedia?.linkedin || ""
          },
          contactInfo: {
            name: data.contactInfo?.name || "",
            address: data.contactInfo?.address || "",
            phone: data.contactInfo?.phone || "",
            email: data.contactInfo?.email || ""
          },
          backgroundColor: data.backgroundColor || defaultSettings.backgroundColor,
          textColor: data.textColor || defaultSettings.textColor
        };
        
        setFooterSettings(parsedSettings);
      }
    } catch (error) {
      console.error('Error fetching settings after reset:', error);
    }
  };

  if (isLoading) {
    return <div className="loading-indicator">Footer instellingen worden geladen...</div>;
  }

  return (
    <div className="footer-settings-container">
      <h2>Footer Instellingen</h2>
      
      {errorMessage && (
        <div className="error-message">
          {errorMessage}
        </div>
      )}
      
      <div className="footer-colors">
        <div className="color-picker">
          <label>Achtergrond Kleur</label>
          <input 
            type="color" 
            value={footerSettings.backgroundColor} 
            onChange={(e) => handleColorChange('backgroundColor', e.target.value)} 
          />
          <input 
            type="text" 
            value={footerSettings.backgroundColor} 
            onChange={(e) => handleColorChange('backgroundColor', e.target.value)} 
          />
        </div>
        
        <div className="color-picker">
          <label>Tekst Kleur</label>
          <input 
            type="color" 
            value={footerSettings.textColor} 
            onChange={(e) => handleColorChange('textColor', e.target.value)} 
          />
          <input 
            type="text" 
            value={footerSettings.textColor} 
            onChange={(e) => handleColorChange('textColor', e.target.value)} 
          />
        </div>
      </div>

      <h3 className="settings-section-title">Contact Informatie</h3>
      <div className="contact-info-settings">
        <div className="contact-info-input">
          <div className="contact-icon">
            <FaUser />
          </div>
          <input
            type="text"
            value={footerSettings.contactInfo?.name || ""}
            onChange={(e) => handleContactInfoChange('name', e.target.value)}
            placeholder="Bedrijf/Organisatie Naam"
          />
        </div>
        
        <div className="contact-info-input">
          <div className="contact-icon">
            <FaMapMarkerAlt />
          </div>
          <input
            type="text"
            value={footerSettings.contactInfo?.address || ""}
            onChange={(e) => handleContactInfoChange('address', e.target.value)}
            placeholder="Adres"
          />
        </div>
        
        <div className="contact-info-input">
          <div className="contact-icon">
            <FaPhone />
          </div>
          <input
            type="text"
            value={footerSettings.contactInfo?.phone || ""}
            onChange={(e) => handleContactInfoChange('phone', e.target.value)}
            placeholder="Telefoonnummer"
          />
        </div>
        
        <div className="contact-info-input">
          <div className="contact-icon">
            <FaEnvelope />
          </div>
          <input
            type="email"
            value={footerSettings.contactInfo?.email || ""}
            onChange={(e) => handleContactInfoChange('email', e.target.value)}
            placeholder="E-mailadres"
          />
        </div>
      </div>

      <h3 className="settings-section-title">Social Media</h3>
      <div className="social-media-settings">
        <div className="social-media-input">
          <div className="social-icon youtube">
            <FaYoutube />
          </div>
          <input
            type="text"
            value={footerSettings.socialMedia?.youtube || ""}
            onChange={(e) => handleSocialMediaChange('youtube', e.target.value)}
            placeholder="YouTube URL"
          />
        </div>
        
        <div className="social-media-input">
          <div className="social-icon facebook">
            <FaFacebook />
          </div>
          <input
            type="text"
            value={footerSettings.socialMedia?.facebook || ""}
            onChange={(e) => handleSocialMediaChange('facebook', e.target.value)}
            placeholder="Facebook URL"
          />
        </div>
        
        <div className="social-media-input">
          <div className="social-icon instagram">
            <FaInstagram />
          </div>
          <input
            type="text"
            value={footerSettings.socialMedia?.instagram || ""}
            onChange={(e) => handleSocialMediaChange('instagram', e.target.value)}
            placeholder="Instagram URL"
          />
        </div>
        
        <div className="social-media-input">
          <div className="social-icon twitter">
            <FaTwitter />
          </div>
          <input
            type="text"
            value={footerSettings.socialMedia?.twitter || ""}
            onChange={(e) => handleSocialMediaChange('twitter', e.target.value)}
            placeholder="X (Twitter) URL"
          />
        </div>
        
        <div className="social-media-input">
          <div className="social-icon linkedin">
            <FaLinkedin />
          </div>
          <input
            type="text"
            value={footerSettings.socialMedia?.linkedin || ""}
            onChange={(e) => handleSocialMediaChange('linkedin', e.target.value)}
            placeholder="LinkedIn URL"
          />
        </div>
      </div>

      <h3 className="settings-section-title">Footer Kolommen</h3>
      <div className="footer-columns">
        {footerSettings.columns.map((column, colIndex) => (
          <div key={colIndex} className="footer-column">
            <div className="column-header">
              <input
                type="text"
                value={column.title}
                onChange={(e) => handleColumnTitleChange(colIndex, e.target.value)}
                placeholder="Kolom Titel"
              />
              <button 
                className="icon-button remove" 
                onClick={() => handleRemoveColumn(colIndex)}
                title="Kolom Verwijderen"
              >
                <IoMdRemoveCircleOutline />
              </button>
            </div>
            
            {column.items.map((item, itemIndex) => (
              <div key={itemIndex} className="footer-item">
                <input
                  type="text"
                  value={item.text}
                  onChange={(e) => handleItemChange(colIndex, itemIndex, 'text', e.target.value)}
                  placeholder="Item Tekst"
                />
                <input
                  type="text"
                  value={item.link}
                  onChange={(e) => handleItemChange(colIndex, itemIndex, 'link', e.target.value)}
                  placeholder="Item Link"
                />
                <div className="checkbox-wrapper">
                  <label htmlFor={`external-${colIndex}-${itemIndex}`}>Externe Link</label>
                  <input
                    type="checkbox"
                    id={`external-${colIndex}-${itemIndex}`}
                    checked={item.isExternal}
                    onChange={(e) => handleItemChange(colIndex, itemIndex, 'isExternal', e.target.checked)}
                  />
                </div>
                <button 
                  className="icon-button remove" 
                  onClick={() => handleRemoveItem(colIndex, itemIndex)}
                  title="Item Verwijderen"
                >
                  <IoMdRemoveCircleOutline />
                </button>
              </div>
            ))}
            
            <button 
              className="icon-button add" 
              onClick={() => handleAddItem(colIndex)}
              title="Item Toevoegen"
            >
              <IoMdAddCircleOutline /> Item Toevoegen
            </button>
          </div>
        ))}
      </div>
      
      <div className="footer-actions">
        <button 
          className="add-column-button" 
          onClick={handleAddColumn}
          disabled={footerSettings.columns.length >= 4}
        >
          <IoMdAddCircleOutline /> Kolom Titel Toevoegen
        </button>
        
        <div className="button-group">
          <button 
            className="reset-button" 
            onClick={handleReset} 
            disabled={isSaving || isLoading}
          >
            Reset naar standaard
          </button>
          
          <button 
            className="save-button" 
            onClick={handleSave} 
            disabled={isSaving || isLoading}
          >
            {isSaving ? 'Opslaan...' : 'Footer Instellingen Opslaan'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FooterSettings; 