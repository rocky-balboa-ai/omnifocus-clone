import { create } from 'zustand';
import { api } from '@/lib/api';

export interface Attachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
}

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number; // e.g., every 2 weeks
  daysOfWeek?: number[]; // 0-6 for weekly (0 = Sunday)
  dayOfMonth?: number; // 1-31 for monthly
  endDate?: string;
  count?: number; // number of occurrences
}

export interface Action {
  id: string;
  title: string;
  note?: string;
  status: 'active' | 'completed' | 'dropped' | 'on_hold';
  flagged: boolean;
  deferDate?: string;
  dueDate?: string;
  plannedDate?: string;
  completedAt?: string;
  estimatedMinutes?: number;
  projectId?: string;
  parentId?: string;
  position: number;
  project?: Project;
  tags: { tag: Tag }[];
  children?: Action[];
  attachments?: Attachment[];
  recurrence?: RecurrenceRule;
  blockedBy?: string[];  // IDs of actions that must complete before this one
}

export interface Project {
  id: string;
  name: string;
  note?: string;
  status: 'active' | 'completed' | 'dropped' | 'on_hold';
  type: 'sequential' | 'parallel' | 'single_actions';
  flagged: boolean;
  deferDate?: string;
  dueDate?: string;
  reviewInterval?: string;
  nextReviewAt?: string;
  folderId?: string;
  actions?: Action[];
  _count?: { actions: number; completedActions?: number };
}

export interface Tag {
  id: string;
  name: string;
  parentId?: string;
  availableFrom?: string | null;  // Time like "09:00"
  availableUntil?: string | null; // Time like "17:00"
  children?: Tag[];
  _count?: { actions: number; projects: number };
}

export interface Folder {
  id: string;
  name: string;
  parentId?: string;
  children?: Folder[];
  projects?: Project[];
}

export interface Perspective {
  id: string;
  name: string;
  icon?: string;
  isBuiltIn: boolean;
  filterRules?: any[];
  sortRules?: any[];
  groupBy?: string;
}

export interface ActionTemplate {
  id: string;
  name: string;
  title?: string;
  note?: string;
  flagged?: boolean;
  estimatedMinutes?: number;
  projectId?: string;
  deferDays?: number; // Days from creation to defer
  dueDays?: number; // Days from creation to due
}

interface AppState {
  // Data
  actions: Action[];
  projects: Project[];
  tags: Tag[];
  folders: Folder[];
  perspectives: Perspective[];
  templates: ActionTemplate[];

  // Auth State
  isAuthenticated: boolean;
  currentUser: { id: string; username: string } | null;

  // UI State
  currentPerspective: string;
  selectedActionId: string | null;
  selectedProjectId: string | null;
  selectedFolderId: string | null;
  editingPerspectiveId: string | null;
  filterTagId: string | null;
  focusedProjectId: string | null;
  focusedTagId: string | null;
  selectedActionIds: Set<string>;
  collapsedActionIds: Set<string>;
  isQuickEntryOpen: boolean;
  isSearchOpen: boolean;
  isCommandPaletteOpen: boolean;
  isPerspectiveEditorOpen: boolean;
  isSettingsOpen: boolean;
  isKeyboardHelpOpen: boolean;
  isFocusTimerOpen: boolean;
  isWeeklyReviewOpen: boolean;
  isHabitTrackerOpen: boolean;
  isTimeBlockerOpen: boolean;
  showCompleted: boolean;
  isLoading: boolean;
  error: string | null;
  theme: 'light' | 'dark';
  themeMode: 'light' | 'dark' | 'auto';
  isFocusMode: boolean;

  // Actions
  // Auth Actions
  setAuthenticated: (isAuthenticated: boolean, user?: { id: string; username: string } | null) => void;
  logout: () => void;
  checkAuth: () => void;

