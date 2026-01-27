'use client';

import { useState } from 'react';
import { useAppStore } from '@/stores/app.store';
import {
  X,
  Settings,
  Moon,
  Sun,
  Trash2,
  Clock,
  Bell,
  Keyboard,
} from 'lucide-react';
import clsx from 'clsx';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const { cleanupCompleted } = useAppStore();
  const [cleanupDays, setCleanupDays] = useState(7);
  const [isCleaningUp, setIsCleaningUp] = useState(false);

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
        'fixed z-50 bg-omnifocus-sidebar border-omnifocus-border overflow-hidden',
        'flex flex-col',
        // Mobile: bottom sheet
        'inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl border-t',
        // Desktop: side panel
        'md:inset-y-0 md:right-0 md:left-auto md:w-[400px] md:max-h-none md:rounded-none md:border-l md:border-t-0'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-omnifocus-border">
          <div className="flex items-center gap-2">
            <Settings size={20} className="text-gray-400" />
            <h2 className="text-lg font-semibold text-white">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-omnifocus-surface text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Keyboard Shortcuts */}
          <section>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
              <Keyboard size={16} />
              Keyboard Shortcuts
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-omnifocus-surface">
                <span className="text-gray-300">New action</span>
                <kbd className="px-2 py-1 bg-omnifocus-bg rounded text-gray-400">N</kbd>
              </div>
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-omnifocus-surface">
                <span className="text-gray-300">Search</span>
                <kbd className="px-2 py-1 bg-omnifocus-bg rounded text-gray-400">⌘K</kbd>
              </div>
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-omnifocus-surface">
                <span className="text-gray-300">Complete selected</span>
                <kbd className="px-2 py-1 bg-omnifocus-bg rounded text-gray-400">Space</kbd>
              </div>
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-omnifocus-surface">
                <span className="text-gray-300">Flag/unflag</span>
                <kbd className="px-2 py-1 bg-omnifocus-bg rounded text-gray-400">F</kbd>
              </div>
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-omnifocus-surface">
                <span className="text-gray-300">Navigate up/down</span>
                <div className="flex gap-1">
                  <kbd className="px-2 py-1 bg-omnifocus-bg rounded text-gray-400">J</kbd>
                  <kbd className="px-2 py-1 bg-omnifocus-bg rounded text-gray-400">K</kbd>
                </div>
              </div>
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-omnifocus-surface">
                <span className="text-gray-300">Indent/outdent</span>
                <div className="flex gap-1">
                  <kbd className="px-2 py-1 bg-omnifocus-bg rounded text-gray-400">Tab</kbd>
                  <kbd className="px-2 py-1 bg-omnifocus-bg rounded text-gray-400">⇧Tab</kbd>
                </div>
              </div>
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-omnifocus-surface">
                <span className="text-gray-300">Close modal</span>
                <kbd className="px-2 py-1 bg-omnifocus-bg rounded text-gray-400">Esc</kbd>
              </div>
            </div>
          </section>

          {/* Data Management */}
          <section>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
              <Trash2 size={16} />
              Data Management
            </h3>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-omnifocus-surface">
                <label className="text-sm text-gray-300 block mb-2">
                  Clean up completed actions older than:
                </label>
                <div className="flex items-center gap-3">
                  <select
                    value={cleanupDays}
                    onChange={(e) => setCleanupDays(Number(e.target.value))}
                    className="flex-1 px-3 py-2 rounded-lg bg-omnifocus-bg border border-omnifocus-border text-white text-sm"
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
          <section className="pt-4 border-t border-omnifocus-border">
            <div className="text-center text-sm text-gray-500">
              <p className="font-semibold text-gray-400">OmniFocus Clone</p>
              <p className="mt-1">A GTD-focused task manager</p>
              <p className="mt-2 text-xs">Built with Next.js, NestJS, and Prisma</p>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
