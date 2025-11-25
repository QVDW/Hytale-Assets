import React from 'react';

interface ColorPickerProps {
  label: string;
  color: string;
  onChange: (color: string) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ label, color, onChange }) => {
  return (
    <div className="color-picker-container">
      <div className="color-picker-label">
        {label}
      </div>
      <div className="color-picker-controls">
        <input
          type="color"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="color-input"
        />
        <input
          type="text"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="text-input"
        />
      </div>
    </div>
  );
};

export default ColorPicker;