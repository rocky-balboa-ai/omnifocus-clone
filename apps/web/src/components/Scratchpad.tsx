'use client';

import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/stores/app.store';
import { StickyNote, X, Minimize2, Maximize2, Trash2, ArrowRight, Plus } from 'lucide-react';
import clsx from 'clsx';

const SCRATCHPAD_STORAGE_KEY = 'omnifocus-scratchpad';

interface ScratchpadNote {
  id: string;
  content: string;
  createdAt: string;
}

export function Scratchpad() {
  const { theme, createAction, fetchActions, currentPerspective } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [notes, setNotes] = useState<ScratchpadNote[]>([]);
  const [currentNote, setCurrentNote] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load notes from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(SCRATCHPAD_STORAGE_KEY);
      if (saved) {
        try {
          setNotes(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to load scratchpad notes:', e);
        }
      }
    }
  }, []);

  // Save notes to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(SCRATCHPAD_STORAGE_KEY, JSON.stringify(notes));
    }
  }, [notes]);

  const handleSaveNote = () => {
    if (!currentNote.trim()) return;

    const newNote: ScratchpadNote = {
      id: Math.random().toString(36).substr(2, 9),
      content: currentNote.trim(),
      createdAt: new Date().toISOString(),
    };

    setNotes(prev => [newNote, ...prev]);
    setCurrentNote('');
    textareaRef.current?.focus();
  };

  const handleDeleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const handleConvertToAction = async (note: ScratchpadNote) => {
    try {
      await createAction({
        title: note.content.split('\n')[0].slice(0, 100), // First line as title
        note: note.content.split('\n').slice(1).join('\n') || undefined, // Rest as note
      });
      handleDeleteNote(note.id);
      fetchActions(currentPerspective);
    } catch (error) {
      console.error('Failed to convert to action:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSaveNote();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={clsx(
          'fixed bottom-24 md:bottom-4 right-4 z-30 p-3 rounded-full shadow-lg transition-all hover:scale-110',
          theme === 'dark'
            ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
            : 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
        )}
        title="Open Scratchpad"
      >
        <StickyNote size={24} />
      </button>
    );
  }

  return (
    <div className={clsx(
      'fixed z-40 shadow-2xl rounded-lg border overflow-hidden transition-all',
      theme === 'dark'
        ? 'bg-omnifocus-sidebar border-omnifocus-border'
        : 'bg-white border-gray-200',
      isMinimized
        ? 'bottom-24 md:bottom-4 right-4 w-48'
        : 'bottom-24 md:bottom-4 right-4 w-80 max-h-[60vh]'
    )}>
      {/* Header */}
      <div className={clsx(
        'flex items-center justify-between px-3 py-2 border-b',
        theme === 'dark' ? 'border-omnifocus-border bg-omnifocus-bg' : 'border-gray-200 bg-yellow-50'
      )}>
        <div className="flex items-center gap-2">
          <StickyNote size={16} className="text-yellow-500" />
          <span className={clsx(
            'text-sm font-medium',
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            Scratchpad
          </span>
          {notes.length > 0 && (
            <span className={clsx(
              'px-1.5 py-0.5 rounded text-xs',
              theme === 'dark'
                ? 'bg-yellow-500/20 text-yellow-400'
                : 'bg-yellow-200 text-yellow-700'
            )}>
              {notes.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className={clsx(
              'p-1 rounded transition-colors',
              theme === 'dark'
                ? 'text-gray-400 hover:text-white hover:bg-omnifocus-surface'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            )}
          >
            {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className={clsx(
              'p-1 rounded transition-colors',
              theme === 'dark'
                ? 'text-gray-400 hover:text-white hover:bg-omnifocus-surface'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            )}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Input Area */}
          <div className="p-3">
            <textarea
              ref={textareaRef}
              value={currentNote}
              onChange={(e) => setCurrentNote(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Quick note... (⌘+Enter to save)"
              className={clsx(
                'w-full h-20 px-3 py-2 rounded-lg border text-sm resize-none',
                theme === 'dark'
                  ? 'bg-omnifocus-surface border-omnifocus-border text-white placeholder-gray-500'
                  : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
              )}
            />
            <button
              onClick={handleSaveNote}
              disabled={!currentNote.trim()}
              className={clsx(
                'mt-2 w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors',
                currentNote.trim()
                  ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                  : theme === 'dark'
                    ? 'bg-omnifocus-surface text-gray-500 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              )}
            >
              <Plus size={14} />
              Save Note
            </button>
          </div>

          {/* Notes List */}
          {notes.length > 0 && (
            <div className={clsx(
              'border-t max-h-48 overflow-y-auto',
              theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200'
            )}>
              {notes.map(note => (
                <div
                  key={note.id}
                  className={clsx(
                    'p-3 border-b group',
                    theme === 'dark'
                      ? 'border-omnifocus-border hover:bg-omnifocus-surface/50'
                      : 'border-gray-100 hover:bg-gray-50'
                  )}
                >
                  <p className={clsx(
                    'text-sm whitespace-pre-wrap line-clamp-3',
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  )}>
                    {note.content}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">
                      {new Date(note.createdAt).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleConvertToAction(note)}
                        className={clsx(
                          'flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors',
                          theme === 'dark'
                            ? 'bg-omnifocus-purple/20 text-omnifocus-purple hover:bg-omnifocus-purple/30'
                            : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                        )}
                        title="Convert to action"
                      >
                        <ArrowRight size={12} />
                        Action
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className={clsx(
                          'p-1 rounded transition-colors',
                          theme === 'dark'
                            ? 'text-gray-500 hover:text-red-400 hover:bg-red-500/10'
                            : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                        )}
                        title="Delete note"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
