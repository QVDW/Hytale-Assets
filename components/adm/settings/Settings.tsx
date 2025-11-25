import React, { useState, useEffect } from 'react';
import ColorPicker from '../../ColorPicker';
import Link from 'next/link';
import { TbLayoutBottombar } from "react-icons/tb";
import { FaGavel } from "react-icons/fa";

interface ColorSettings {
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  background: string;
}

const Settings: React.FC = () => {
  const [colors, setColors] = useState<ColorSettings>({
    primary: '#1976d2',
    secondary: '#9c27b0',
    accent: '#ff4081',
    text: '#000000',
    background: '#ffffff'
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const rootStyle = getComputedStyle(document.documentElement);
    setColors({
      primary: rootStyle.getPropertyValue('--primary').trim() || '#1976d2',
      secondary: rootStyle.getPropertyValue('--secondary').trim() || '#9c27b0',
      accent: rootStyle.getPropertyValue('--accent').trim() || '#ff4081',
      text: rootStyle.getPropertyValue('--text').trim() || '#000000',
      background: rootStyle.getPropertyValue('--background').trim() || '#ffffff',
    });
  }, []); // Empty dependency array - only run on mount

  const handleColorChange = (colorType: keyof ColorSettings) => (newColor: string) => {
    setColors(prev => ({
      ...prev,
      [colorType]: newColor
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/settings/colors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(colors),
      });

      if (!response.ok) {
        throw new Error('Fout bij opslaan van kleuren');
      }

      Object.entries(colors).forEach(([key, value]) => {
        document.documentElement.style.setProperty(`--${key}`, value);
      });

      alert('Kleuren succesvol opgeslagen!');
    } catch (error) {
      console.error('Fout bij opslaan van kleuren:', error);
      alert('Fout bij opslaan van kleuren');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="settings-container">
      <h2>Site Instellingen</h2>
      
      <div className="settings-links">
        <Link href="/adm/settings/footer" className="settings-link">
          <TbLayoutBottombar />
          <span>Footer Instellingen</span>
        </Link>
        <Link href="/adm/settings/legal" className="settings-link">
          <FaGavel />
          <span>Juridische Instellingen</span>
        </Link>
      </div>
      
      <h3 className="settings-section-title">Website Kleuren</h3>
      <div className="color-theme-section">
        <div className="color-grid">
          <ColorPicker
            label="Primaire Kleur"
            color={colors.primary}
            onChange={handleColorChange('primary')}
          />
          <ColorPicker
            label="Secundaire Kleur"
            color={colors.secondary}
            onChange={handleColorChange('secondary')}
          />
          <ColorPicker
            label="Accent Kleur"
            color={colors.accent}
            onChange={handleColorChange('accent')}
          />
          <ColorPicker
            label="Tekst Kleur"
            color={colors.text}
            onChange={handleColorChange('text')}
          />
          <ColorPicker
            label="Achtergrond Kleur"
            color={colors.background}
            onChange={handleColorChange('background')}
          />
        </div>
        <button 
          onClick={handleSave} 
          disabled={isSaving}
          className="save-button"
        >
          {isSaving ? 'Opslaan...' : 'Kleuren Opslaan'}
        </button>
      </div>
    </div>
  );
};

export default Settings;