  setCurrentPerspective: (id: string) => void;
  setSelectedAction: (id: string | null) => void;
  setSelectedProject: (id: string | null) => void;
  setSelectedFolderId: (id: string | null) => void;
  setQuickEntryOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setShowCompleted: (show: boolean) => void;
  setFilterTagId: (tagId: string | null) => void;
  setFocusedProject: (projectId: string | null) => void;
  setFocusedTag: (tagId: string | null) => void;
  clearFocus: () => void;
  toggleActionSelection: (id: string) => void;
  clearActionSelection: () => void;
  selectAllActions: () => void;
  bulkCompleteActions: () => Promise<void>;
  bulkDeleteActions: () => Promise<void>;
  bulkFlagActions: (flagged: boolean) => Promise<void>;
  bulkSetDueDate: (dueDate: string | null) => Promise<void>;
  bulkSetProject: (projectId: string | null) => Promise<void>;
  openPerspectiveEditor: (id?: string | null) => void;
  closePerspectiveEditor: () => void;
  setSettingsOpen: (open: boolean) => void;
  setKeyboardHelpOpen: (open: boolean) => void;
  setFocusTimerOpen: (open: boolean) => void;
  setWeeklyReviewOpen: (open: boolean) => void;
  setHabitTrackerOpen: (open: boolean) => void;
  setTimeBlockerOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setThemeMode: (mode: 'light' | 'dark' | 'auto') => void;
  toggleTheme: () => void;
  toggleFocusMode: () => void;

  // API Actions
  fetchPerspectives: () => Promise<void>;
  fetchActions: (perspectiveId: string) => Promise<void>;
  fetchProjects: () => Promise<void>;
  fetchTags: () => Promise<void>;
  fetchFolders: () => Promise<void>;

  createAction: (data: Partial<Action>) => Promise<Action>;
  updateAction: (id: string, data: Partial<Action>) => Promise<Action>;
  completeAction: (id: string) => Promise<void>;
  uncompleteAction: (id: string) => Promise<void>;
  deleteAction: (id: string) => Promise<void>;
  reorderActions: (actionIds: string[]) => void;
  toggleActionCollapsed: (id: string) => void;
  indentAction: (id: string) => Promise<void>;
  outdentAction: (id: string) => Promise<void>;

  createProject: (data: Partial<Project>) => Promise<Project>;
  updateProject: (id: string, data: Partial<Project>) => Promise<Project>;
  cleanupCompleted: (olderThanDays?: number) => Promise<{ deleted: number }>;

  createTag: (data: Partial<Tag>) => Promise<Tag>;
  updateTag: (id: string, data: Partial<Tag>) => Promise<Tag>;
  deleteTag: (id: string) => Promise<void>;

  // Templates
  saveTemplate: (template: Omit<ActionTemplate, 'id'>) => void;
  deleteTemplate: (id: string) => void;
  createActionFromTemplate: (templateId: string) => Promise<Action>;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  isAuthenticated: false,
  currentUser: null,

