'use client';

import { useState } from 'react';
import { useAppStore, Tag } from '@/stores/app.store';
import { Tags as TagsIcon, ChevronRight, Plus, Search, X, CornerDownLeft, Trash2 } from 'lucide-react';
import clsx from 'clsx';

interface TagItemProps {
  tag: Tag;
  level?: number;
}

function TagItem({ tag, level = 0 }: TagItemProps) {
  const { setFilterTagId, fetchActions, currentPerspective, theme, deleteTag } = useAppStore();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleClick = () => {
    setFilterTagId(tag.id);
    fetchActions(currentPerspective);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete tag "${tag.name}"? Actions with this tag will not be deleted.`)) return;

    setIsDeleting(true);
    try {
      await deleteTag(tag.id);
    } catch (error) {
      console.error('Failed to delete tag:', error);
      alert('Failed to delete tag.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <li
        onClick={handleClick}
        className={clsx(
          'group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border border-transparent',
          theme === 'dark' ? 'hover:bg-omnifocus-surface' : 'hover:bg-gray-100'
        )}
        style={{ paddingLeft: `${12 + level * 16}px` }}
      >
        <div
          className="w-3 h-3 rounded-full shrink-0"
          style={{ backgroundColor: `hsl(${(tag.name.charCodeAt(0) * 47) % 360}, 70%, 60%)` }}
        />

        <div className="flex-1 min-w-0">
          <span className={clsx('text-sm', theme === 'dark' ? 'text-white' : 'text-gray-900')}>{tag.name}</span>
          <p className={clsx('text-xs mt-0.5', theme === 'dark' ? 'text-gray-500' : 'text-gray-500')}>
            {tag._count?.actions || 0} actions
          </p>
        </div>

        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className={clsx(
            'p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity',
            theme === 'dark'
              ? 'hover:bg-red-500/20 text-gray-500 hover:text-red-400'
              : 'hover:bg-red-50 text-gray-400 hover:text-red-500'
          )}
        >
          <Trash2 size={14} />
        </button>

        <ChevronRight size={16} className={theme === 'dark' ? 'text-gray-500' : 'text-gray-400'} />
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
  const { tags, isLoading, theme, setQuickEntryOpen, setSearchOpen, createTag } = useAppStore();
  const [showNewTagForm, setShowNewTagForm] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Get top-level tags (no parent)
  const topLevelTags = tags.filter(t => !t.parentId);

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    setIsCreating(true);
    try {
      await createTag({ name: newTagName.trim() });
      setNewTagName('');
      setShowNewTagForm(false);
    } catch (error) {
      console.error('Failed to create tag:', error);
      alert('Failed to create tag.');
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-omnifocus-purple"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <header className={clsx(
        'px-4 md:px-6 py-3 md:py-4 border-b safe-area-top flex items-center justify-between gap-3',
        theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200'
      )}>
        <div className="flex items-center gap-3 flex-1">
          <TagsIcon size={24} className="text-green-500" />
          <h2 className={clsx(
            'text-xl md:text-2xl font-semibold',
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            Tags
          </h2>
        </div>

        {/* Search button */}
        <button
          onClick={() => setSearchOpen(true)}
          className={clsx(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm',
            theme === 'dark'
              ? 'bg-omnifocus-surface text-gray-400 hover:text-white hover:bg-omnifocus-border'
              : 'bg-gray-100 text-gray-500 hover:text-gray-900 hover:bg-gray-200'
          )}
        >
          <Search size={16} />
          <kbd className={clsx(
            'hidden md:inline px-1.5 py-0.5 text-xs rounded',
            theme === 'dark' ? 'bg-omnifocus-bg' : 'bg-white border border-gray-200'
          )}>⌘K</kbd>
        </button>

        <button
          onClick={() => setShowNewTagForm(true)}
          className={clsx(
            'hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm',
            theme === 'dark'
              ? 'bg-omnifocus-purple text-white hover:bg-omnifocus-purple/90'
              : 'bg-omnifocus-purple text-white hover:bg-omnifocus-purple/90'
          )}
        >
          <Plus size={16} />
          <span>New Tag</span>
        </button>
      </header>

      {/* New Tag Form */}
      {showNewTagForm && (
        <div className={clsx(
          'mx-4 md:mx-6 mt-3 p-3 rounded-lg border',
          theme === 'dark'
            ? 'bg-omnifocus-surface border-omnifocus-border'
            : 'bg-white border-gray-200'
        )}>
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full shrink-0 bg-green-500"
            />
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateTag();
                } else if (e.key === 'Escape') {
                  setShowNewTagForm(false);
                  setNewTagName('');
                }
              }}
              placeholder="Tag name..."
              autoFocus
              className={clsx(
                'flex-1 bg-transparent outline-none text-sm',
                theme === 'dark' ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
              )}
            />
            <button
              onClick={handleCreateTag}
              disabled={isCreating || !newTagName.trim()}
              className="px-3 py-1.5 rounded bg-omnifocus-purple text-white text-sm flex items-center gap-1 hover:bg-omnifocus-purple/90 disabled:opacity-50"
            >
              {isCreating ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CornerDownLeft size={14} />
                  <span>Add</span>
                </>
              )}
            </button>
            <button
              onClick={() => {
                setShowNewTagForm(false);
                setNewTagName('');
              }}
              className={clsx(
                'p-1.5 rounded transition-colors',
                theme === 'dark'
                  ? 'hover:bg-omnifocus-border text-gray-400 hover:text-white'
                  : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
              )}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-3 md:py-4">
        {topLevelTags.length === 0 ? (
          <div className="text-center py-12">
            <TagsIcon size={48} className={clsx('mx-auto mb-4', theme === 'dark' ? 'text-gray-600' : 'text-gray-300')} />
            <p className={theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}>No tags yet</p>
            <p className={clsx('text-sm mt-1', theme === 'dark' ? 'text-gray-600' : 'text-gray-400')}>Create tags to organize your actions</p>
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
