'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ChevronDownIcon, SwatchIcon } from '@heroicons/react/24/outline';
import {
  DEFAULT_SUBJECT_COLOR,
  subjectPresetColors,
} from '@/lib/constants/subject-colors';

type SubjectColorPickerProps = {
  label?: string;
  description?: string;
  value?: string;
  onChange: (value: string) => void;
};

function normalizeHexColor(value: string) {
  const normalized = value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6).toUpperCase();
  if (!normalized) return '#';
  return `#${normalized}`;
}

function isValidHexColor(value: string) {
  return /^#[0-9A-F]{6}$/i.test(value);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function hexToRgb(hex: string) {
  const normalized = hex.replace('#', '');

  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b]
    .map((channel) => clamp(Math.round(channel), 0, 255).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()}`;
}

function rgbToHsv(r: number, g: number, b: number) {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;

  let hue = 0;

  if (delta !== 0) {
    if (max === red) {
      hue = ((green - blue) / delta) % 6;
    } else if (max === green) {
      hue = (blue - red) / delta + 2;
    } else {
      hue = (red - green) / delta + 4;
    }
  }

  hue = Math.round(hue * 60);
  if (hue < 0) hue += 360;

  const saturation = max === 0 ? 0 : (delta / max) * 100;
  const value = max * 100;

  return {
    h: hue,
    s: saturation,
    v: value,
  };
}

function hsvToRgb(h: number, s: number, v: number) {
  const saturation = clamp(s, 0, 100) / 100;
  const value = clamp(v, 0, 100) / 100;
  const chroma = value * saturation;
  const hueSection = (h % 360) / 60;
  const x = chroma * (1 - Math.abs((hueSection % 2) - 1));
  const match = value - chroma;

  let red = 0;
  let green = 0;
  let blue = 0;

  if (hueSection >= 0 && hueSection < 1) {
    red = chroma;
    green = x;
  } else if (hueSection < 2) {
    red = x;
    green = chroma;
  } else if (hueSection < 3) {
    green = chroma;
    blue = x;
  } else if (hueSection < 4) {
    green = x;
    blue = chroma;
  } else if (hueSection < 5) {
    red = x;
    blue = chroma;
  } else {
    red = chroma;
    blue = x;
  }

  return {
    r: (red + match) * 255,
    g: (green + match) * 255,
    b: (blue + match) * 255,
  };
}

function colorFromHue(hue: number) {
  const { r, g, b } = hsvToRgb(hue, 100, 100);
  return rgbToHex(r, g, b);
}

export function SubjectColorPicker({
  label = 'Cor da Disciplina',
  description,
  value = DEFAULT_SUBJECT_COLOR,
  onChange,
}: SubjectColorPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const saturationRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [hexValue, setHexValue] = useState(value.toUpperCase());
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [brightness, setBrightness] = useState(0);
  const inputId = useId();

  const safeColor = useMemo(
    () => (isValidHexColor(value) ? value.toUpperCase() : DEFAULT_SUBJECT_COLOR),
    [value]
  );

  useEffect(() => {
    setHexValue(safeColor);

    const rgb = hexToRgb(safeColor);
    const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
    setHue(hsv.h);
    setSaturation(hsv.s);
    setBrightness(hsv.v);
  }, [safeColor]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHexValue(safeColor);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [safeColor]);

  const applyHsvColor = (nextHue: number, nextSaturation: number, nextBrightness: number) => {
    const rgb = hsvToRgb(nextHue, nextSaturation, nextBrightness);
    onChange(rgbToHex(rgb.r, rgb.g, rgb.b));
  };

  const updateSaturationArea = (clientX: number, clientY: number) => {
    if (!saturationRef.current) return;

    const rect = saturationRef.current.getBoundingClientRect();
    const nextSaturation = clamp(((clientX - rect.left) / rect.width) * 100, 0, 100);
    const nextBrightness = clamp(100 - ((clientY - rect.top) / rect.height) * 100, 0, 100);

    applyHsvColor(hue, nextSaturation, nextBrightness);
  };

  const updateHueArea = (clientX: number) => {
    if (!hueRef.current) return;

    const rect = hueRef.current.getBoundingClientRect();
    const percent = clamp((clientX - rect.left) / rect.width, 0, 1);
    const nextHue = percent * 360;

    applyHsvColor(nextHue, saturation, brightness);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>

      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          {description}
        </p>
      )}

      <button
        id={inputId}
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-center gap-3 rounded-xl border-2 border-gray-300 bg-white px-3 py-3 text-left shadow-sm transition-all hover:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-100 dark:border-gray-600 dark:bg-gray-800 dark:focus:ring-primary-900/30"
      >
        <span
          className="h-10 w-10 shrink-0 rounded-lg border border-gray-200 dark:border-gray-600"
          style={{ backgroundColor: safeColor }}
        />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-gray-900 dark:text-white">
            Seletor de cores
          </span>
          <span className="block text-xs font-mono text-gray-500 dark:text-gray-400">
            {safeColor}
          </span>
        </span>
        <ChevronDownIcon
          className={`h-5 w-5 shrink-0 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-20 mt-3 w-full overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl dark:border-gray-700 dark:bg-gray-800 md:left-full md:top-0 md:-translate-y-20 md:ml-4 md:mt-0 md:w-[400px]">
          <div className="space-y-4">
            <div
              ref={saturationRef}
              className="relative block aspect-square w-full cursor-crosshair overflow-hidden rounded-xl border border-gray-200 shadow-sm dark:border-gray-700"
              style={{
                background: `linear-gradient(to top, rgba(0,0,0,1), rgba(0,0,0,0)), linear-gradient(to right, rgba(255,255,255,1), rgba(255,255,255,0)), ${colorFromHue(hue)}`,
              }}
              onPointerDown={(event) => {
                event.preventDefault();
                updateSaturationArea(event.clientX, event.clientY);

                const handlePointerMove = (moveEvent: PointerEvent) => {
                  updateSaturationArea(moveEvent.clientX, moveEvent.clientY);
                };

                const handlePointerUp = () => {
                  window.removeEventListener('pointermove', handlePointerMove);
                  window.removeEventListener('pointerup', handlePointerUp);
                };

                window.addEventListener('pointermove', handlePointerMove);
                window.addEventListener('pointerup', handlePointerUp);
              }}
            >
              <span
                className="absolute h-5 w-5 rounded-full border-2 border-white shadow-md"
                style={{
                  backgroundColor: safeColor,
                  left: `${saturation}%`,
                  top: `${100 - brightness}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              />
              <span className="absolute bottom-3 right-3 rounded-full bg-white/90 px-2 py-1 text-xs font-medium text-gray-700 shadow-sm dark:bg-gray-900/80 dark:text-gray-200">
                Mais cores
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary-200 bg-primary-50 text-primary-700 dark:border-primary-800 dark:bg-primary-900/30 dark:text-primary-300">
                <SwatchIcon className="h-5 w-5" />
              </div>

              <div
                ref={hueRef}
                className="relative h-3 flex-1 cursor-pointer rounded-full ring-1 ring-black/10 ring-inset"
                style={{
                  background:
                    'linear-gradient(to right, rgb(255, 0, 0), rgb(255, 255, 0), rgb(0, 255, 0), rgb(0, 255, 255), rgb(0, 0, 255), rgb(255, 0, 255), rgb(255, 0, 0))',
                }}
                onPointerDown={(event) => {
                  event.preventDefault();
                  updateHueArea(event.clientX);

                  const handlePointerMove = (moveEvent: PointerEvent) => {
                    updateHueArea(moveEvent.clientX);
                  };

                  const handlePointerUp = () => {
                    window.removeEventListener('pointermove', handlePointerMove);
                    window.removeEventListener('pointerup', handlePointerUp);
                  };

                  window.addEventListener('pointermove', handlePointerMove);
                  window.addEventListener('pointerup', handlePointerUp);
                }}
              >
                <span
                  className="absolute top-1/2 h-5 w-5 rounded-full border-2 border-white shadow-md"
                  style={{
                    backgroundColor: colorFromHue(hue),
                    left: `${(hue / 360) * 100}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                />
              </div>

              <div className="flex min-w-0 flex-1 items-center rounded-xl border border-gray-300 bg-white shadow-sm dark:border-gray-600 dark:bg-gray-900">
                <span
                  className="ml-3 h-4 w-4 shrink-0 rounded-full border border-gray-200 dark:border-gray-600"
                  style={{ backgroundColor: safeColor }}
                />
                <input
                  value={hexValue}
                  onChange={(event) => {
                    const normalized = normalizeHexColor(event.target.value);
                    setHexValue(normalized);

                    if (isValidHexColor(normalized)) {
                      onChange(normalized);
                    }
                  }}
                  onBlur={() => {
                    if (!isValidHexColor(hexValue)) {
                      setHexValue(safeColor);
                    }
                  }}
                  className="w-full bg-transparent px-3 py-2.5 text-sm font-mono text-gray-900 outline-none dark:text-white"
                  placeholder="#2563EB"
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Salvas
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Clique para aplicar
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {subjectPresetColors.map((color) => {
                  const isSelected = color.value === safeColor;

                  return (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => onChange(color.value)}
                      className={`h-7 w-7 rounded-full transition-transform hover:scale-110 ${
                        isSelected ? 'ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-gray-800' : ''
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.label}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
