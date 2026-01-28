'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '@/stores/app.store';
import {
  Target,
  Plus,
  MoreHorizontal,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Circle,
  Calendar,
  TrendingUp,
  Trash2,
  Edit3,
} from 'lucide-react';
import { format, differenceInDays, addDays } from 'date-fns';
import clsx from 'clsx';

interface Goal {
  id: string;
  title: string;
  description?: string;
  targetDate?: string;
  progress: number; // 0-100
  status: 'active' | 'completed' | 'paused';
  keyResults: KeyResult[];
  linkedActionIds: string[];
  createdAt: string;
  completedAt?: string;
}

interface KeyResult {
  id: string;
  title: string;
  targetValue: number;
  currentValue: number;
  unit?: string;
}

const STORAGE_KEY = 'omnifocus-goals';

// Hook for managing goals
export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>([]);

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setGoals(JSON.parse(stored));
      } catch {
        setGoals([]);
      }
    }
  }, []);

  // Save to localStorage
  const saveGoals = (newGoals: Goal[]) => {
    setGoals(newGoals);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newGoals));
  };

  const addGoal = (goal: Omit<Goal, 'id' | 'createdAt' | 'progress' | 'keyResults' | 'linkedActionIds' | 'status'>) => {
    const newGoal: Goal = {
      ...goal,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      progress: 0,
      keyResults: [],
      linkedActionIds: [],
      status: 'active',
    };
    saveGoals([newGoal, ...goals]);
    return newGoal;
  };

  const updateGoal = (id: string, updates: Partial<Goal>) => {
    saveGoals(goals.map(g => g.id === id ? { ...g, ...updates } : g));
  };

  const deleteGoal = (id: string) => {
    saveGoals(goals.filter(g => g.id !== id));
  };

  const addKeyResult = (goalId: string, keyResult: Omit<KeyResult, 'id'>) => {
    const goal = goals.find(g => g.id === goalId);
    if (goal) {
      const newKR: KeyResult = {
        ...keyResult,
        id: Math.random().toString(36).substr(2, 9),
      };
      updateGoal(goalId, {
        keyResults: [...goal.keyResults, newKR],
      });
    }
  };

  const updateKeyResult = (goalId: string, krId: string, updates: Partial<KeyResult>) => {
    const goal = goals.find(g => g.id === goalId);
    if (goal) {
      const updatedKRs = goal.keyResults.map(kr =>
        kr.id === krId ? { ...kr, ...updates } : kr
      );
      // Recalculate progress based on key results
      const progress = updatedKRs.length > 0
        ? Math.round(updatedKRs.reduce((sum, kr) =>
            sum + Math.min(100, (kr.currentValue / kr.targetValue) * 100), 0
          ) / updatedKRs.length)
        : 0;
      updateGoal(goalId, { keyResults: updatedKRs, progress });
    }
  };

  const deleteKeyResult = (goalId: string, krId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (goal) {
      updateGoal(goalId, {
        keyResults: goal.keyResults.filter(kr => kr.id !== krId),
      });
    }
  };

  return {
    goals,
    addGoal,
    updateGoal,
    deleteGoal,
    addKeyResult,
    updateKeyResult,
    deleteKeyResult,
  };
}

// Main Goal Tracker component
interface GoalTrackerProps {
  className?: string;
}

