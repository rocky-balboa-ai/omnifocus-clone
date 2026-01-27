'use client';

import { useState } from 'react';
import { useAppStore } from '@/stores/app.store';
import {
  X,
  Settings,
  Moon,
  Sun,
  Monitor,
  Trash2,
  Clock,
  Bell,
  Keyboard,
  Download,
  Database,
  FileJson,
  FileText,
  Table2,
} from 'lucide-react';
import { api } from '@/lib/api';
import clsx from 'clsx';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const { cleanupCompleted, theme, themeMode, setThemeMode, actions, projects } = useAppStore();
  const [cleanupDays, setCleanupDays] = useState(7);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'markdown'>('json');

  const handleCleanup = async () => {
    if (!confirm(`Delete completed actions older than ${cleanupDays} days? This cannot be undone.`)) return;

    setIsCleaningUp(true);
    try {
      const result = await cleanupCompleted(cleanupDays);
      alert(`Cleaned up ${result.deleted} completed action${result.deleted === 1 ? '' : 's'}.`);
    } catch (error) {
      console.error('Failed to cleanup:', error);
      alert('Failed to clean up completed actions.');
    } finally {
      setIsCleaningUp(false);
    }
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const exportAsCSV = () => {
    const headers = ['Title', 'Status', 'Flagged', 'Due Date', 'Defer Date', 'Project', 'Estimated Minutes', 'Notes'];
    const rows = actions.map(action => {
      const project = projects.find(p => p.id === action.projectId);
      return [
        `"${(action.title || '').replace(/"/g, '""')}"`,
        action.status,
        action.flagged ? 'Yes' : 'No',
        action.dueDate ? action.dueDate.split('T')[0] : '',
        action.deferDate ? action.deferDate.split('T')[0] : '',
        project ? `"${project.name.replace(/"/g, '""')}"` : 'Inbox',
        action.estimatedMinutes || '',
        `"${(action.note || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    downloadFile(csv, `omnifocus-export-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
  };

  const exportAsMarkdown = () => {
    const projectGroups = new Map<string, typeof actions>();
    const inboxActions: typeof actions = [];

    // Group actions by project
    actions.forEach(action => {
      if (action.projectId) {
        const existing = projectGroups.get(action.projectId) || [];
        projectGroups.set(action.projectId, [...existing, action]);
      } else {
        inboxActions.push(action);
      }
    });

    let md = `# OmniFocus Export\n\n`;
    md += `*Exported on ${new Date().toLocaleDateString()}*\n\n`;

    // Inbox
    if (inboxActions.length > 0) {
      md += `## Inbox\n\n`;
      inboxActions.forEach(action => {
        const checkbox = action.status === 'completed' ? '[x]' : '[ ]';
        const flag = action.flagged ? ' 🚩' : '';
        const due = action.dueDate ? ` (due: ${action.dueDate.split('T')[0]})` : '';
        md += `- ${checkbox} ${action.title}${flag}${due}\n`;
        if (action.note) {
          md += `  > ${action.note.replace(/\n/g, '\n  > ')}\n`;
        }
      });
      md += '\n';
    }

    // Projects
    projects.forEach(project => {
      const projectActions = projectGroups.get(project.id) || [];
      md += `## ${project.name}\n\n`;

      if (project.note) {
        md += `${project.note}\n\n`;
      }

      if (projectActions.length > 0) {
        projectActions.forEach(action => {
          const checkbox = action.status === 'completed' ? '[x]' : '[ ]';
          const flag = action.flagged ? ' 🚩' : '';
          const due = action.dueDate ? ` (due: ${action.dueDate.split('T')[0]})` : '';
          md += `- ${checkbox} ${action.title}${flag}${due}\n`;
          if (action.note) {
            md += `  > ${action.note.replace(/\n/g, '\n  > ')}\n`;
          }
        });
      } else {
        md += `*No actions*\n`;
      }
      md += '\n';
    });

    downloadFile(md, `omnifocus-export-${new Date().toISOString().split('T')[0]}.md`, 'text/markdown');
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      if (exportFormat === 'csv') {
        exportAsCSV();
      } else if (exportFormat === 'markdown') {
        exportAsMarkdown();
      } else {
        // JSON export from API
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/export`, {
          headers: {
            'x-api-key': 'dev-api-key',
          },
        });

        if (!response.ok) throw new Error('Export failed');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `omnifocus-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to export:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 md:bg-black/30"
        onClick={onClose}
      />

      {/* Panel */}
      <div className={clsx(
        'fixed z-50 overflow-hidden',
        'flex flex-col',
        theme === 'dark'
          ? 'bg-omnifocus-sidebar border-omnifocus-border'
          : 'bg-omnifocus-light-sidebar border-omnifocus-light-border',
        // Mobile: bottom sheet
        'inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl border-t',
        // Desktop: side panel
        'md:inset-y-0 md:right-0 md:left-auto md:w-[400px] md:max-h-none md:rounded-none md:border-l md:border-t-0'
      )}>
        {/* Header */}
        <div className={clsx(
          'flex items-center justify-between px-4 py-3 border-b',
          theme === 'dark' ? 'border-omnifocus-border' : 'border-omnifocus-light-border'
        )}>
          <div className="flex items-center gap-2">
            <Settings size={20} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
            <h2 className={clsx('text-lg font-semibold', theme === 'dark' ? 'text-white' : 'text-gray-900')}>Settings</h2>
          </div>
          <button
            onClick={onClose}
            className={clsx(
              'p-2 rounded-lg transition-colors',
              theme === 'dark'
                ? 'hover:bg-omnifocus-surface text-gray-400 hover:text-white'
                : 'hover:bg-omnifocus-light-surface text-gray-500 hover:text-gray-900'
            )}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Appearance */}
          <section>
            <h3 className={clsx(
              'flex items-center gap-2 text-sm font-semibold mb-3',
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            )}>
              {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
              Appearance
            </h3>
            <div className={clsx(
              'p-3 rounded-lg',
              theme === 'dark' ? 'bg-omnifocus-surface' : 'bg-omnifocus-light-surface'
            )}>
              <div className="space-y-3">
                <div>
                  <span className={clsx('text-sm', theme === 'dark' ? 'text-gray-300' : 'text-gray-700')}>Theme</span>
                  <p className={clsx('text-xs mt-0.5', theme === 'dark' ? 'text-gray-500' : 'text-gray-500')}>
                    {themeMode === 'auto'
                      ? 'Following system preference'
                      : `${theme === 'dark' ? 'Dark' : 'Light'} mode is enabled`}
                  </p>
                </div>
                {/* Theme mode selector */}
                <div className={clsx(
                  'flex rounded-lg p-1',
                  theme === 'dark' ? 'bg-omnifocus-bg' : 'bg-gray-100'
                )}>
                  {[
                    { mode: 'light' as const, icon: Sun, label: 'Light' },
                    { mode: 'dark' as const, icon: Moon, label: 'Dark' },
                    { mode: 'auto' as const, icon: Monitor, label: 'Auto' },
                  ].map(({ mode, icon: Icon, label }) => (
                    <button
                      key={mode}
                      onClick={() => setThemeMode(mode)}
                      className={clsx(
                        'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md transition-all text-sm font-medium',
                        themeMode === mode
                          ? theme === 'dark'
                            ? 'bg-omnifocus-purple text-white shadow-sm'
                            : 'bg-white text-omnifocus-purple shadow-sm'
                          : theme === 'dark'
                            ? 'text-gray-400 hover:text-gray-200'
                            : 'text-gray-500 hover:text-gray-700'
                      )}
                    >
                      <Icon size={16} />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Keyboard Shortcuts */}
          <section>
            <h3 className={clsx(
              'flex items-center gap-2 text-sm font-semibold mb-3',
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            )}>
              <Keyboard size={16} />
              Keyboard Shortcuts
            </h3>
            <div className="space-y-2 text-sm">
              {[
                { label: 'New action', keys: ['N'] },
                { label: 'Search', keys: ['⌘K'] },
                { label: 'Complete selected', keys: ['Space'] },
                { label: 'Flag/unflag', keys: ['F'] },
                { label: 'Navigate up/down', keys: ['J', 'K'] },
                { label: 'Indent/outdent', keys: ['Tab', '⇧Tab'] },
                { label: 'Focus mode', keys: ['⌘\\'] },
                { label: 'Close modal', keys: ['Esc'] },
              ].map(({ label, keys }) => (
                <div
                  key={label}
                  className={clsx(
                    'flex items-center justify-between py-2 px-3 rounded-lg',
                    theme === 'dark' ? 'bg-omnifocus-surface' : 'bg-omnifocus-light-surface'
                  )}
                >
                  <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>{label}</span>
                  <div className="flex gap-1">
                    {keys.map(key => (
                      <kbd
                        key={key}
                        className={clsx(
                          'px-2 py-1 rounded',
                          theme === 'dark' ? 'bg-omnifocus-bg text-gray-400' : 'bg-white text-gray-500 border border-gray-200'
                        )}
                      >
                        {key}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Data Management */}
          <section>
            <h3 className={clsx(
              'flex items-center gap-2 text-sm font-semibold mb-3',
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            )}>
              <Database size={16} />
              Data Management
            </h3>
            <div className="space-y-3">
              {/* Export Data */}
              <div className={clsx(
                'p-3 rounded-lg',
                theme === 'dark' ? 'bg-omnifocus-surface' : 'bg-omnifocus-light-surface'
              )}>
                <div className="space-y-3">
                  <div>
                    <span className={clsx('text-sm font-medium', theme === 'dark' ? 'text-gray-300' : 'text-gray-700')}>Export Data</span>
                    <p className={clsx('text-xs mt-0.5', theme === 'dark' ? 'text-gray-500' : 'text-gray-500')}>
                      Download your data in various formats
                    </p>
                  </div>

                  {/* Format selector */}
                  <div className={clsx(
                    'flex rounded-lg p-1',
                    theme === 'dark' ? 'bg-omnifocus-bg' : 'bg-gray-100'
                  )}>
                    {[
                      { format: 'json' as const, icon: FileJson, label: 'JSON' },
                      { format: 'csv' as const, icon: Table2, label: 'CSV' },
                      { format: 'markdown' as const, icon: FileText, label: 'Markdown' },
                    ].map(({ format, icon: Icon, label }) => (
                      <button
                        key={format}
                        onClick={() => setExportFormat(format)}
                        className={clsx(
                          'flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md transition-all text-xs font-medium',
                          exportFormat === format
                            ? theme === 'dark'
                              ? 'bg-omnifocus-purple text-white shadow-sm'
                              : 'bg-white text-omnifocus-purple shadow-sm'
                            : theme === 'dark'
                              ? 'text-gray-400 hover:text-gray-200'
                              : 'text-gray-500 hover:text-gray-700'
                        )}
                      >
                        <Icon size={14} />
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleExport}
                    disabled={isExporting}
                    className={clsx(
                      'w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium disabled:opacity-50',
                      theme === 'dark'
                        ? 'bg-omnifocus-bg text-gray-300 hover:text-white'
                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                    )}
                  >
                    <Download size={16} />
                    {isExporting ? 'Exporting...' : `Export as ${exportFormat.toUpperCase()}`}
                  </button>
                </div>
              </div>

              {/* Cleanup */}
              <div className={clsx(
                'p-3 rounded-lg',
                theme === 'dark' ? 'bg-omnifocus-surface' : 'bg-omnifocus-light-surface'
              )}>
                <label className={clsx('text-sm block mb-2', theme === 'dark' ? 'text-gray-300' : 'text-gray-700')}>
                  Clean up completed actions older than:
                </label>
                <div className="flex items-center gap-3">
                  <select
                    value={cleanupDays}
                    onChange={(e) => setCleanupDays(Number(e.target.value))}
                    className={clsx(
                      'flex-1 px-3 py-2 rounded-lg border text-sm',
                      theme === 'dark'
                        ? 'bg-omnifocus-bg border-omnifocus-border text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                    )}
                  >
                    <option value={1}>1 day</option>
                    <option value={7}>7 days</option>
                    <option value={14}>14 days</option>
                    <option value={30}>30 days</option>
                    <option value={90}>90 days</option>
                  </select>
                  <button
                    onClick={handleCleanup}
                    disabled={isCleaningUp}
                    className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    {isCleaningUp ? 'Cleaning...' : 'Clean Up'}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* About */}
          <section className={clsx(
            'pt-4 border-t',
            theme === 'dark' ? 'border-omnifocus-border' : 'border-omnifocus-light-border'
          )}>
            <div className={clsx('text-center text-sm', theme === 'dark' ? 'text-gray-500' : 'text-gray-500')}>
              <p className={clsx('font-semibold', theme === 'dark' ? 'text-gray-400' : 'text-gray-600')}>OmniFocus Clone</p>
              <p className="mt-1">A GTD-focused task manager</p>
              <p className="mt-2 text-xs">Built with Next.js, NestJS, and Prisma</p>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
