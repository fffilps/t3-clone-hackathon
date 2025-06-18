import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label?: string;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  color,
  onChange,
  label,
}) => {
  const [displayColorPicker, setDisplayColorPicker] = useState(false);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <div className="flex items-center gap-2">
        <div
          className="h-8 w-8 cursor-pointer rounded border-2 border-gray-300"
          style={{ backgroundColor: color }}
          onClick={() => setDisplayColorPicker(!displayColorPicker)}
        />
        <Input
          type="color"
          value={color}
          onChange={handleColorChange}
          className="h-8 w-16 cursor-pointer border-0 p-0"
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