  actions: [],
  projects: [],
  tags: [],
  folders: [],
  perspectives: [],
  templates: typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('omnifocus-templates') || '[]')
    : [],
  currentPerspective: 'inbox',
  selectedActionId: null,
  selectedProjectId: null,
  selectedFolderId: null,
  editingPerspectiveId: null,
  filterTagId: null,
  focusedProjectId: null,
  focusedTagId: null,
  selectedActionIds: new Set<string>(),
  collapsedActionIds: new Set<string>(),
  isQuickEntryOpen: false,
  isSearchOpen: false,
  isCommandPaletteOpen: false,
  isPerspectiveEditorOpen: false,
  isSettingsOpen: false,
  isKeyboardHelpOpen: false,
  isFocusTimerOpen: false,
  isWeeklyReviewOpen: false,
  isHabitTrackerOpen: false,
  isTimeBlockerOpen: false,
  showCompleted: false,
  isLoading: false,
  error: null,
  theme: 'dark',
  themeMode: 'auto',
  isFocusMode: false,

  // Auth Actions
  setAuthenticated: (isAuthenticated, user = null) => set({ isAuthenticated, currentUser: user }),
  logout: () => {
    localStorage.removeItem('authToken');
    set({ isAuthenticated: false, currentUser: null });
  },
  checkAuth: () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    if (token) {
      set({ isAuthenticated: true });
    }
  },

  // UI Actions
  setCurrentPerspective: (id) => set({ currentPerspective: id }),
  setSelectedAction: (id) => set({ selectedActionId: id }),
  setSelectedProject: (id) => set({ selectedProjectId: id }),
  setSelectedFolderId: (id) => set({ selectedFolderId: id }),
  setQuickEntryOpen: (open) => set({ isQuickEntryOpen: open }),
  setSearchOpen: (open) => set({ isSearchOpen: open }),
  setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),
  setShowCompleted: (show) => set({ showCompleted: show }),
  setFilterTagId: (tagId) => set({ filterTagId: tagId }),
  setFocusedProject: (projectId) => set({ focusedProjectId: projectId, focusedTagId: null }),
  setFocusedTag: (tagId) => set({ focusedTagId: tagId, focusedProjectId: null }),
  clearFocus: () => set({ focusedProjectId: null, focusedTagId: null }),

  toggleActionSelection: (id) => {
    set((state) => {
      const newSelected = new Set(state.selectedActionIds);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return { selectedActionIds: newSelected };
    });
  },

  clearActionSelection: () => set({ selectedActionIds: new Set<string>() }),

  selectAllActions: () => {
    const { actions } = get();
    set({ selectedActionIds: new Set(actions.map(a => a.id)) });
  },

  bulkCompleteActions: async () => {
    const { selectedActionIds, clearActionSelection, fetchActions, currentPerspective } = get();
    const actionIds = Array.from(selectedActionIds);
    if (actionIds.length === 0) return;

    try {
      await api.post('/actions/bulk/complete', { actionIds });
      await fetchActions(currentPerspective);
      clearActionSelection();
    } catch (e) {
      // Fallback to individual completion
      for (const id of actionIds) {
        await api.post(`/actions/${id}/complete`);
      }
      await fetchActions(currentPerspective);
      clearActionSelection();
    }
  },

  bulkDeleteActions: async () => {
    const { selectedActionIds, clearActionSelection, fetchActions, currentPerspective } = get();
    const actionIds = Array.from(selectedActionIds);
    if (actionIds.length === 0) return;

    try {
      await api.post('/actions/bulk/delete', { actionIds });
      await fetchActions(currentPerspective);
      clearActionSelection();
    } catch (e) {
      // Fallback to individual deletion
      for (const id of actionIds) {
        await api.delete(`/actions/${id}`);
      }
      await fetchActions(currentPerspective);
      clearActionSelection();
    }
  },

  bulkFlagActions: async (flagged: boolean) => {
    const { selectedActionIds, clearActionSelection, fetchActions, currentPerspective } = get();
    const actionIds = Array.from(selectedActionIds);
    if (actionIds.length === 0) return;

    try {
      await api.post('/actions/bulk/update', { actionIds, update: { flagged } });
      await fetchActions(currentPerspective);
      clearActionSelection();
    } catch (e) {
      // Fallback to individual update
      for (const id of actionIds) {
        await api.patch(`/actions/${id}`, { flagged });
      }
      await fetchActions(currentPerspective);
      clearActionSelection();
    }
  },

  bulkSetDueDate: async (dueDate: string | null) => {
    const { selectedActionIds, clearActionSelection, fetchActions, currentPerspective } = get();
    const actionIds = Array.from(selectedActionIds);
    if (actionIds.length === 0) return;

    try {
      await api.post('/actions/bulk/update', { actionIds, update: { dueDate } });
      await fetchActions(currentPerspective);
      clearActionSelection();
    } catch (e) {
      // Fallback to individual update
      for (const id of actionIds) {
        await api.patch(`/actions/${id}`, { dueDate });
      }
      await fetchActions(currentPerspective);
      clearActionSelection();
    }
  },

  bulkSetProject: async (projectId: string | null) => {
    const { selectedActionIds, clearActionSelection, fetchActions, currentPerspective } = get();
    const actionIds = Array.from(selectedActionIds);
    if (actionIds.length === 0) return;

    try {
      await api.post('/actions/bulk/move', { actionIds, projectId });
      await fetchActions(currentPerspective);
      clearActionSelection();
    } catch (e) {
      // Fallback to individual update
      for (const id of actionIds) {
        await api.patch(`/actions/${id}`, { projectId });
      }
      await fetchActions(currentPerspective);
      clearActionSelection();
    }
  },

  openPerspectiveEditor: (id) => set({ isPerspectiveEditorOpen: true, editingPerspectiveId: id || null }),
  closePerspectiveEditor: () => set({ isPerspectiveEditorOpen: false, editingPerspectiveId: null }),
  setSettingsOpen: (open) => set({ isSettingsOpen: open }),
  setKeyboardHelpOpen: (open) => set({ isKeyboardHelpOpen: open }),
  setFocusTimerOpen: (open) => set({ isFocusTimerOpen: open }),
  setWeeklyReviewOpen: (open) => set({ isWeeklyReviewOpen: open }),
  setHabitTrackerOpen: (open) => set({ isHabitTrackerOpen: open }),
  setTimeBlockerOpen: (open) => set({ isTimeBlockerOpen: open }),

  setTheme: (theme) => {
    set({ theme });
    // Update document class and localStorage
    if (typeof window !== 'undefined') {
      document.documentElement.classList.toggle('dark', theme === 'dark');
      localStorage.setItem('omnifocus-theme', theme);
    }
  },

  setThemeMode: (mode) => {
    set({ themeMode: mode });
    if (typeof window !== 'undefined') {
      localStorage.setItem('omnifocus-theme-mode', mode);
      if (mode === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        get().setTheme(prefersDark ? 'dark' : 'light');
      } else {
        get().setTheme(mode);
      }
    }
  },

  toggleTheme: () => {
    const { theme, setTheme } = get();
    setTheme(theme === 'dark' ? 'light' : 'dark');
  },

  toggleFocusMode: () => {
    set((state) => ({ isFocusMode: !state.isFocusMode }));
  },

  // API Actions
  fetchPerspectives: async () => {
    try {
      const perspectives = await api.get<Perspective[]>('/perspectives');
      set({ perspectives });
    } catch (error) {
      set({ error: 'Failed to fetch perspectives' });
    }
  },

  fetchActions: async (perspectiveId) => {
    set({ isLoading: true, error: null });
    try {
      const { filterTagId, focusedProjectId, focusedTagId } = get();
      let actions: Action[];

      if (filterTagId) {
        // Fetch actions filtered by tag
        actions = await api.get<Action[]>(`/actions?tagId=${filterTagId}`);
      } else {
        // Fetch actions by perspective
        actions = await api.get<Action[]>(`/perspectives/${perspectiveId}/actions`);
      }

      // Apply focus filter on the client side
      if (focusedProjectId) {
        actions = actions.filter(a => a.projectId === focusedProjectId);
      } else if (focusedTagId) {
        actions = actions.filter(a =>
          a.tags?.some(t => t.tagId === focusedTagId || t.tag?.id === focusedTagId)
        );
      }

      set({ actions, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch actions', isLoading: false });
    }
  },

  fetchProjects: async () => {
    try {
      const projects = await api.get<Project[]>('/projects');
      set({ projects });
    } catch (error) {
      set({ error: 'Failed to fetch projects' });
    }
  },

  fetchTags: async () => {
    try {
      const tags = await api.get<Tag[]>('/tags');
      set({ tags });
    } catch (error) {
      set({ error: 'Failed to fetch tags' });
    }
  },

  fetchFolders: async () => {
    try {
      const folders = await api.get<Folder[]>('/folders');
      set({ folders });
    } catch (error) {
      set({ error: 'Failed to fetch folders' });
    }
  },

  createAction: async (data) => {
    const action = await api.post<Action>('/actions', data);
    set((state) => ({ actions: [...state.actions, action] }));
    return action;
  },

  updateAction: async (id, data) => {
    const action = await api.patch<Action>(`/actions/${id}`, data);
    set((state) => ({
      actions: state.actions.map((a) => (a.id === id ? action : a)),
    }));
    return action;
  },

  completeAction: async (id) => {
    const { actions, showCompleted } = get();
    const action = actions.find(a => a.id === id);
    const actionTitle = action?.title || 'Action';

    await api.post(`/actions/${id}/complete`);

    // Update action status instead of removing (so undo can work)
    set((state) => ({
      actions: state.actions.map(a =>
        a.id === id
          ? { ...a, status: 'completed' as const, completedAt: new Date().toISOString() }
          : a
      ).filter(a => showCompleted || a.status !== 'completed'),
    }));

    // Dispatch undo event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('action-completed', {
        detail: { actionId: id, title: actionTitle }
      }));
    }
  },

  uncompleteAction: async (id) => {
    await api.post(`/actions/${id}/uncomplete`);
    // Refresh actions to get the updated state
    const { currentPerspective, fetchActions } = get();
    await fetchActions(currentPerspective);
  },

  deleteAction: async (id) => {
    const { actions } = get();
    const action = actions.find(a => a.id === id);
    const actionTitle = action?.title || 'Action';
    const actionData = action ? { ...action } : null;

    await api.delete(`/actions/${id}`);
    set((state) => ({
      actions: state.actions.filter((a) => a.id !== id),
    }));

    // Dispatch undo event
    if (typeof window !== 'undefined' && actionData) {
      window.dispatchEvent(new CustomEvent('action-deleted', {
        detail: { actionId: id, title: actionTitle, actionData }
      }));
    }
  },

  reorderActions: (actionIds) => {
    set((state) => {
      const actionMap = new Map(state.actions.map(a => [a.id, a]));
      const reordered = actionIds
        .map(id => actionMap.get(id))
        .filter((a): a is Action => a !== undefined);

      // Add any actions not in the reorder list at the end
      const remainingActions = state.actions.filter(a => !actionIds.includes(a.id));

      return { actions: [...reordered, ...remainingActions] };
    });

    // Persist to API (fire and forget)
    api.post('/actions/reorder', { actionIds }).catch(console.error);
  },

  toggleActionCollapsed: (id) => {
    set((state) => {
      const newCollapsed = new Set(state.collapsedActionIds);
      if (newCollapsed.has(id)) {
        newCollapsed.delete(id);
      } else {
        newCollapsed.add(id);
      }
      return { collapsedActionIds: newCollapsed };
    });
  },

  indentAction: async (id) => {
    const { actions, updateAction } = get();
    const actionIndex = actions.findIndex(a => a.id === id);
    if (actionIndex <= 0) return; // Can't indent first item

    // Find the action above this one (potential parent)
    // Look for an action at the same level or above
    const action = actions[actionIndex];
    let potentialParentIndex = actionIndex - 1;

    // Find a sibling (same parentId) above this action to become the parent
    while (potentialParentIndex >= 0) {
      const potentialParent = actions[potentialParentIndex];
      if (potentialParent.parentId === action.parentId) {
        // Found a sibling above - make it the parent
        await updateAction(id, { parentId: potentialParent.id } as any);
        return;
      }
      potentialParentIndex--;
    }
  },

  outdentAction: async (id) => {
    const { actions, updateAction } = get();
    const action = actions.find(a => a.id === id);
    if (!action?.parentId) return; // Already at root level

    // Find the parent's parent
    const parent = actions.find(a => a.id === action.parentId);
    const newParentId = parent?.parentId || null;

    await updateAction(id, { parentId: newParentId } as any);
  },

  createProject: async (data) => {
    const project = await api.post<Project>('/projects', data);
    set((state) => ({ projects: [...state.projects, project] }));
    return project;
  },

  updateProject: async (id, data) => {
    const project = await api.patch<Project>(`/projects/${id}`, data);
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? project : p)),
    }));
    return project;
  },

  cleanupCompleted: async (olderThanDays = 7) => {
    const result = await api.post<{ deleted: number }>('/actions/cleanup', { olderThanDays });
    // Refresh actions to reflect the deleted items
    const { currentPerspective, fetchActions } = get();
    await fetchActions(currentPerspective);
    return result;
  },

  createTag: async (data) => {
    const tag = await api.post<Tag>('/tags', data);
    set((state) => ({ tags: [...state.tags, tag] }));
    return tag;
  },

  updateTag: async (id, data) => {
    const tag = await api.patch<Tag>(`/tags/${id}`, data);
    set((state) => ({
      tags: state.tags.map((t) => (t.id === id ? { ...t, ...tag } : t)),
    }));
    return tag;
  },

  deleteTag: async (id) => {
    await api.delete(`/tags/${id}`);
    set((state) => ({
      tags: state.tags.filter((t) => t.id !== id),
    }));
  },

  // Templates
  saveTemplate: (template) => {
    const newTemplate: ActionTemplate = {
      ...template,
      id: Math.random().toString(36).substr(2, 9),
    };
    set((state) => {
      const templates = [...state.templates, newTemplate];
      if (typeof window !== 'undefined') {
        localStorage.setItem('omnifocus-templates', JSON.stringify(templates));
      }
      return { templates };
    });
  },

  deleteTemplate: (id) => {
    set((state) => {
      const templates = state.templates.filter((t) => t.id !== id);
      if (typeof window !== 'undefined') {
        localStorage.setItem('omnifocus-templates', JSON.stringify(templates));
      }
      return { templates };
    });
  },

  createActionFromTemplate: async (templateId) => {
    const { templates, createAction } = get();
    const template = templates.find((t) => t.id === templateId);
    if (!template) throw new Error('Template not found');

    const now = new Date();
    const actionData: Partial<Action> = {
      title: template.title || '',
      note: template.note,
      flagged: template.flagged,
      estimatedMinutes: template.estimatedMinutes,
      projectId: template.projectId,
      status: 'active',
    };

    if (template.deferDays) {
      const deferDate = new Date(now);
      deferDate.setDate(deferDate.getDate() + template.deferDays);
      actionData.deferDate = deferDate.toISOString();
    }

    if (template.dueDays) {
      const dueDate = new Date(now);
      dueDate.setDate(dueDate.getDate() + template.dueDays);
      actionData.dueDate = dueDate.toISOString();
    }

    return createAction(actionData);
  },
}));
