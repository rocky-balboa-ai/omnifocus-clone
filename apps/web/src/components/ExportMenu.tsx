'use client';

import { useState, useRef, useEffect } from 'react';
import { useAppStore, Action } from '@/stores/app.store';
import { Download, FileText, Copy, Printer, Check } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';

export function ExportMenu() {
  const { theme, actions, currentPerspective } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatActionsAsCSV = (items: Action[]) => {
    const headers = ['Title', 'Status', 'Flagged', 'Project', 'Tags', 'Due Date', 'Defer Date', 'Completed'];
    const rows = items.map((action) => [
      `"${action.title.replace(/"/g, '""')}"`,
      action.status,
      action.flagged ? 'Yes' : 'No',
      action.project?.name || '',
      action.tags?.map((t) => t.tag?.name).join(', ') || '',
      action.dueDate ? format(new Date(action.dueDate), 'yyyy-MM-dd') : '',
      action.deferDate ? format(new Date(action.deferDate), 'yyyy-MM-dd') : '',
      action.completedAt ? format(new Date(action.completedAt), 'yyyy-MM-dd HH:mm') : '',
    ]);

    return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  };

  const formatActionsAsMarkdown = (items: Action[]) => {
    const lines: string[] = [];
    lines.push(`# ${currentPerspective.charAt(0).toUpperCase() + currentPerspective.slice(1)} - Exported ${format(new Date(), 'yyyy-MM-dd HH:mm')}`);
    lines.push('');

    items.forEach((action) => {
      const checkbox = action.status === 'completed' ? '[x]' : '[ ]';
      const flag = action.flagged ? ' ⭐' : '';
      const project = action.project?.name ? ` (${action.project.name})` : '';
      const tags = action.tags?.length ? ` [${action.tags.map((t) => t.tag?.name).join(', ')}]` : '';
      const due = action.dueDate ? ` 📅 ${format(new Date(action.dueDate), 'MMM d')}` : '';

      lines.push(`- ${checkbox} ${action.title}${flag}${project}${tags}${due}`);
    });

    return lines.join('\n');
  };

  const formatActionsAsText = (items: Action[]) => {
    const lines: string[] = [];
    lines.push(`${currentPerspective.toUpperCase()} - ${format(new Date(), 'yyyy-MM-dd HH:mm')}`);
    lines.push('='.repeat(50));
    lines.push('');

    items.forEach((action) => {
      const status = action.status === 'completed' ? '✓' : '○';
      const flag = action.flagged ? ' [FLAGGED]' : '';
      const project = action.project?.name ? ` | Project: ${action.project.name}` : '';
      const due = action.dueDate ? ` | Due: ${format(new Date(action.dueDate), 'MMM d')}` : '';

      lines.push(`${status} ${action.title}${flag}${project}${due}`);
    });

    return lines.join('\n');
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setIsOpen(false);
  };

  const exportAsCSV = () => {
    const csv = formatActionsAsCSV(actions);
    downloadFile(csv, `${currentPerspective}-export.csv`, 'text/csv;charset=utf-8;');
  };

  const exportAsMarkdown = () => {
    const md = formatActionsAsMarkdown(actions);
    downloadFile(md, `${currentPerspective}-export.md`, 'text/markdown;charset=utf-8;');
  };

  const copyToClipboard = async () => {
    const text = formatActionsAsText(actions);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const printView = () => {
    window.print();
    setIsOpen(false);
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm',
          theme === 'dark'
            ? 'bg-omnifocus-surface text-gray-400 hover:text-white hover:bg-omnifocus-border'
            : 'bg-gray-100 text-gray-500 hover:text-gray-900 hover:bg-gray-200'
        )}
        title="Export"
      >
        <Download size={16} />
      </button>

      {isOpen && (
        <div
          className={clsx(
            'absolute right-0 top-full mt-2 w-48 rounded-lg shadow-lg z-50 py-1 border',
            theme === 'dark'
              ? 'bg-omnifocus-sidebar border-omnifocus-border'
              : 'bg-white border-gray-200'
          )}
        >
          <button
            onClick={exportAsCSV}
            className={clsx(
              'w-full flex items-center gap-3 px-4 py-2 text-left text-sm transition-colors',
              theme === 'dark' ? 'hover:bg-omnifocus-surface text-gray-300' : 'hover:bg-gray-100 text-gray-700'
            )}
          >
            <FileText size={16} className="text-green-500" />
            Export as CSV
          </button>

          <button
            onClick={exportAsMarkdown}
            className={clsx(
              'w-full flex items-center gap-3 px-4 py-2 text-left text-sm transition-colors',
              theme === 'dark' ? 'hover:bg-omnifocus-surface text-gray-300' : 'hover:bg-gray-100 text-gray-700'
            )}
          >
            <FileText size={16} className="text-blue-500" />
            Export as Markdown
          </button>

          <button
            onClick={copyToClipboard}
            className={clsx(
              'w-full flex items-center gap-3 px-4 py-2 text-left text-sm transition-colors',
              theme === 'dark' ? 'hover:bg-omnifocus-surface text-gray-300' : 'hover:bg-gray-100 text-gray-700'
            )}
          >
            {copied ? (
              <Check size={16} className="text-green-500" />
            ) : (
              <Copy size={16} className="text-purple-500" />
            )}
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </button>

          <div
            className={clsx('my-1 border-t', theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200')}
          />

          <button
            onClick={printView}
            className={clsx(
              'w-full flex items-center gap-3 px-4 py-2 text-left text-sm transition-colors',
              theme === 'dark' ? 'hover:bg-omnifocus-surface text-gray-300' : 'hover:bg-gray-100 text-gray-700'
            )}
          >
            <Printer size={16} className="text-gray-500" />
            Print
          </button>
        </div>
      )}
    </div>
  );
}
