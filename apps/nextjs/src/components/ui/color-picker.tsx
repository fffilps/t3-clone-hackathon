
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label?: string;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange, label }) => {
  const [displayColorPicker, setDisplayColorPicker] = useState(false);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded border-2 border-gray-300 cursor-pointer"
          style={{ backgroundColor: color }}
          onClick={() => setDisplayColorPicker(!displayColorPicker)}
        />
        <Input
          type="color"
          value={color}
          onChange={handleColorChange}
          className="w-16 h-8 p-0 border-0 cursor-pointer"
        />
        <Input
          type="text"
          value={color}
          onChange={handleColorChange}
          className="flex-1"
          placeholder="#000000"
        />
      </div>
    </div>
  );
};
