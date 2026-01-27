'use client';

import { useAppStore, Tag } from '@/stores/app.store';
import { Tags as TagsIcon, ChevronRight, Plus } from 'lucide-react';
import clsx from 'clsx';

interface TagItemProps {
  tag: Tag;
  level?: number;
}

function TagItem({ tag, level = 0 }: TagItemProps) {
  const { setFilterTagId, fetchActions, currentPerspective } = useAppStore();

  const handleClick = () => {
    setFilterTagId(tag.id);
    fetchActions(currentPerspective);
  };

  return (
    <>
      <li
        onClick={handleClick}
        className={clsx(
          'group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors',
          'hover:bg-omnifocus-surface border border-transparent'
        )}
        style={{ paddingLeft: `${12 + level * 16}px` }}
      >
        <div
          className="w-3 h-3 rounded-full shrink-0"
          style={{ backgroundColor: `hsl(${(tag.name.charCodeAt(0) * 47) % 360}, 70%, 60%)` }}
        />

        <div className="flex-1 min-w-0">
          <span className="text-sm text-white">{tag.name}</span>
          <p className="text-xs text-gray-500 mt-0.5">
            {tag._count?.actions || 0} actions
          </p>
        </div>

        <ChevronRight size={16} className="text-gray-500 shrink-0" />
      </li>

      {/* Render nested tags */}
      {tag.children && tag.children.length > 0 && (
        <>
          {tag.children.map((child) => (
            <TagItem key={child.id} tag={child} level={level + 1} />
          ))}
        </>
      )}
    </>
  );
}

export function TagList() {
  const { tags, isLoading } = useAppStore();

  // Get top-level tags (no parent)
  const topLevelTags = tags.filter(t => !t.parentId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-omnifocus-purple"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <header className="px-4 md:px-6 py-3 md:py-4 border-b border-omnifocus-border safe-area-top flex items-center justify-between">
        <h2 className="text-xl md:text-2xl font-semibold text-white">
          Tags
        </h2>
        <button
          className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-omnifocus-surface text-gray-400 hover:text-white hover:bg-omnifocus-border transition-colors text-sm"
        >
          <Plus size={16} />
          <span>New Tag</span>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-3 md:py-4">
        {topLevelTags.length === 0 ? (
          <div className="text-center py-12">
            <TagsIcon size={48} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-500">No tags yet</p>
            <p className="text-sm text-gray-600 mt-1">Create tags to organize your actions</p>
          </div>
        ) : (
          <ul className="space-y-1">
            {topLevelTags.map((tag) => (
              <TagItem key={tag.id} tag={tag} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
