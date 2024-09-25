import React, { useState } from "react"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"

// Utility functions
const hexToHsl = (hex: string): { h: number; s: number; l: number } => {
  // Remove the hash if it's there
  hex = hex.replace(/^#/, '');

  // Parse the hex values
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

const hslToHex = (h: number, s: number, l: number): string => {
  h /= 360;
  s /= 100;
  l /= 100;
  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function ColorPicker({ onChange, defaultValue }: { onChange: (color: string) => void, defaultValue: string }) {
  const [selectedColor, _setSelectedColor] = useState(defaultValue || "#FFB3BA")
  const [hue, setHue] = useState(350)
  const [saturation, setSaturation] = useState(100)
  const [lightness, setLightness] = useState(85)

  const setSelectedColor = (color: string) => {
    _setSelectedColor(color)
    onChange(color)
  }

  const handleColorChange = (color: string) => {
    setSelectedColor(color)
    const hsl = hexToHsl(color)
    setHue(hsl.h)
    setSaturation(hsl.s)
    setLightness(hsl.l)
  }

  const handleHueChange = (value: number[]) => {
    const newHue = value[0]
    setHue(newHue)
    const newColor = hslToHex(newHue, saturation, lightness)
    setSelectedColor(newColor)
  }

  const handleSaturationChange = (value: number[]) => {
    const newSaturation = value[0]
    setSaturation(newSaturation)
    const newColor = hslToHex(hue, newSaturation, lightness)
    setSelectedColor(newColor)
  }

  const handleLightnessChange = (value: number[]) => {
    const newLightness = value[0]
    setLightness(newLightness)
    const newColor = hslToHex(hue, saturation, newLightness)
    setSelectedColor(newColor)
  }

  const handleManualColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value
    setSelectedColor(color)
    const hsl = hexToHsl(color)
    setHue(hsl.h)
    setSaturation(hsl.s)
    setLightness(hsl.l)
  }

  const presetColors = [
    "#BF3A50", // Muted Pink
    "#3ABF66", // Muted Green
    "#3A66BF", // Muted Blue
    "#BFBF3A", // Muted Yellow
    "#BF7C3A", // Muted Orange
    "#853ABF", // Muted Purple
    "#FFFFFF", // White
    "#000000"  // Black
  ]

  return (
    <div className="bg-background rounded-lg border p-4 w-full max-w-[250px]">
      <div className="grid grid-cols-4 gap-2 mb-4">
        {presetColors.map((color) => (
          <button
            key={color}
            className={`w-8 h-8 rounded-full transition-all ${selectedColor === color ? "ring-2 ring-primary" : "hover:ring-1 hover:ring-muted"
              }`}
            style={{ backgroundColor: color }}
            onClick={() => handleColorChange(color)}
          />
        ))}
      </div>
      <div className="grid gap-4">
        <div>
          <Label htmlFor="hue">Hue</Label>
          <Slider id="hue" min={0} max={360} value={[hue]} onValueChange={handleHueChange} />
        </div>
        <div>
          <Label htmlFor="saturation">Saturation</Label>
          <Slider id="saturation" min={0} max={100} value={[saturation]} onValueChange={handleSaturationChange} />
        </div>
        <div>
          <Label htmlFor="lightness">Lightness</Label>
          <Slider id="lightness" min={0} max={100} value={[lightness]} onValueChange={handleLightnessChange} />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <div
              className={`w-8 h-8 rounded-full border-2 border-background flex-shrink-0 ${selectedColor === "#ffffff" ? "ring-1 ring-muted" : ""}`}
              style={{ backgroundColor: selectedColor }}
            />
            <Input
              id="color-input"
              type="text"
              value={selectedColor}
              onChange={handleManualColorChange}
              className="flex-grow"
            />
          </div>
        </div>
      </div>
    </div>
  )
}