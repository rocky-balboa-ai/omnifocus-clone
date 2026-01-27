'use client';

import { useState } from 'react';
import { useAppStore } from '@/stores/app.store';
import { Battery, BatteryLow, BatteryMedium, BatteryFull, X } from 'lucide-react';
import clsx from 'clsx';

type EnergyLevel = 'all' | 'low' | 'medium' | 'high';

interface EnergyFilterProps {
  value: EnergyLevel;
  onChange: (level: EnergyLevel) => void;
}

export function EnergyFilter({ value, onChange }: EnergyFilterProps) {
  const { theme } = useAppStore();

  const options: { level: EnergyLevel; icon: any; label: string; color: string }[] = [
    { level: 'low', icon: BatteryLow, label: 'Low', color: 'text-green-400' },
    { level: 'medium', icon: BatteryMedium, label: 'Medium', color: 'text-yellow-400' },
    { level: 'high', icon: BatteryFull, label: 'High', color: 'text-red-400' },
  ];

  return (
    <div className="flex items-center gap-1">
      {value !== 'all' && (
        <button
          onClick={() => onChange('all')}
          className={clsx(
            'p-1.5 rounded transition-colors',
            theme === 'dark'
              ? 'text-gray-500 hover:text-white hover:bg-omnifocus-surface'
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
          )}
          title="Clear filter"
        >
          <X size={14} />
        </button>
      )}
      {options.map(({ level, icon: Icon, label, color }) => (
        <button
          key={level}
          onClick={() => onChange(value === level ? 'all' : level)}
          className={clsx(
            'flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors',
            value === level
              ? `bg-omnifocus-purple/20 ${color}`
              : theme === 'dark'
                ? 'text-gray-500 hover:text-gray-300 hover:bg-omnifocus-surface'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
          )}
          title={`${label} energy tasks`}
        >
          <Icon size={14} />
          <span className="hidden md:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}

// Utility to estimate energy level based on action properties
export function estimateEnergyLevel(action: {
  estimatedMinutes?: number;
  note?: string;
  title?: string;
}): EnergyLevel {
  // Long tasks usually require high energy
  if (action.estimatedMinutes && action.estimatedMinutes >= 60) return 'high';

  // Medium-length tasks
  if (action.estimatedMinutes && action.estimatedMinutes >= 30) return 'medium';

  // Short tasks are low energy
  if (action.estimatedMinutes && action.estimatedMinutes <= 15) return 'low';

  // Keywords suggesting high energy
  const highEnergyKeywords = ['write', 'create', 'design', 'develop', 'build', 'plan', 'analyze', 'research'];
  const title = (action.title || '').toLowerCase();
  if (highEnergyKeywords.some(k => title.includes(k))) return 'high';

  // Keywords suggesting low energy
  const lowEnergyKeywords = ['check', 'review', 'reply', 'email', 'call', 'read', 'send', 'update'];
  if (lowEnergyKeywords.some(k => title.includes(k))) return 'low';

  // Default to medium
  return 'medium';
}
