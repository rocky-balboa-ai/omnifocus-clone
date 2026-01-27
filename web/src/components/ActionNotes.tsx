'use client';

import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/stores/app.store';
import {
  FileText,
  Bold,
  Italic,
  List,
  ListOrdered,
  Link,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import clsx from 'clsx';

interface ActionNotesProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxHeight?: number;
  className?: string;
}

export function ActionNotes({
  value,
  onChange,
  placeholder = 'Add notes...',
  maxHeight = 200,
  className,
}: ActionNotesProps) {
  const { theme } = useAppStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, isExpanded ? 500 : maxHeight)}px`;
    }
  }, [value, isExpanded, maxHeight]);

  const insertMarkdown = (before: string, after: string = '') => {
    if (!textareaRef.current) return;

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const selectedText = value.substring(start, end);

    const newValue =
      value.substring(0, start) +
      before +
      selectedText +
      after +
      value.substring(end);

    onChange(newValue);

    // Set cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = start + before.length + selectedText.length + after.length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(
          start + before.length,
          start + before.length + selectedText.length
        );
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Bold: Cmd/Ctrl + B
    if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
      e.preventDefault();
      insertMarkdown('**', '**');
    }
    // Italic: Cmd/Ctrl + I
    if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
      e.preventDefault();
      insertMarkdown('*', '*');
    }
    // List: Cmd/Ctrl + L
    if ((e.metaKey || e.ctrlKey) && e.key === 'l') {
      e.preventDefault();
      insertMarkdown('- ');
    }
  };

  const EditorContent = () => (
    <div className={clsx(
      'rounded-xl border overflow-hidden',
      theme === 'dark'
        ? 'bg-omnifocus-surface border-omnifocus-border'
        : 'bg-white border-gray-200',
      isFullScreen && 'fixed inset-4 z-50 flex flex-col'
    )}>
      {/* Toolbar */}
      <div className={clsx(
        'flex items-center gap-1 px-2 py-1.5 border-b',
        theme === 'dark' ? 'border-omnifocus-border bg-omnifocus-bg/50' : 'border-gray-200 bg-gray-50'
      )}>
        <button
          onClick={() => insertMarkdown('**', '**')}
          className={clsx(
            'p-1.5 rounded transition-colors',
            theme === 'dark'
              ? 'text-gray-400 hover:text-white hover:bg-omnifocus-surface'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'
          )}
          title="Bold (⌘B)"
        >
          <Bold size={14} />
        </button>
        <button
          onClick={() => insertMarkdown('*', '*')}
          className={clsx(
            'p-1.5 rounded transition-colors',
            theme === 'dark'
              ? 'text-gray-400 hover:text-white hover:bg-omnifocus-surface'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'
          )}
          title="Italic (⌘I)"
        >
          <Italic size={14} />
        </button>
        <div className={clsx(
          'w-px h-4 mx-1',
          theme === 'dark' ? 'bg-omnifocus-border' : 'bg-gray-200'
        )} />
        <button
          onClick={() => insertMarkdown('- ')}
          className={clsx(
            'p-1.5 rounded transition-colors',
            theme === 'dark'
              ? 'text-gray-400 hover:text-white hover:bg-omnifocus-surface'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'
          )}
          title="Bullet list"
        >
          <List size={14} />
        </button>
        <button
          onClick={() => insertMarkdown('1. ')}
          className={clsx(
            'p-1.5 rounded transition-colors',
            theme === 'dark'
              ? 'text-gray-400 hover:text-white hover:bg-omnifocus-surface'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'
          )}
          title="Numbered list"
        >
          <ListOrdered size={14} />
        </button>
        <button
          onClick={() => insertMarkdown('[', '](url)')}
          className={clsx(
            'p-1.5 rounded transition-colors',
            theme === 'dark'
              ? 'text-gray-400 hover:text-white hover:bg-omnifocus-surface'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'
          )}
          title="Add link"
        >
          <Link size={14} />
        </button>

        <div className="flex-1" />

        <button
          onClick={() => setIsFullScreen(!isFullScreen)}
          className={clsx(
            'p-1.5 rounded transition-colors',
            theme === 'dark'
              ? 'text-gray-400 hover:text-white hover:bg-omnifocus-surface'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'
          )}
          title={isFullScreen ? 'Exit full screen' : 'Full screen'}
        >
          {isFullScreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={clsx(
          'w-full p-3 resize-none outline-none text-sm',
          isFullScreen ? 'flex-1' : '',
          theme === 'dark'
            ? 'bg-omnifocus-surface text-white placeholder-gray-500'
            : 'bg-white text-gray-900 placeholder-gray-400'
        )}
        style={{
          minHeight: isFullScreen ? 'auto' : '80px',
          maxHeight: isFullScreen ? 'none' : `${isExpanded ? 500 : maxHeight}px`,
        }}
      />

      {/* Expand button */}
      {value.length > 100 && !isFullScreen && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={clsx(
            'w-full flex items-center justify-center gap-1 py-1 text-xs transition-colors',
            theme === 'dark'
              ? 'text-gray-500 hover:text-white bg-omnifocus-bg/50'
              : 'text-gray-400 hover:text-gray-900 bg-gray-50'
          )}
        >
          {isExpanded ? (
            <>
              <ChevronUp size={12} />
              Show less
            </>
          ) : (
            <>
              <ChevronDown size={12} />
              Show more
            </>
          )}
        </button>
      )}
    </div>
  );

  return (
    <div className={className}>
      {isFullScreen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsFullScreen(false)}
        />
      )}
      <EditorContent />
    </div>
  );
}

// Compact notes preview
interface NotesPreviewProps {
  value: string;
  maxLines?: number;
  onClick?: () => void;
  className?: string;
}

export function NotesPreview({
  value,
  maxLines = 2,
  onClick,
  className,
}: NotesPreviewProps) {
  const { theme } = useAppStore();

  if (!value) return null;

  return (
    <div
      onClick={onClick}
      className={clsx(
        'text-sm',
        onClick && 'cursor-pointer',
        theme === 'dark' ? 'text-gray-400' : 'text-gray-500',
        className
      )}
      style={{
        display: '-webkit-box',
        WebkitLineClamp: maxLines,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}
    >
      {value}
    </div>
  );
}

// Notes indicator icon
interface NotesIndicatorProps {
  hasNotes: boolean;
  notesLength?: number;
  className?: string;
}

export function NotesIndicator({ hasNotes, notesLength, className }: NotesIndicatorProps) {
  const { theme } = useAppStore();

  if (!hasNotes) return null;

  return (
    <div
      className={clsx(
        'flex items-center gap-1',
        theme === 'dark' ? 'text-gray-500' : 'text-gray-400',
        className
      )}
      title={`${notesLength || 0} characters`}
    >
      <FileText size={14} />
    </div>
  );
}

// Inline editable notes
interface InlineNotesProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function InlineNotes({
  value,
  onChange,
  placeholder = 'Add notes...',
  className,
}: InlineNotesProps) {
  const { theme } = useAppStore();
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setIsEditing(false)}
        autoFocus
        placeholder={placeholder}
        className={clsx(
          'w-full p-2 rounded-lg border text-sm resize-none outline-none min-h-[60px]',
          theme === 'dark'
            ? 'bg-omnifocus-surface border-omnifocus-border text-white placeholder-gray-500'
            : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400',
          className
        )}
      />
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={clsx(
        'text-sm cursor-text',
        value
          ? theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          : theme === 'dark' ? 'text-gray-500' : 'text-gray-400',
        className
      )}
    >
      {value || placeholder}
    </div>
  );
}

// Read-only notes display with markdown rendering (basic)
interface NotesDisplayProps {
  value: string;
  className?: string;
}

export function NotesDisplay({ value, className }: NotesDisplayProps) {
  const { theme } = useAppStore();

  if (!value) return null;

  // Basic markdown rendering
  const renderMarkdown = (text: string) => {
    return text
      .split('\n')
      .map((line, i) => {
        // Headers
        if (line.startsWith('# ')) {
          return <h3 key={i} className="text-lg font-bold mb-2">{line.slice(2)}</h3>;
        }
        if (line.startsWith('## ')) {
          return <h4 key={i} className="text-base font-semibold mb-1">{line.slice(3)}</h4>;
        }

        // List items
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return (
            <div key={i} className="flex items-start gap-2 ml-2">
              <span className="text-omnifocus-purple mt-1.5">•</span>
              <span>{renderInline(line.slice(2))}</span>
            </div>
          );
        }

        // Numbered list
        const numMatch = line.match(/^(\d+)\.\s/);
        if (numMatch) {
          return (
            <div key={i} className="flex items-start gap-2 ml-2">
              <span className="text-omnifocus-purple">{numMatch[1]}.</span>
              <span>{renderInline(line.slice(numMatch[0].length))}</span>
            </div>
          );
        }

        // Empty line
        if (!line.trim()) {
          return <div key={i} className="h-2" />;
        }

        // Normal paragraph
        return <p key={i} className="mb-1">{renderInline(line)}</p>;
      });
  };

  // Inline markdown (bold, italic, links)
  const renderInline = (text: string) => {
    // This is a simplified version - for production, use a proper markdown library
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-omnifocus-purple underline">$1</a>');
  };

  return (
    <div
      className={clsx(
        'text-sm prose prose-sm max-w-none',
        theme === 'dark' ? 'text-gray-300 prose-invert' : 'text-gray-700',
        className
      )}
      dangerouslySetInnerHTML={{ __html: value
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-omnifocus-purple underline" target="_blank">$1</a>')
        .replace(/^# (.+)$/gm, '<h3 class="text-lg font-bold mb-2">$1</h3>')
        .replace(/^## (.+)$/gm, '<h4 class="text-base font-semibold mb-1">$1</h4>')
        .replace(/^- (.+)$/gm, '<div class="flex items-start gap-2 ml-2"><span class="text-purple-500 mt-1">•</span><span>$1</span></div>')
        .replace(/\n/g, '<br />')
      }}
    />
  );
}