export function GoalTracker({ className }: GoalTrackerProps) {
  const { theme } = useAppStore();
  const { goals, addGoal, updateGoal, deleteGoal, addKeyResult, updateKeyResult, deleteKeyResult } = useGoals();
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());

  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');

  const handleAddGoal = () => {
    if (newGoalTitle.trim()) {
      addGoal({ title: newGoalTitle.trim() });
      setNewGoalTitle('');
      setIsAddingGoal(false);
    }
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedGoals);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedGoals(newExpanded);
  };

  return (
    <div className={clsx('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target size={20} className="text-omnifocus-purple" />
          <h2 className={clsx(
            'text-lg font-semibold',
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            Goals
          </h2>
        </div>
        <button
          onClick={() => setIsAddingGoal(true)}
          className={clsx(
            'p-2 rounded-lg transition-colors',
            theme === 'dark'
              ? 'text-gray-400 hover:text-white hover:bg-omnifocus-surface'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
          )}
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Add goal input */}
      {isAddingGoal && (
        <div className={clsx(
          'p-3 rounded-lg border',
          theme === 'dark'
            ? 'bg-omnifocus-surface border-omnifocus-border'
            : 'bg-white border-gray-200'
        )}>
          <input
            type="text"
            value={newGoalTitle}
            onChange={(e) => setNewGoalTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddGoal();
              if (e.key === 'Escape') setIsAddingGoal(false);
            }}
            placeholder="Enter goal title..."
            className={clsx(
              'w-full bg-transparent text-sm outline-none',
              theme === 'dark' ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
            )}
            autoFocus
          />
          <div className="flex justify-end gap-2 mt-3">
            <button
              onClick={() => setIsAddingGoal(false)}
              className={clsx(
                'px-3 py-1.5 text-sm rounded-lg transition-colors',
                theme === 'dark'
                  ? 'text-gray-400 hover:text-white hover:bg-omnifocus-bg'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              )}
            >
              Cancel
            </button>
            <button
              onClick={handleAddGoal}
              disabled={!newGoalTitle.trim()}
              className={clsx(
                'px-3 py-1.5 text-sm rounded-lg transition-colors',
                'bg-omnifocus-purple text-white',
                !newGoalTitle.trim() && 'opacity-50 cursor-not-allowed'
              )}
            >
              Add Goal
            </button>
          </div>
        </div>
      )}

      {/* Active goals */}
      {activeGoals.length === 0 && !isAddingGoal ? (
        <div className={clsx(
          'text-center py-8',
          theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
        )}>
          <Target size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">No goals yet</p>
          <button
            onClick={() => setIsAddingGoal(true)}
            className="mt-2 text-sm text-omnifocus-purple hover:underline"
          >
            Create your first goal
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {activeGoals.map(goal => (
            <GoalItem
              key={goal.id}
              goal={goal}
              isExpanded={expandedGoals.has(goal.id)}
              onToggleExpand={() => toggleExpand(goal.id)}
              onUpdate={(updates) => updateGoal(goal.id, updates)}
              onDelete={() => deleteGoal(goal.id)}
              onAddKeyResult={(kr) => addKeyResult(goal.id, kr)}
              onUpdateKeyResult={(krId, updates) => updateKeyResult(goal.id, krId, updates)}
              onDeleteKeyResult={(krId) => deleteKeyResult(goal.id, krId)}
              theme={theme}
            />
          ))}
        </div>
      )}

      {/* Completed goals */}
      {completedGoals.length > 0 && (
        <div className="pt-4">
          <h3 className={clsx(
            'text-sm font-medium mb-2',
            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
          )}>
            Completed ({completedGoals.length})
          </h3>
          <div className="space-y-2">
            {completedGoals.map(goal => (
              <GoalItem
                key={goal.id}
                goal={goal}
                isExpanded={expandedGoals.has(goal.id)}
                onToggleExpand={() => toggleExpand(goal.id)}
                onUpdate={(updates) => updateGoal(goal.id, updates)}
                onDelete={() => deleteGoal(goal.id)}
                onAddKeyResult={(kr) => addKeyResult(goal.id, kr)}
                onUpdateKeyResult={(krId, updates) => updateKeyResult(goal.id, krId, updates)}
                onDeleteKeyResult={(krId) => deleteKeyResult(goal.id, krId)}
                theme={theme}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Individual goal item
interface GoalItemProps {
  goal: Goal;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (updates: Partial<Goal>) => void;
  onDelete: () => void;
  onAddKeyResult: (kr: Omit<KeyResult, 'id'>) => void;
  onUpdateKeyResult: (krId: string, updates: Partial<KeyResult>) => void;
  onDeleteKeyResult: (krId: string) => void;
  theme: 'light' | 'dark';
}

function GoalItem({
  goal,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onDelete,
  onAddKeyResult,
  onUpdateKeyResult,
  onDeleteKeyResult,
  theme,
}: GoalItemProps) {
  const [isAddingKR, setIsAddingKR] = useState(false);
  const [newKRTitle, setNewKRTitle] = useState('');
  const [newKRTarget, setNewKRTarget] = useState('');

  const daysRemaining = goal.targetDate
    ? differenceInDays(new Date(goal.targetDate), new Date())
    : null;

  const handleAddKR = () => {
    if (newKRTitle.trim() && newKRTarget) {
      onAddKeyResult({
        title: newKRTitle.trim(),
        targetValue: parseFloat(newKRTarget),
        currentValue: 0,
      });
      setNewKRTitle('');
      setNewKRTarget('');
      setIsAddingKR(false);
    }
  };

  return (
    <div className={clsx(
      'rounded-xl border overflow-hidden',
      theme === 'dark'
        ? 'bg-omnifocus-surface border-omnifocus-border'
        : 'bg-white border-gray-200'
    )}>
      {/* Goal header */}
      <div
        className={clsx(
          'flex items-center gap-3 p-4 cursor-pointer',
          theme === 'dark' ? 'hover:bg-omnifocus-bg/50' : 'hover:bg-gray-50'
        )}
        onClick={onToggleExpand}
      >
        <button className={theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}>
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {goal.status === 'completed' ? (
              <CheckCircle2 size={18} className="text-green-500 shrink-0" />
            ) : (
              <Circle size={18} className={theme === 'dark' ? 'text-gray-500' : 'text-gray-400'} />
            )}
            <p className={clsx(
              'font-medium truncate',
              goal.status === 'completed'
                ? 'line-through text-gray-500'
                : theme === 'dark' ? 'text-white' : 'text-gray-900'
            )}>
              {goal.title}
            </p>
          </div>
          {goal.targetDate && (
            <p className={clsx(
              'text-xs mt-1 ml-6',
              daysRemaining !== null && daysRemaining < 0
                ? 'text-red-500'
                : daysRemaining !== null && daysRemaining < 7
                  ? 'text-yellow-500'
                  : theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
            )}>
              {daysRemaining !== null && daysRemaining < 0
                ? `${Math.abs(daysRemaining)} days overdue`
                : daysRemaining !== null
                  ? `${daysRemaining} days remaining`
                  : format(new Date(goal.targetDate), 'MMM d, yyyy')}
            </p>
          )}
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2">
          <div className={clsx(
            'w-24 h-2 rounded-full overflow-hidden',
            theme === 'dark' ? 'bg-omnifocus-bg' : 'bg-gray-200'
          )}>
            <div
              className={clsx(
                'h-full rounded-full transition-all',
                goal.progress >= 100
                  ? 'bg-green-500'
                  : goal.progress >= 50
                    ? 'bg-blue-500'
                    : 'bg-omnifocus-purple'
              )}
              style={{ width: `${Math.min(100, goal.progress)}%` }}
            />
          </div>
          <span className={clsx(
            'text-sm font-medium w-10 text-right',
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          )}>
            {goal.progress}%
          </span>
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className={clsx(
          'px-4 pb-4 border-t',
          theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-100'
        )}>
          {/* Key Results */}
          <div className="pt-4 pl-7">
            <div className="flex items-center justify-between mb-2">
              <h4 className={clsx(
                'text-sm font-medium',
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              )}>
                Key Results
              </h4>
              <button
                onClick={() => setIsAddingKR(true)}
                className={clsx(
                  'text-xs text-omnifocus-purple hover:underline'
                )}
              >
                + Add
              </button>
            </div>

            {/* Add KR form */}
            {isAddingKR && (
              <div className={clsx(
                'p-3 mb-2 rounded-lg',
                theme === 'dark' ? 'bg-omnifocus-bg' : 'bg-gray-50'
              )}>
                <input
                  type="text"
                  value={newKRTitle}
                  onChange={(e) => setNewKRTitle(e.target.value)}
                  placeholder="Key result title..."
                  className={clsx(
                    'w-full bg-transparent text-sm outline-none mb-2',
                    theme === 'dark' ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
                  )}
                  autoFocus
                />
                <input
                  type="number"
                  value={newKRTarget}
                  onChange={(e) => setNewKRTarget(e.target.value)}
                  placeholder="Target value..."
                  className={clsx(
                    'w-full bg-transparent text-sm outline-none',
                    theme === 'dark' ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
                  )}
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    onClick={() => setIsAddingKR(false)}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddKR}
                    className="text-xs text-omnifocus-purple"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}

            {/* Key results list */}
            {goal.keyResults.length === 0 && !isAddingKR ? (
              <p className={clsx(
                'text-sm py-2',
                theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
              )}>
                No key results yet
              </p>
            ) : (
              <div className="space-y-2">
                {goal.keyResults.map(kr => (
                  <KeyResultItem
                    key={kr.id}
                    keyResult={kr}
                    onUpdate={(updates) => onUpdateKeyResult(kr.id, updates)}
                    onDelete={() => onDeleteKeyResult(kr.id)}
                    theme={theme}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className={clsx(
            'flex items-center justify-end gap-2 mt-4 pt-4 border-t',
            theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-100'
          )}>
            {goal.status !== 'completed' && (
              <button
                onClick={() => onUpdate({
                  status: 'completed',
                  completedAt: new Date().toISOString(),
                  progress: 100,
                })}
                className="px-3 py-1.5 text-xs text-green-500 hover:bg-green-500/10 rounded-lg transition-colors"
              >
                Complete
              </button>
            )}
            <button
              onClick={onDelete}
              className="px-3 py-1.5 text-xs text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Key Result item
interface KeyResultItemProps {
  keyResult: KeyResult;
  onUpdate: (updates: Partial<KeyResult>) => void;
  onDelete: () => void;
  theme: 'light' | 'dark';
}

function KeyResultItem({ keyResult, onUpdate, onDelete, theme }: KeyResultItemProps) {
  const progress = Math.min(100, (keyResult.currentValue / keyResult.targetValue) * 100);

  return (
    <div className={clsx(
      'p-2 rounded-lg',
      theme === 'dark' ? 'bg-omnifocus-bg' : 'bg-gray-50'
    )}>
      <div className="flex items-center justify-between gap-2">
        <p className={clsx(
          'text-sm flex-1',
          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
        )}>
          {keyResult.title}
        </p>
        <button
          onClick={onDelete}
          className={clsx(
            'p-1 rounded opacity-0 hover:opacity-100 transition-opacity',
            theme === 'dark' ? 'text-gray-500 hover:text-red-400' : 'text-gray-400 hover:text-red-500'
          )}
        >
          <Trash2 size={12} />
        </button>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <div className={clsx(
          'flex-1 h-1.5 rounded-full overflow-hidden',
          theme === 'dark' ? 'bg-omnifocus-surface' : 'bg-gray-200'
        )}>
          <div
            className="h-full rounded-full bg-omnifocus-purple transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={keyResult.currentValue}
            onChange={(e) => onUpdate({ currentValue: parseFloat(e.target.value) || 0 })}
            className={clsx(
              'w-12 text-xs text-right bg-transparent outline-none',
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            )}
          />
          <span className={clsx(
            'text-xs',
            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
          )}>
            / {keyResult.targetValue}
            {keyResult.unit && ` ${keyResult.unit}`}
          </span>
        </div>
      </div>
    </div>
  );
}

// Goal summary widget for dashboard
export function GoalSummaryWidget({ className }: { className?: string }) {
  const { theme } = useAppStore();
  const { goals } = useGoals();

  const activeGoals = goals.filter(g => g.status === 'active');
  const averageProgress = activeGoals.length > 0
    ? Math.round(activeGoals.reduce((sum, g) => sum + g.progress, 0) / activeGoals.length)
    : 0;

  return (
    <div className={clsx(
      'p-4 rounded-xl',
      theme === 'dark' ? 'bg-omnifocus-surface' : 'bg-gray-100',
      className
    )}>
      <div className="flex items-center gap-2 mb-3">
        <Target size={16} className="text-omnifocus-purple" />
        <span className={clsx(
          'text-sm font-medium',
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        )}>
          Goals Progress
        </span>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className={clsx(
            'text-3xl font-bold',
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            {averageProgress}%
          </p>
          <p className={clsx(
            'text-xs',
            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
          )}>
            {activeGoals.length} active goal{activeGoals.length !== 1 ? 's' : ''}
          </p>
        </div>
        <TrendingUp size={20} className="text-green-500" />
      </div>
    </div>
  );
}
