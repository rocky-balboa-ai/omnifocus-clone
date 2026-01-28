'use client';

import { useState } from 'react';
import { useAppStore } from '@/stores/app.store';
import {
  FolderPlus,
  X,
  ChevronRight,
  Plus,
  Trash2,
  Copy,
  Briefcase,
  Home,
  GraduationCap,
  Plane,
  ShoppingCart,
  Heart,
  Code,
  FileText,
  Users,
} from 'lucide-react';
import clsx from 'clsx';

interface ProjectTemplateAction {
  title: string;
  deferDays?: number;
  dueDays?: number;
}

interface ProjectTemplate {
  id: string;
  name: string;
  icon: string;
  description: string;
  projectType: 'sequential' | 'parallel' | 'single_actions';
  actions: ProjectTemplateAction[];
}

const TEMPLATE_ICONS: Record<string, any> = {
  briefcase: Briefcase,
  home: Home,
  graduation: GraduationCap,
  plane: Plane,
  shopping: ShoppingCart,
  heart: Heart,
  code: Code,
  file: FileText,
  users: Users,
};

const DEFAULT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'weekly-review',
    name: 'Weekly Review',
    icon: 'file',
    description: 'GTD weekly review checklist',
    projectType: 'sequential',
    actions: [
      { title: 'Get inbox to zero' },
      { title: 'Review past calendar entries' },
      { title: 'Review upcoming calendar' },
      { title: 'Review waiting-for list' },
      { title: 'Review project list' },
      { title: 'Review someday/maybe list' },
      { title: 'Review goals and objectives' },
    ],
  },
  {
    id: 'trip-planning',
    name: 'Trip Planning',
    icon: 'plane',
    description: 'Plan a vacation or business trip',
    projectType: 'parallel',
    actions: [
      { title: 'Book flights', dueDays: 30 },
      { title: 'Book accommodation', dueDays: 25 },
      { title: 'Research activities and attractions' },
      { title: 'Create packing list', dueDays: 7 },
      { title: 'Arrange transportation' },
      { title: 'Notify bank of travel', dueDays: 3 },
      { title: 'Set up out-of-office', dueDays: 1 },
    ],
  },
  {
    id: 'new-project',
    name: 'New Software Project',
    icon: 'code',
    description: 'Start a new development project',
    projectType: 'sequential',
    actions: [
      { title: 'Define project requirements' },
      { title: 'Create project repository' },
      { title: 'Set up development environment' },
      { title: 'Design system architecture' },
      { title: 'Create initial project structure' },
      { title: 'Set up CI/CD pipeline' },
      { title: 'Write documentation' },
    ],
  },
  {
    id: 'event-planning',
    name: 'Event Planning',
    icon: 'users',
    description: 'Organize a meeting or party',
    projectType: 'parallel',
    actions: [
      { title: 'Set date and time' },
      { title: 'Create guest list' },
      { title: 'Book venue' },
      { title: 'Send invitations', dueDays: 14 },
      { title: 'Plan menu/catering' },
      { title: 'Arrange decorations' },
      { title: 'Create agenda/schedule' },
      { title: 'Send reminders', dueDays: 3 },
    ],
  },
  {
    id: 'onboarding',
    name: 'New Job Onboarding',
    icon: 'briefcase',
    description: 'First week at a new job',
    projectType: 'sequential',
    actions: [
      { title: 'Complete HR paperwork' },
      { title: 'Set up workstation' },
      { title: 'Request necessary access/accounts' },
      { title: 'Meet with manager for expectations' },
      { title: 'Review team documentation' },
      { title: 'Schedule 1:1s with team members' },
      { title: 'Complete required training' },
    ],
  },
];

const TEMPLATES_STORAGE_KEY = 'omnifocus-project-templates';

interface ProjectTemplatesProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject?: (template: ProjectTemplate) => void;
}

