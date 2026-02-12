'use client';

import { useState, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useAppStore, Tag } from '@/stores/app.store';
import { ChevronRight, ChevronDown, Tag as TagIcon } from 'lucide-react';
import clsx from 'clsx';

interface TagTreeProps {
  theme: 'light' | 'dark';
}

const themeClasses = {
  sectionTitle: {
    dark: 'text-gray-500',
    light: 'text-gray-400',
  },
  item: {
    active: 'bg-omnifocus-purple text-white',
    inactive: {
      dark: 'text-gray-400 hover:bg-omnifocus-surface hover:text-white',
      light: 'text-gray-600 hover:bg-omnifocus-light-surface hover:text-gray-900',
    },
  },
  count: {
    dark: 'bg-omnifocus-surface text-gray-400',
    light: 'bg-gray-200 text-gray-600',
  },
};

function TagItem({
  tag,
  allTags,
  level,
  theme,
  expandedTags,
  toggleTag,
  focusedTagId,
  setFocusedTag,
}: {
  tag: Tag;
  allTags: Tag[];
  level: number;
  theme: 'light' | 'dark';
  expandedTags: Set<string>;
  toggleTag: (id: string) => void;
  focusedTagId: string | null;
  setFocusedTag: (id: string) => void;
}) {
  const isExpanded = expandedTags.has(tag.id);
  const isActive = focusedTagId === tag.id;
  const childTags = allTags.filter(t => t.parentId === tag.id);
  const hasChildren = childTags.length > 0;
  const actionCount = tag._count?.actions || 0;

  return (
    <div>
      <button
        onClick={() => setFocusedTag(tag.id)}
        className={clsx(
          'w-full flex items-center gap-1 px-2 py-1.5 rounded text-sm transition-colors',
          isActive ? themeClasses.item.active : themeClasses.item.inactive[theme]
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        {hasChildren ? (
          <span
            onClick={(e) => {
              e.stopPropagation();
              toggleTag(tag.id);
            }}
            className="cursor-pointer"
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        ) : (
          <span className="w-3.5" />
        )}
        <TagIcon size={16} className={isActive ? 'text-white' : 'text-blue-400'} />
        <span className="flex-1 text-left truncate">{tag.name}</span>
        {actionCount > 0 && (
          <span className={clsx(
            'px-1.5 py-0.5 text-xs rounded-full font-medium',
            isActive ? 'bg-white/20' : themeClasses.count[theme]
          )}>
            {actionCount}
          </span>
        )}
      </button>

      {isExpanded && hasChildren && (
        <div>
          {childTags.map(childTag => (
            <TagItem
              key={childTag.id}
              tag={childTag}
              allTags={allTags}
              level={level + 1}
              theme={theme}
              expandedTags={expandedTags}
              toggleTag={toggleTag}
              focusedTagId={focusedTagId}
              setFocusedTag={setFocusedTag}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function TagTree({ theme }: TagTreeProps) {
  const { tags, focusedTagId, setFocusedTag, setCurrentPerspective } = useAppStore();
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedTags, setExpandedTags] = useState<Set<string>>(new Set());

  const isTagsActive = pathname === '/tags' || pathname.startsWith('/tags/');

  const toggleTag = (id: string) => {
    setExpandedTags(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Get root tags (no parent)
  const rootTags = useMemo(() => tags.filter(t => !t.parentId), [tags]);

  const handleTagClick = (tagId: string) => {
    setFocusedTag(tagId);
    setCurrentPerspective('tags');
  };

  return (
    <div className="mt-4">
      <div className="flex items-center gap-1 px-3 mb-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className={clsx('p-0.5 rounded hover:bg-gray-700/30', themeClasses.sectionTitle[theme])}
        >
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        <a
          href="/tags"
          className={clsx(
            'text-xs font-semibold uppercase tracking-wider transition-colors flex-1 py-1 -my-1',
            isTagsActive
              ? 'text-omnifocus-purple'
              : themeClasses.sectionTitle[theme],
            'hover:text-omnifocus-purple'
          )}
        >
          Tags
        </a>
      </div>

      {isExpanded && (
        <div className="space-y-0.5">
          {rootTags.map(tag => (
            <TagItem
              key={tag.id}
              tag={tag}
              allTags={tags}
              level={0}
              theme={theme}
              expandedTags={expandedTags}
              toggleTag={toggleTag}
              focusedTagId={focusedTagId}
              setFocusedTag={handleTagClick}
            />
          ))}
          {rootTags.length === 0 && (
            <p className={clsx('px-3 text-xs', theme === 'dark' ? 'text-gray-600' : 'text-gray-400')}>
              No tags yet
            </p>
          )}
        </div>
      )}
    </div>
  );
}
