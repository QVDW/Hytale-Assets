"use client";

import { useState, useEffect, forwardRef } from 'react';
import Link from 'next/link';
import { FaYoutube, FaFacebook, FaInstagram, FaTwitter, FaLinkedin, FaPhone, FaEnvelope, FaMapMarkerAlt } from "react-icons/fa";
import "../src/styles/frontend.scss";

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

const defaultFooterSettings: FooterSettings = {
  columns: [
    {
      title: "Title",
      items: [
        { text: "Item 1", link: "/", isExternal: false },
        { text: "Item 2", link: "/", isExternal: false },
        { text: "Item 3", link: "/", isExternal: false }
      ]
    },
    {
      title: "Title",
      items: [
        { text: "Item 1", link: "/", isExternal: false },
        { text: "Item 2", link: "/", isExternal: false },
        { text: "Item 3", link: "/", isExternal: false }
      ]
    },
    {
      title: "Title",
      items: [
        { text: "Item 1", link: "/", isExternal: false },
        { text: "Item 2", link: "/", isExternal: false },
        { text: "Item 3", link: "/", isExternal: false }
      ]
    },
    {
      title: "Title",
      items: [
        { text: "Item 1", link: "/", isExternal: false },
        { text: "Item 2", link: "/", isExternal: false },
        { text: "Item 3", link: "/", isExternal: false }
      ]
    }
  ],
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

interface FooterProps {
  className?: string;
}

const Footer = forwardRef<HTMLElement, FooterProps>(({ className }, ref) => {
  const [settings, setSettings] = useState<FooterSettings>(defaultFooterSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFooterSettings = async () => {
      try {
        console.log('[Footer] Fetching footer settings');
        const res = await fetch('/api/settings/footer');
        
        if (!res.ok) {
          throw new Error(`API returned ${res.status}: ${res.statusText}`);
        }
        
        const data = await res.json();
        console.log('[Footer] Settings received from API:', data);
        console.log('[Footer] Social media data received:', data.socialMedia);
        console.log('[Footer] Contact info data received:', data.contactInfo);
        
        const parsedSettings: FooterSettings = {
          columns: Array.isArray(data.columns) ? data.columns : defaultFooterSettings.columns,
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
          backgroundColor: data.backgroundColor || defaultFooterSettings.backgroundColor,
          textColor: data.textColor || defaultFooterSettings.textColor
        };
        
        console.log('[Footer] Using parsed social media data:', parsedSettings.socialMedia);
        console.log('[Footer] Using parsed contact info data:', parsedSettings.contactInfo);
        setSettings(parsedSettings);
      } catch (error) {
        console.error('[Footer] Error fetching footer settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFooterSettings();
  }, []);

  const renderLink = (item: FooterItem) => {
    if (item.isExternal) {
      return (
        <a href={item.link} target="_blank" rel="noopener noreferrer">
          {item.text}
        </a>
      );
    }
    return <Link href={item.link}>{item.text}</Link>;
  };

  const hasSocialMedia = settings.socialMedia && Object.values(settings.socialMedia).some(link => link && link.trim() !== "");

  const hasSocialMediaLink = (platform: keyof SocialMedia): boolean => {
    return Boolean(settings.socialMedia && 
                  settings.socialMedia[platform] && 
                  settings.socialMedia[platform].trim() !== "");
  };

  const hasContactInfo = settings.contactInfo && Object.values(settings.contactInfo).some(value => value && value.trim() !== "");

  const iconStyle = {
    color: settings.textColor,
    fontSize: '1.5rem'
  };

  const contactIconStyle = {
    color: settings.textColor,
    fontSize: '1.2rem',
    marginRight: '0.5rem'
  };

  if (isLoading) {
    return null;
  }

  return (
    <footer ref={ref} className={className} style={{ backgroundColor: settings.backgroundColor, color: settings.textColor }}>
      {hasContactInfo && (
        <div className="footer-contact">
          <div className="contact-info">
            {settings.contactInfo.name && settings.contactInfo.name.trim() !== "" && (
              <div className="contact-item">
                <span className="contact-text">{settings.contactInfo.name}</span>
              </div>
            )}
            {settings.contactInfo.address && settings.contactInfo.address.trim() !== "" && (
              <div className="contact-item">
                <FaMapMarkerAlt style={contactIconStyle} />
                <span className="contact-text">{settings.contactInfo.address}</span>
              </div>
            )}
            {settings.contactInfo.phone && settings.contactInfo.phone.trim() !== "" && (
              <div className="contact-item">
                <FaPhone style={contactIconStyle} />
                <a href={`tel:${settings.contactInfo.phone}`} className="contact-link">
                  {settings.contactInfo.phone}
                </a>
              </div>
            )}
            {settings.contactInfo.email && settings.contactInfo.email.trim() !== "" && (
              <div className="contact-item">
                <FaEnvelope style={contactIconStyle} />
                <a href={`mailto:${settings.contactInfo.email}`} className="contact-link">
                  {settings.contactInfo.email}
                </a>
              </div>
            )}
          </div>
        </div>
      )}
      
      {settings.columns.map((column, index) => (
        <div key={index} className="footer-column">
          <h3>{column.title}</h3>
          <ul>
            {column.items.map((item, itemIndex) => (
              <li key={itemIndex}>
                {renderLink(item)}
              </li>
            ))}
          </ul>
        </div>
      ))}
      
      {hasSocialMedia && (
        <div className="footer-social">
          <h3>Follow Us</h3>
          <div className="social-icons">
            {hasSocialMediaLink('youtube') && (
              <a href={settings.socialMedia.youtube} target="_blank" rel="noopener noreferrer" className="social-icon">
                <FaYoutube style={iconStyle} />
              </a>
            )}
            {hasSocialMediaLink('facebook') && (
              <a href={settings.socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="social-icon">
                <FaFacebook style={iconStyle} />
              </a>
            )}
            {hasSocialMediaLink('instagram') && (
              <a href={settings.socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="social-icon">
                <FaInstagram style={iconStyle} />
              </a>
            )}
            {hasSocialMediaLink('twitter') && (
              <a href={settings.socialMedia.twitter} target="_blank" rel="noopener noreferrer" className="social-icon">
                <FaTwitter style={iconStyle} />
              </a>
            )}
            {hasSocialMediaLink('linkedin') && (
              <a href={settings.socialMedia.linkedin} target="_blank" rel="noopener noreferrer" className="social-icon">
                <FaLinkedin style={iconStyle} />
              </a>
            )}
          </div>
        </div>
      )}
    </footer>
  );
});

Footer.displayName = 'Footer';

export default Footer;