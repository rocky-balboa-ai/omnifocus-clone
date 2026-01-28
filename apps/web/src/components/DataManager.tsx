'use client';

import { useState, useRef } from 'react';
import { useAppStore } from '@/stores/app.store';
import {
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  FileJson,
  Database,
} from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';

interface DataManagerProps {
  className?: string;
}

export function DataManager({ className }: DataManagerProps) {
  const { theme, actions, projects, tags } = useAppStore();
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Export data
  const handleExport = () => {
    try {
      const data = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        data: {
          actions,
          projects,
          tags,
        },
        localStorage: {
          habits: localStorage.getItem('omnifocus-habits'),
          timeBlocks: localStorage.getItem('omnifocus-time-blocks'),
          tagColors: localStorage.getItem('omnifocus-tag-colors'),
          scratchpad: localStorage.getItem('omnifocus-scratchpad'),
          theme: localStorage.getItem('omnifocus-theme'),
        },
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `omnifocus-backup-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setStatus('success');
      setMessage('Data exported successfully');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (error) {
      setStatus('error');
      setMessage('Failed to export data');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  // Import data
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content);

        // Validate structure
        if (!data.version || !data.data) {
          throw new Error('Invalid backup file format');
        }

        // Restore localStorage items
        if (data.localStorage) {
          if (data.localStorage.habits) {
            localStorage.setItem('omnifocus-habits', data.localStorage.habits);
          }
          if (data.localStorage.timeBlocks) {
            localStorage.setItem('omnifocus-time-blocks', data.localStorage.timeBlocks);
          }
          if (data.localStorage.tagColors) {
            localStorage.setItem('omnifocus-tag-colors', data.localStorage.tagColors);
          }
          if (data.localStorage.scratchpad) {
            localStorage.setItem('omnifocus-scratchpad', data.localStorage.scratchpad);
          }
          if (data.localStorage.theme) {
            localStorage.setItem('omnifocus-theme', data.localStorage.theme);
          }
        }

        setStatus('success');
        setMessage(`Imported backup from ${format(new Date(data.exportedAt), 'MMM d, yyyy h:mm a')}. Refresh to see changes.`);

        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error) {
        setStatus('error');
        setMessage('Failed to import data. Please check the file format.');
        setTimeout(() => setStatus('idle'), 5000);
      }
    };

    reader.readAsText(file);
  };

  // Clear all local data
  const handleClearLocal = () => {
    if (!confirm('This will clear all locally stored data (habits, time blocks, tag colors, scratchpad). This cannot be undone. Continue?')) {
      return;
    }

    localStorage.removeItem('omnifocus-habits');
    localStorage.removeItem('omnifocus-time-blocks');
    localStorage.removeItem('omnifocus-tag-colors');
    localStorage.removeItem('omnifocus-scratchpad');
    localStorage.removeItem('omnifocus-last-briefing');
    localStorage.removeItem('omnifocus-last-eod-summary');

    setStatus('success');
    setMessage('Local data cleared. Refresh to reset.');
    setTimeout(() => setStatus('idle'), 3000);
  };

  const stats = {
    actions: actions.length,
    projects: projects.length,
    tags: tags.length,
    hasHabits: !!localStorage.getItem('omnifocus-habits'),
    hasTimeBlocks: !!localStorage.getItem('omnifocus-time-blocks'),
    hasTagColors: !!localStorage.getItem('omnifocus-tag-colors'),
  };

  return (
    <div className={clsx(
      'p-4 rounded-xl border',
      theme === 'dark'
        ? 'bg-omnifocus-surface border-omnifocus-border'
        : 'bg-white border-gray-200',
      className
    )}>
      <div className="flex items-center gap-2 mb-4">
        <Database size={18} className="text-omnifocus-purple" />
        <h3 className={clsx(
          'text-sm font-semibold',
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        )}>
          Data Management
        </h3>
      </div>

      {/* Data Stats */}
      <div className={clsx(
        'grid grid-cols-3 gap-2 p-3 rounded-lg mb-4',
        theme === 'dark' ? 'bg-omnifocus-bg' : 'bg-gray-50'
      )}>
        <div className="text-center">
          <p className={clsx(
            'text-xl font-bold',
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            {stats.actions}
          </p>
          <p className={clsx(
            'text-xs',
            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
          )}>
            Actions
          </p>
        </div>
        <div className="text-center">
          <p className={clsx(
            'text-xl font-bold',
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            {stats.projects}
          </p>
          <p className={clsx(
            'text-xs',
            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
          )}>
            Projects
          </p>
        </div>
        <div className="text-center">
          <p className={clsx(
            'text-xl font-bold',
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            {stats.tags}
          </p>
          <p className={clsx(
            'text-xs',
            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
          )}>
            Tags
          </p>
        </div>
      </div>

      {/* Status Message */}
      {status !== 'idle' && (
        <div className={clsx(
          'flex items-center gap-2 p-3 rounded-lg mb-4 text-sm',
          status === 'success'
            ? theme === 'dark'
              ? 'bg-green-500/20 text-green-400'
              : 'bg-green-100 text-green-700'
            : theme === 'dark'
              ? 'bg-red-500/20 text-red-400'
              : 'bg-red-100 text-red-700'
        )}>
          {status === 'success' ? (
            <CheckCircle2 size={16} />
          ) : (
            <AlertTriangle size={16} />
          )}
          {message}
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2">
        <button
          onClick={handleExport}
          className={clsx(
            'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors',
            theme === 'dark'
              ? 'bg-omnifocus-bg hover:bg-omnifocus-border text-white'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
          )}
        >
          <Download size={18} className="text-blue-500" />
          <div className="text-left flex-1">
            <p className="text-sm font-medium">Export Backup</p>
            <p className={clsx(
              'text-xs',
              theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
            )}>
              Download all data as JSON
            </p>
          </div>
          <FileJson size={16} className={theme === 'dark' ? 'text-gray-600' : 'text-gray-400'} />
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className={clsx(
            'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors',
            theme === 'dark'
              ? 'bg-omnifocus-bg hover:bg-omnifocus-border text-white'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
          )}
        >
          <Upload size={18} className="text-green-500" />
          <div className="text-left flex-1">
            <p className="text-sm font-medium">Import Backup</p>
            <p className={clsx(
              'text-xs',
              theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
            )}>
              Restore from JSON file
            </p>
          </div>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          className="hidden"
        />

        <button
          onClick={handleClearLocal}
          className={clsx(
            'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors',
            theme === 'dark'
              ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400'
              : 'bg-red-50 hover:bg-red-100 text-red-600'
          )}
        >
          <Trash2 size={18} />
          <div className="text-left flex-1">
            <p className="text-sm font-medium">Clear Local Data</p>
            <p className={clsx(
              'text-xs opacity-80'
            )}>
              Remove habits, time blocks, etc.
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}
