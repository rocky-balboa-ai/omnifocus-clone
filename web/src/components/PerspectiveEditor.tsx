'use client';

import { useState, useEffect } from 'react';
import { useAppStore, Perspective } from '@/stores/app.store';
import {
  X,
  Plus,
  Trash2,
  Save,
  Layers,
  Flag,
  Calendar,
  FolderKanban,
  Tags,
  CheckCircle2,
} from 'lucide-react';
import clsx from 'clsx';

interface PerspectiveEditorProps {
  perspectiveId?: string | null;
  isOpen: boolean;
  onClose: () => void;
}

interface FilterRule {
  field: string;
  operator: string;
  value?: string | boolean;
}

const filterFields = [
  { value: 'status', label: 'Status', icon: CheckCircle2 },
  { value: 'flagged', label: 'Flagged', icon: Flag },
  { value: 'dueDate', label: 'Due Date', icon: Calendar },
  { value: 'projectId', label: 'Project', icon: FolderKanban },
  { value: 'tagId', label: 'Tag', icon: Tags },
];

const operatorsByField: Record<string, { value: string; label: string }[]> = {
  status: [
    { value: 'eq', label: 'is' },
    { value: 'neq', label: 'is not' },
  ],
  flagged: [
    { value: 'eq', label: 'is' },
  ],
  dueDate: [
    { value: 'isNotNull', label: 'has a due date' },
    { value: 'isNull', label: 'has no due date' },
    { value: 'lte', label: 'is on or before' },
    { value: 'gte', label: 'is on or after' },
  ],
  projectId: [
    { value: 'eq', label: 'is' },
    { value: 'neq', label: 'is not' },
  ],
  tagId: [
    { value: 'eq', label: 'includes' },
  ],
};

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'dropped', label: 'Dropped' },
  { value: 'on_hold', label: 'On Hold' },
];

