'use client';

import { useState } from 'react';
import { useAppStore } from '@/stores/app.store';
import { Check } from 'lucide-react';
import clsx from 'clsx';

const TAG_COLORS = [
  { name: 'gray', bg: 'bg-gray-500', text: 'text-gray-500', light: 'bg-gray-100' },
  { name: 'red', bg: 'bg-red-500', text: 'text-red-500', light: 'bg-red-100' },
  { name: 'orange', bg: 'bg-orange-500', text: 'text-orange-500', light: 'bg-orange-100' },
  { name: 'amber', bg: 'bg-amber-500', text: 'text-amber-500', light: 'bg-amber-100' },
  { name: 'yellow', bg: 'bg-yellow-500', text: 'text-yellow-500', light: 'bg-yellow-100' },
  { name: 'lime', bg: 'bg-lime-500', text: 'text-lime-500', light: 'bg-lime-100' },
  { name: 'green', bg: 'bg-green-500', text: 'text-green-500', light: 'bg-green-100' },
  { name: 'emerald', bg: 'bg-emerald-500', text: 'text-emerald-500', light: 'bg-emerald-100' },
  { name: 'teal', bg: 'bg-teal-500', text: 'text-teal-500', light: 'bg-teal-100' },
  { name: 'cyan', bg: 'bg-cyan-500', text: 'text-cyan-500', light: 'bg-cyan-100' },
  { name: 'sky', bg: 'bg-sky-500', text: 'text-sky-500', light: 'bg-sky-100' },
  { name: 'blue', bg: 'bg-blue-500', text: 'text-blue-500', light: 'bg-blue-100' },
  { name: 'indigo', bg: 'bg-indigo-500', text: 'text-indigo-500', light: 'bg-indigo-100' },
  { name: 'violet', bg: 'bg-violet-500', text: 'text-violet-500', light: 'bg-violet-100' },
  { name: 'purple', bg: 'bg-purple-500', text: 'text-purple-500', light: 'bg-purple-100' },
  { name: 'fuchsia', bg: 'bg-fuchsia-500', text: 'text-fuchsia-500', light: 'bg-fuchsia-100' },
  { name: 'pink', bg: 'bg-pink-500', text: 'text-pink-500', light: 'bg-pink-100' },
  { name: 'rose', bg: 'bg-rose-500', text: 'text-rose-500', light: 'bg-rose-100' },
];

const TAG_COLORS_STORAGE_KEY = 'omnifocus-tag-colors';

// Get tag color from localStorage
export function getTagColor(tagId: string): typeof TAG_COLORS[0] | null {
  if (typeof window === 'undefined') return null;
  const saved = localStorage.getItem(TAG_COLORS_STORAGE_KEY);
  if (!saved) return null;
  try {
    const colors = JSON.parse(saved);
    const colorName = colors[tagId];
    return TAG_COLORS.find(c => c.name === colorName) || null;
  } catch {
    return null;
  }
}

// Save tag color to localStorage
export function setTagColor(tagId: string, colorName: string | null) {
  if (typeof window === 'undefined') return;
  const saved = localStorage.getItem(TAG_COLORS_STORAGE_KEY);
  let colors: Record<string, string> = {};
  if (saved) {
    try {
      colors = JSON.parse(saved);
    } catch {}
  }
  if (colorName) {
    colors[tagId] = colorName;
  } else {
    delete colors[tagId];
  }
  localStorage.setItem(TAG_COLORS_STORAGE_KEY, JSON.stringify(colors));
}

interface TagColorPickerProps {
  tagId: string;
  onSelect?: (color: string | null) => void;
}

export function TagColorPicker({ tagId, onSelect }: TagColorPickerProps) {
  const { theme } = useAppStore();
  const [selectedColor, setSelectedColor] = useState<string | null>(() => {
    const color = getTagColor(tagId);
    return color?.name || null;
  });

  const handleSelect = (colorName: string | null) => {
    setSelectedColor(colorName);
    setTagColor(tagId, colorName);
    onSelect?.(colorName);
  };

  return (
    <div className="p-2">
      <p className={clsx(
        'text-xs font-medium mb-2',
        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
      )}>
        Tag Color
      </p>
      <div className="grid grid-cols-6 gap-1">
        {/* No color option */}
        <button
          onClick={() => handleSelect(null)}
          className={clsx(
            'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-transform hover:scale-110',
            selectedColor === null
              ? 'border-omnifocus-purple'
              : theme === 'dark'
                ? 'border-gray-600'
                : 'border-gray-300'
          )}
          title="No color"
        >
          {selectedColor === null && (
            <Check size={12} className="text-omnifocus-purple" />
          )}
        </button>
        {TAG_COLORS.map(color => (
          <button
            key={color.name}
            onClick={() => handleSelect(color.name)}
            className={clsx(
              'w-6 h-6 rounded-full transition-transform hover:scale-110 flex items-center justify-center',
              color.bg,
              selectedColor === color.name && 'ring-2 ring-offset-2 ring-omnifocus-purple',
              theme === 'dark' ? 'ring-offset-omnifocus-sidebar' : 'ring-offset-white'
            )}
            title={color.name}
          >
            {selectedColor === color.name && (
              <Check size={12} className="text-white" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// Colored tag badge component
interface ColoredTagProps {
  tagId: string;
  name: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function ColoredTag({ tagId, name, className, size = 'sm' }: ColoredTagProps) {
  const { theme } = useAppStore();
  const color = getTagColor(tagId);

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded px-1.5 py-0.5',
        size === 'sm' ? 'text-xs' : 'text-sm',
        color
          ? theme === 'dark'
            ? `${color.bg}/20 ${color.text}`
            : `${color.light} ${color.text}`
          : theme === 'dark'
            ? 'bg-omnifocus-surface text-gray-400'
            : 'bg-gray-100 text-gray-600',
        className
      )}
    >
      {color && (
        <span className={clsx('w-2 h-2 rounded-full mr-1', color.bg)} />
      )}
      {name}
    </span>
  );
}
