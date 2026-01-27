'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/stores/app.store';
import {
  Clock,
  Play,
  Pause,
  X,
  Check,
  Plus,
  Calendar,
  Trash2,
} from 'lucide-react';
import { format, addMinutes, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import clsx from 'clsx';

interface TimeBlock {
  id: string;
  title: string;
  startTime: string; // HH:mm format
  duration: number; // minutes
  actionId?: string;
  completed: boolean;
  color: string;
}

const BLOCKS_STORAGE_KEY = 'omnifocus-time-blocks';

const BLOCK_COLORS = [
  { name: 'purple', bg: 'bg-purple-500', light: 'bg-purple-100' },
  { name: 'blue', bg: 'bg-blue-500', light: 'bg-blue-100' },
  { name: 'green', bg: 'bg-green-500', light: 'bg-green-100' },
  { name: 'orange', bg: 'bg-orange-500', light: 'bg-orange-100' },
  { name: 'pink', bg: 'bg-pink-500', light: 'bg-pink-100' },
];

interface TimeBlockerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TimeBlocker({ isOpen, onClose }: TimeBlockerProps) {
  const { theme, actions } = useAppStore();
  const [blocks, setBlocks] = useState<TimeBlock[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBlock, setNewBlock] = useState({
    title: '',
    startTime: format(new Date(), 'HH:mm'),
    duration: 30,
    color: 'purple',
  });

  // Load blocks from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(BLOCKS_STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Filter to today's blocks
          const today = format(new Date(), 'yyyy-MM-dd');
          const todayBlocks = parsed[today] || [];
          setBlocks(todayBlocks);
        } catch (e) {
          console.error('Failed to load time blocks:', e);
        }
      }
    }
  }, []);

  // Save blocks to localStorage
  const saveBlocks = (newBlocks: TimeBlock[]) => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(BLOCKS_STORAGE_KEY);
      let allBlocks: Record<string, TimeBlock[]> = {};
      if (saved) {
        try {
          allBlocks = JSON.parse(saved);
        } catch {}
      }
      const today = format(new Date(), 'yyyy-MM-dd');
      allBlocks[today] = newBlocks;
      localStorage.setItem(BLOCKS_STORAGE_KEY, JSON.stringify(allBlocks));
    }
  };

  const addBlock = () => {
    if (!newBlock.title.trim()) return;

    const block: TimeBlock = {
      id: Math.random().toString(36).substr(2, 9),
      title: newBlock.title.trim(),
      startTime: newBlock.startTime,
      duration: newBlock.duration,
      color: newBlock.color,
      completed: false,
    };

    const updated = [...blocks, block].sort((a, b) => a.startTime.localeCompare(b.startTime));
    setBlocks(updated);
    saveBlocks(updated);
    setNewBlock({ title: '', startTime: format(new Date(), 'HH:mm'), duration: 30, color: 'purple' });
    setShowAddForm(false);
  };

  const toggleComplete = (blockId: string) => {
    const updated = blocks.map(b =>
      b.id === blockId ? { ...b, completed: !b.completed } : b
    );
    setBlocks(updated);
    saveBlocks(updated);
  };

  const deleteBlock = (blockId: string) => {
    const updated = blocks.filter(b => b.id !== blockId);
    setBlocks(updated);
    saveBlocks(updated);
  };

  // Calculate current time position
  const now = new Date();
  const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();

  // Check if a block is current
  const isBlockCurrent = (block: TimeBlock) => {
    const [hours, mins] = block.startTime.split(':').map(Number);
    const blockStart = hours * 60 + mins;
    const blockEnd = blockStart + block.duration;
    return currentTimeMinutes >= blockStart && currentTimeMinutes < blockEnd;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={clsx(
        'relative w-full max-w-lg max-h-[80vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col',
        'animate-in zoom-in-95 duration-200',
        theme === 'dark' ? 'bg-omnifocus-sidebar' : 'bg-white'
      )}>
        {/* Header */}
        <div className={clsx(
          'flex items-center justify-between px-6 py-4 border-b',
          theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200'
        )}>
          <div className="flex items-center gap-3">
            <Clock size={24} className="text-omnifocus-purple" />
            <div>
              <h2 className={clsx(
                'text-xl font-semibold',
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              )}>
                Time Blocks
              </h2>
              <p className={clsx(
                'text-xs',
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              )}>
                {format(new Date(), 'EEEE, MMMM d')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={clsx(
              'p-2 rounded-lg transition-colors',
              theme === 'dark'
                ? 'text-gray-400 hover:text-white hover:bg-omnifocus-surface'
                : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
            )}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Current time indicator */}
          <div className={clsx(
            'mb-4 flex items-center gap-2 text-sm',
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          )}>
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Current time: {format(now, 'h:mm a')}
          </div>

          {blocks.length === 0 && !showAddForm ? (
            <div className="text-center py-12">
              <Calendar size={48} className={clsx(
                'mx-auto mb-4',
                theme === 'dark' ? 'text-gray-600' : 'text-gray-300'
              )} />
              <p className={clsx(
                'text-lg font-medium mb-2',
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              )}>
                No time blocks today
              </p>
              <p className={clsx(
                'text-sm mb-4',
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              )}>
                Schedule focused work sessions to stay productive
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-omnifocus-purple text-white hover:bg-omnifocus-purple/90 transition-colors"
              >
                <Plus size={18} />
                Add Time Block
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Time blocks list */}
              {blocks.map(block => {
                const color = BLOCK_COLORS.find(c => c.name === block.color) || BLOCK_COLORS[0];
                const isCurrent = isBlockCurrent(block);
                const [hours, mins] = block.startTime.split(':').map(Number);
                const endTime = addMinutes(new Date().setHours(hours, mins, 0, 0), block.duration);

                return (
                  <div
                    key={block.id}
                    className={clsx(
                      'relative p-4 rounded-lg border-l-4 transition-all',
                      color.bg.replace('bg-', 'border-'),
                      block.completed
                        ? theme === 'dark' ? 'bg-omnifocus-bg/50 opacity-60' : 'bg-gray-50 opacity-60'
                        : isCurrent
                          ? theme === 'dark' ? 'bg-omnifocus-surface ring-2 ring-omnifocus-purple' : 'bg-purple-50 ring-2 ring-omnifocus-purple'
                          : theme === 'dark' ? 'bg-omnifocus-surface' : 'bg-gray-50'
                    )}
                  >
                    {isCurrent && !block.completed && (
                      <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-omnifocus-purple text-white text-xs font-medium">
                        Now
                      </span>
                    )}

                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleComplete(block.id)}
                        className={clsx(
                          'mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0',
                          block.completed
                            ? 'bg-green-500 border-green-500 text-white'
                            : theme === 'dark'
                              ? 'border-gray-500 hover:border-green-500'
                              : 'border-gray-300 hover:border-green-500'
                        )}
                      >
                        {block.completed && <Check size={12} />}
                      </button>

                      <div className="flex-1 min-w-0">
                        <h4 className={clsx(
                          'font-medium',
                          block.completed && 'line-through opacity-60',
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        )}>
                          {block.title}
                        </h4>
                        <p className={clsx(
                          'text-sm mt-1',
                          theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                        )}>
                          {format(new Date().setHours(hours, mins, 0, 0), 'h:mm a')} - {format(endTime, 'h:mm a')}
                          <span className="mx-1">·</span>
                          {block.duration}min
                        </p>
                      </div>

                      <button
                        onClick={() => deleteBlock(block.id)}
                        className={clsx(
                          'p-1 rounded opacity-0 hover:opacity-100 transition-opacity',
                          theme === 'dark'
                            ? 'text-gray-500 hover:text-red-400'
                            : 'text-gray-400 hover:text-red-500'
                        )}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Add block form */}
              {showAddForm ? (
                <div className={clsx(
                  'p-4 rounded-lg border',
                  theme === 'dark'
                    ? 'bg-omnifocus-bg border-omnifocus-border'
                    : 'bg-white border-gray-200'
                )}>
                  <input
                    type="text"
                    value={newBlock.title}
                    onChange={(e) => setNewBlock({ ...newBlock, title: e.target.value })}
                    placeholder="What will you work on?"
                    autoFocus
                    className={clsx(
                      'w-full px-3 py-2 rounded-lg border mb-3',
                      theme === 'dark'
                        ? 'bg-omnifocus-surface border-omnifocus-border text-white placeholder-gray-500'
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                    )}
                  />

                  <div className="flex gap-3 mb-3">
                    <div className="flex-1">
                      <label className={clsx(
                        'text-xs font-medium block mb-1',
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      )}>
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={newBlock.startTime}
                        onChange={(e) => setNewBlock({ ...newBlock, startTime: e.target.value })}
                        className={clsx(
                          'w-full px-3 py-2 rounded-lg border',
                          theme === 'dark'
                            ? 'bg-omnifocus-surface border-omnifocus-border text-white'
                            : 'bg-gray-50 border-gray-200 text-gray-900'
                        )}
                      />
                    </div>
                    <div className="flex-1">
                      <label className={clsx(
                        'text-xs font-medium block mb-1',
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      )}>
                        Duration
                      </label>
                      <select
                        value={newBlock.duration}
                        onChange={(e) => setNewBlock({ ...newBlock, duration: parseInt(e.target.value) })}
                        className={clsx(
                          'w-full px-3 py-2 rounded-lg border',
                          theme === 'dark'
                            ? 'bg-omnifocus-surface border-omnifocus-border text-white'
                            : 'bg-gray-50 border-gray-200 text-gray-900'
                        )}
                      >
                        <option value={15}>15 min</option>
                        <option value={30}>30 min</option>
                        <option value={45}>45 min</option>
                        <option value={60}>1 hour</option>
                        <option value={90}>1.5 hours</option>
                        <option value={120}>2 hours</option>
                      </select>
                    </div>
                  </div>

                  {/* Color picker */}
                  <div className="mb-3">
                    <label className={clsx(
                      'text-xs font-medium block mb-2',
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    )}>
                      Color
                    </label>
                    <div className="flex gap-2">
                      {BLOCK_COLORS.map(color => (
                        <button
                          key={color.name}
                          onClick={() => setNewBlock({ ...newBlock, color: color.name })}
                          className={clsx(
                            'w-6 h-6 rounded-full transition-transform hover:scale-110',
                            color.bg,
                            newBlock.color === color.name && 'ring-2 ring-offset-2 ring-omnifocus-purple'
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowAddForm(false)}
                      className={clsx(
                        'px-3 py-1.5 rounded-lg text-sm',
                        theme === 'dark'
                          ? 'text-gray-400 hover:text-white'
                          : 'text-gray-500 hover:text-gray-900'
                      )}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={addBlock}
                      disabled={!newBlock.title.trim()}
                      className="px-3 py-1.5 rounded-lg text-sm bg-omnifocus-purple text-white hover:bg-omnifocus-purple/90 disabled:opacity-50"
                    >
                      Add Block
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddForm(true)}
                  className={clsx(
                    'w-full flex items-center justify-center gap-2 p-3 rounded-lg border-2 border-dashed transition-colors',
                    theme === 'dark'
                      ? 'border-omnifocus-border text-gray-500 hover:border-omnifocus-purple hover:text-omnifocus-purple'
                      : 'border-gray-200 text-gray-400 hover:border-omnifocus-purple hover:text-omnifocus-purple'
                  )}
                >
                  <Plus size={18} />
                  Add Time Block
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