export function PerspectiveEditor({ perspectiveId, isOpen, onClose }: PerspectiveEditorProps) {
  const { perspectives, projects, tags, fetchPerspectives } = useAppStore();
  const perspective = perspectiveId ? perspectives.find(p => p.id === perspectiveId) : null;

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('folder');
  const [filterRules, setFilterRules] = useState<FilterRule[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (perspective) {
      setName(perspective.name);
      setIcon(perspective.icon || 'folder');
      setFilterRules((perspective.filterRules as FilterRule[]) || []);
    } else {
      setName('');
      setIcon('folder');
      setFilterRules([]);
    }
  }, [perspective]);

  const handleAddRule = () => {
    setFilterRules([...filterRules, { field: 'status', operator: 'eq', value: 'active' }]);
  };

  const handleRemoveRule = (index: number) => {
    setFilterRules(filterRules.filter((_, i) => i !== index));
  };

  const handleUpdateRule = (index: number, updates: Partial<FilterRule>) => {
    setFilterRules(filterRules.map((rule, i) =>
      i === index ? { ...rule, ...updates } : rule
    ));
  };

  const handleSave = async () => {
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7848';
      const method = perspective ? 'PATCH' : 'POST';
      const url = perspective
        ? `${apiUrl}/api/perspectives/${perspective.id}`
        : `${apiUrl}/api/perspectives`;

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name,
          icon,
          filterRules,
        }),
      });

      await fetchPerspectives();
      onClose();
    } catch (error) {
      console.error('Failed to save perspective:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const renderValueInput = (rule: FilterRule, index: number) => {
    const operator = rule.operator;

    // Operators that don't need a value
    if (operator === 'isNull' || operator === 'isNotNull') {
      return null;
    }

    switch (rule.field) {
      case 'status':
        return (
          <select
            value={rule.value as string || 'active'}
            onChange={(e) => handleUpdateRule(index, { value: e.target.value })}
            className="flex-1 px-3 py-2 rounded-lg bg-omnifocus-surface border border-omnifocus-border text-white text-sm"
          >
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        );

      case 'flagged':
        return (
          <select
            value={String(rule.value ?? true)}
            onChange={(e) => handleUpdateRule(index, { value: e.target.value === 'true' })}
            className="flex-1 px-3 py-2 rounded-lg bg-omnifocus-surface border border-omnifocus-border text-white text-sm"
          >
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        );

      case 'dueDate':
        if (operator === 'lte' || operator === 'gte') {
          return (
            <input
              type="date"
              value={rule.value as string || ''}
              onChange={(e) => handleUpdateRule(index, { value: e.target.value })}
              className="flex-1 px-3 py-2 rounded-lg bg-omnifocus-surface border border-omnifocus-border text-white text-sm"
            />
          );
        }
        return null;

      case 'projectId':
        return (
          <select
            value={rule.value as string || ''}
            onChange={(e) => handleUpdateRule(index, { value: e.target.value })}
            className="flex-1 px-3 py-2 rounded-lg bg-omnifocus-surface border border-omnifocus-border text-white text-sm"
          >
            <option value="">Select project...</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        );

      case 'tagId':
        return (
          <select
            value={rule.value as string || ''}
            onChange={(e) => handleUpdateRule(index, { value: e.target.value })}
            className="flex-1 px-3 py-2 rounded-lg bg-omnifocus-surface border border-omnifocus-border text-white text-sm"
          >
            <option value="">Select tag...</option>
            {tags.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-50"
        onClick={onClose}
      />

      {/* Editor Panel */}
      <div className={clsx(
        'fixed z-50 bg-omnifocus-sidebar border border-omnifocus-border overflow-hidden shadow-2xl',
        // Mobile: bottom sheet
        'inset-x-0 bottom-0 max-h-[90vh] rounded-t-2xl',
        // Desktop: centered modal
        'md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[520px] md:rounded-2xl md:max-h-[85vh]'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-omnifocus-border">
          <div className="flex items-center gap-2">
            <Layers size={20} className="text-omnifocus-purple" />
            <h2 className="text-lg font-semibold text-white">
              {perspective ? 'Edit Perspective' : 'New Perspective'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-omnifocus-surface text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[calc(90vh-130px)] md:max-h-[calc(85vh-130px)]">
          {/* Name */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-omnifocus-surface border border-omnifocus-border text-white placeholder-gray-500"
              placeholder="My Perspective"
            />
          </div>

          {/* Filter Rules */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-gray-400">Filter Rules</label>
              <button
                onClick={handleAddRule}
                className="flex items-center gap-1 px-2 py-1 text-sm text-omnifocus-purple hover:bg-omnifocus-purple/10 rounded transition-colors"
              >
                <Plus size={14} />
                Add Rule
              </button>
            </div>

            {filterRules.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">
                No filter rules. Add rules to filter which actions appear.
              </p>
            ) : (
              <div className="space-y-3">
                {filterRules.map((rule, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 rounded-lg bg-omnifocus-surface">
                    {/* Field selector */}
                    <select
                      value={rule.field}
                      onChange={(e) => {
                        const newField = e.target.value;
                        const operators = operatorsByField[newField] || [];
                        handleUpdateRule(index, {
                          field: newField,
                          operator: operators[0]?.value || 'eq',
                          value: undefined,
                        });
                      }}
                      className="px-2 py-1.5 rounded bg-omnifocus-bg border border-omnifocus-border text-white text-sm"
                    >
                      {filterFields.map(f => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                    </select>

                    {/* Operator selector */}
                    <select
                      value={rule.operator}
                      onChange={(e) => handleUpdateRule(index, { operator: e.target.value })}
                      className="px-2 py-1.5 rounded bg-omnifocus-bg border border-omnifocus-border text-white text-sm"
                    >
                      {(operatorsByField[rule.field] || []).map(op => (
                        <option key={op.value} value={op.value}>{op.label}</option>
                      ))}
                    </select>

                    {/* Value input */}
                    {renderValueInput(rule, index)}

                    {/* Delete button */}
                    <button
                      onClick={() => handleRemoveRule(index)}
                      className="p-1.5 rounded hover:bg-omnifocus-border text-gray-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-4 py-3 border-t border-omnifocus-border">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-omnifocus-surface transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || isSaving}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
              name.trim() && !isSaving
                ? 'bg-omnifocus-purple text-white hover:bg-omnifocus-purple/90'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            )}
          >
            <Save size={16} />
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </>
  );
}
