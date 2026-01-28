'use client';

import { useState } from 'react';
import { useAppStore } from '@/stores/app.store';
import { Link2, Plus, X, ExternalLink } from 'lucide-react';
import clsx from 'clsx';

export interface LinkItem {
  id: string;
  url: string;
  title: string;
}

interface LinkAttachmentProps {
  links: LinkItem[];
  onAdd: (link: { url: string; title: string }) => void;
  onRemove: (id: string) => void;
}

export function LinkAttachment({ links, onAdd, onRemove }: LinkAttachmentProps) {
  const { theme } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');

  const handleSubmit = () => {
    if (!url.trim()) return;

    // Auto-add https:// if missing
    let finalUrl = url.trim();
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }

    onAdd({
      url: finalUrl,
      title: title.trim(),
    });

    setUrl('');
    setTitle('');
    setShowForm(false);
  };

  const handleCancel = () => {
    setUrl('');
    setTitle('');
    setShowForm(false);
  };

  const openLink = (linkUrl: string) => {
    window.open(linkUrl, '_blank', 'noopener,noreferrer');
  };

  const getDisplayTitle = (link: LinkItem) => {
    if (link.title) return link.title;
    try {
      const urlObj = new URL(link.url);
      return urlObj.hostname;
    } catch {
      return link.url;
    }
  };

  return (
    <div className="space-y-2">
      {/* Existing Links */}
      {links.length > 0 && (
        <div className="space-y-1">
          {links.map((link) => (
            <div
              key={link.id}
              className={clsx(
                'group flex items-center gap-2 p-2 rounded-lg',
                theme === 'dark'
                  ? 'bg-omnifocus-surface hover:bg-omnifocus-border'
                  : 'bg-gray-50 hover:bg-gray-100'
              )}
            >
              <Link2 size={14} className="text-blue-500 shrink-0" />
              <button
                onClick={() => openLink(link.url)}
                className={clsx(
                  'flex-1 text-left text-sm truncate hover:underline',
                  theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                )}
                title={link.url}
              >
                {getDisplayTitle(link)}
              </button>
              <ExternalLink size={12} className="text-gray-400 shrink-0" />
              <button
                onClick={() => onRemove(link.id)}
                className={clsx(
                  'p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity',
                  theme === 'dark'
                    ? 'hover:bg-red-500/20 text-gray-500 hover:text-red-400'
                    : 'hover:bg-red-50 text-gray-400 hover:text-red-500'
                )}
                title="Remove link"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Link Form */}
      {showForm ? (
        <div
          className={clsx(
            'p-3 rounded-lg border space-y-2',
            theme === 'dark'
              ? 'bg-omnifocus-surface border-omnifocus-border'
              : 'bg-white border-gray-200'
          )}
        >
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            autoFocus
            className={clsx(
              'w-full px-3 py-2 rounded-lg border bg-transparent outline-none text-sm',
              theme === 'dark'
                ? 'border-omnifocus-border text-white placeholder-gray-500 focus:border-omnifocus-purple'
                : 'border-gray-200 text-gray-900 placeholder-gray-400 focus:border-omnifocus-purple'
            )}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit();
              if (e.key === 'Escape') handleCancel();
            }}
          />
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Link title (optional)"
            className={clsx(
              'w-full px-3 py-2 rounded-lg border bg-transparent outline-none text-sm',
              theme === 'dark'
                ? 'border-omnifocus-border text-white placeholder-gray-500 focus:border-omnifocus-purple'
                : 'border-gray-200 text-gray-900 placeholder-gray-400 focus:border-omnifocus-purple'
            )}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit();
              if (e.key === 'Escape') handleCancel();
            }}
          />
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={handleCancel}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-sm transition-colors',
                theme === 'dark'
                  ? 'text-gray-400 hover:text-white hover:bg-omnifocus-border'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              )}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!url.trim()}
              className="px-3 py-1.5 rounded-lg bg-omnifocus-purple text-white text-sm hover:bg-omnifocus-purple/90 disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className={clsx(
            'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors w-full',
            theme === 'dark'
              ? 'text-gray-400 hover:text-white hover:bg-omnifocus-surface'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
          )}
        >
          <Plus size={14} />
          Add Link
        </button>
      )}
    </div>
  );
}