export function ProjectTemplates({ isOpen, onClose, onCreateProject }: ProjectTemplatesProps) {
  const { theme, createProject, createAction, fetchProjects, fetchActions, currentPerspective } = useAppStore();
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [customName, setCustomName] = useState('');

  // Load custom templates from localStorage
  const getTemplates = (): ProjectTemplate[] => {
    if (typeof window === 'undefined') return DEFAULT_TEMPLATES;
    const saved = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    if (saved) {
      try {
        return [...DEFAULT_TEMPLATES, ...JSON.parse(saved)];
      } catch {
        return DEFAULT_TEMPLATES;
      }
    }
    return DEFAULT_TEMPLATES;
  };

  const templates = getTemplates();

  const handleCreateFromTemplate = async () => {
    if (!selectedTemplate) return;

    setIsCreating(true);
    try {
      // Create the project
      const project = await createProject({
        name: customName || selectedTemplate.name,
        type: selectedTemplate.projectType,
      });

      // Create actions for the project
      const today = new Date();
      for (const actionTemplate of selectedTemplate.actions) {
        const dueDate = actionTemplate.dueDays
          ? new Date(today.getTime() + actionTemplate.dueDays * 24 * 60 * 60 * 1000)
          : undefined;
        const deferDate = actionTemplate.deferDays
          ? new Date(today.getTime() + actionTemplate.deferDays * 24 * 60 * 60 * 1000)
          : undefined;

        await createAction({
          title: actionTemplate.title,
          projectId: project.id,
          dueDate: dueDate?.toISOString(),
          deferDate: deferDate?.toISOString(),
        });
      }

      // Refresh data
      fetchProjects();
      fetchActions(currentPerspective);

      // Close and reset
      setSelectedTemplate(null);
      setCustomName('');
      onClose();
      onCreateProject?.(selectedTemplate);
    } catch (error) {
      console.error('Failed to create project from template:', error);
    } finally {
      setIsCreating(false);
    }
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
        'relative w-full max-w-2xl max-h-[80vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col',
        'animate-in zoom-in-95 duration-200',
        theme === 'dark' ? 'bg-omnifocus-sidebar' : 'bg-white'
      )}>
        {/* Header */}
        <div className={clsx(
          'flex items-center justify-between px-6 py-4 border-b',
          theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200'
        )}>
          <div className="flex items-center gap-3">
            <FolderPlus size={24} className="text-omnifocus-purple" />
            <h2 className={clsx(
              'text-xl font-semibold',
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            )}>
              {selectedTemplate ? 'Create from Template' : 'Project Templates'}
            </h2>
          </div>
          <button
            onClick={() => {
              if (selectedTemplate) {
                setSelectedTemplate(null);
                setCustomName('');
              } else {
                onClose();
              }
            }}
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
          {selectedTemplate ? (
            <div className="space-y-6">
              {/* Template info */}
              <div className={clsx(
                'p-4 rounded-xl',
                theme === 'dark' ? 'bg-omnifocus-surface' : 'bg-gray-50'
              )}>
                <div className="flex items-center gap-3 mb-2">
                  {(() => {
                    const Icon = TEMPLATE_ICONS[selectedTemplate.icon] || FileText;
                    return <Icon size={20} className="text-omnifocus-purple" />;
                  })()}
                  <h3 className={clsx(
                    'font-semibold',
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  )}>
                    {selectedTemplate.name}
                  </h3>
                </div>
                <p className={clsx(
                  'text-sm',
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                )}>
                  {selectedTemplate.description}
                </p>
              </div>

              {/* Custom name */}
              <div>
                <label className={clsx(
                  'block text-sm font-medium mb-2',
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                )}>
                  Project Name
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder={selectedTemplate.name}
                  className={clsx(
                    'w-full px-4 py-2 rounded-lg border',
                    theme === 'dark'
                      ? 'bg-omnifocus-bg border-omnifocus-border text-white placeholder-gray-500'
                      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                  )}
                />
              </div>

              {/* Actions preview */}
              <div>
                <label className={clsx(
                  'block text-sm font-medium mb-2',
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                )}>
                  Actions ({selectedTemplate.actions.length})
                </label>
                <ul className={clsx(
                  'rounded-lg border divide-y',
                  theme === 'dark'
                    ? 'border-omnifocus-border divide-omnifocus-border'
                    : 'border-gray-200 divide-gray-200'
                )}>
                  {selectedTemplate.actions.map((action, index) => (
                    <li
                      key={index}
                      className={clsx(
                        'px-4 py-2 text-sm flex items-center justify-between',
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      )}
                    >
                      <span>{action.title}</span>
                      {action.dueDays && (
                        <span className={clsx(
                          'text-xs',
                          theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                        )}>
                          Due in {action.dueDays}d
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map(template => {
                const Icon = TEMPLATE_ICONS[template.icon] || FileText;
                return (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template)}
                    className={clsx(
                      'p-4 rounded-xl border text-left transition-colors',
                      theme === 'dark'
                        ? 'bg-omnifocus-surface border-omnifocus-border hover:border-omnifocus-purple'
                        : 'bg-gray-50 border-gray-200 hover:border-purple-300'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={clsx(
                        'p-2 rounded-lg',
                        theme === 'dark' ? 'bg-omnifocus-bg' : 'bg-white'
                      )}>
                        <Icon size={20} className="text-omnifocus-purple" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={clsx(
                          'font-semibold mb-1',
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        )}>
                          {template.name}
                        </h3>
                        <p className={clsx(
                          'text-sm line-clamp-2',
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        )}>
                          {template.description}
                        </p>
                        <p className={clsx(
                          'text-xs mt-2',
                          theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                        )}>
                          {template.actions.length} actions · {template.projectType}
                        </p>
                      </div>
                      <ChevronRight size={20} className={clsx(
                        theme === 'dark' ? 'text-gray-600' : 'text-gray-300'
                      )} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {selectedTemplate && (
          <div className={clsx(
            'px-6 py-4 border-t flex justify-end gap-3',
            theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200'
          )}>
            <button
              onClick={() => {
                setSelectedTemplate(null);
                setCustomName('');
              }}
              className={clsx(
                'px-4 py-2 rounded-lg transition-colors',
                theme === 'dark'
                  ? 'bg-omnifocus-surface text-gray-300 hover:bg-omnifocus-border'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              Back
            </button>
            <button
              onClick={handleCreateFromTemplate}
              disabled={isCreating}
              className="px-4 py-2 rounded-lg bg-omnifocus-purple text-white hover:bg-omnifocus-purple/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isCreating ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Plus size={18} />
              )}
              Create Project
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
