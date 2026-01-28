'use client';

import { useAppStore } from '@/stores/app.store';
import { FolderOpen, Tag, X } from 'lucide-react';
import clsx from 'clsx';

export function FocusBar() {
  const {
    theme,
    focusedProjectId,
    focusedTagId,
    projects,
    tags,
    clearFocus,
  } = useAppStore();

  // Determine what we're focused on
  const focusedProject = focusedProjectId
    ? projects.find((p) => p.id === focusedProjectId)
    : null;
  const focusedTag = !focusedProject && focusedTagId
    ? tags.find((t) => t.id === focusedTagId)
    : null;

  // Don't render if not focused
  if (!focusedProject && !focusedTag) {
    return null;
  }

  const focusedName = focusedProject?.name || focusedTag?.name || 'Unknown';
  const Icon = focusedProject ? FolderOpen : Tag;

  return (
    <div
      className={clsx(
        'flex items-center justify-between px-4 py-2 border-b',
        theme === 'dark'
          ? 'bg-omnifocus-purple/10 border-omnifocus-purple/30 text-omnifocus-purple'
          : 'bg-purple-50 border-purple-200 text-purple-700'
      )}
    >
      <div className="flex items-center gap-2 text-sm">
        <Icon size={16} />
        <span className="font-medium">Focused on:</span>
        <span>{focusedName}</span>
      </div>

      <button
        onClick={clearFocus}
        className={clsx(
          'flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors',
          theme === 'dark'
            ? 'hover:bg-omnifocus-purple/20'
            : 'hover:bg-purple-100'
        )}
      >
        <X size={14} />
        Exit Focus
      </button>
    </div>
  );
}
