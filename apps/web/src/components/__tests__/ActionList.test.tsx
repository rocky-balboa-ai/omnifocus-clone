import { render, screen, fireEvent } from '@testing-library/react';

// Mock the store
const mockCreateAction = jest.fn();
const mockStore = {
  actions: [
    { id: '1', title: 'Parent Task', parentId: null, status: 'active', flagged: false, tags: [] },
    { id: '2', title: 'Child Task', parentId: '1', status: 'active', flagged: false, tags: [] },
  ],
  projects: [],
  tags: [],
  theme: 'dark' as const,
  createAction: mockCreateAction,
  updateAction: jest.fn(),
  completeAction: jest.fn(),
  deleteAction: jest.fn(),
  setSelectedAction: jest.fn(),
  selectedActionId: null,
  toggleActionCollapsed: jest.fn(),
  indentAction: jest.fn(),
  outdentAction: jest.fn(),
  setFilterTagId: jest.fn(),
  fetchActions: jest.fn(),
  currentPerspective: 'inbox',
  collapsedActionIds: new Set<string>(),
};

jest.mock('@/stores/app.store', () => ({
  useAppStore: () => mockStore,
}));

jest.mock('@/lib/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

// Test the flattening logic for infinite nesting
describe('ActionList nesting', () => {
  // Helper function that mirrors the flattening logic from ActionList
  interface Action {
    id: string;
    title: string;
    parentId: string | null;
  }

  interface ActionWithDepth {
    action: Action;
    depth: number;
    hasChildren: boolean;
  }

  function flattenActions(actions: Action[], collapsedIds: Set<string> = new Set()): ActionWithDepth[] {
    const result: ActionWithDepth[] = [];
    const childrenMap = new Map<string | null, Action[]>();

    // Group actions by parent
    actions.forEach(action => {
      const parentId = action.parentId || null;
      if (!childrenMap.has(parentId)) {
        childrenMap.set(parentId, []);
      }
      childrenMap.get(parentId)!.push(action);
    });

    // Recursive function to flatten tree
    const flatten = (parentId: string | null, depth: number) => {
      const children = childrenMap.get(parentId) || [];
      children.forEach(action => {
        const actionChildren = childrenMap.get(action.id) || [];
        const hasChildren = actionChildren.length > 0;
        const isCollapsed = collapsedIds.has(action.id);

        result.push({ action, depth, hasChildren });

        // Only recurse if not collapsed
        if (!isCollapsed && hasChildren) {
          flatten(action.id, depth + 1);
        }
      });
    };

    flatten(null, 0);
    return result;
  }

  it('should flatten a simple parent-child relationship', () => {
    const actions: Action[] = [
      { id: '1', title: 'Parent', parentId: null },
      { id: '2', title: 'Child', parentId: '1' },
    ];

    const result = flattenActions(actions);

    expect(result).toHaveLength(2);
    expect(result[0].action.title).toBe('Parent');
    expect(result[0].depth).toBe(0);
    expect(result[0].hasChildren).toBe(true);
    expect(result[1].action.title).toBe('Child');
    expect(result[1].depth).toBe(1);
    expect(result[1].hasChildren).toBe(false);
  });

  it('should support infinite nesting (3 levels deep)', () => {
    const actions: Action[] = [
      { id: '1', title: 'Parent', parentId: null },
      { id: '2', title: 'Child', parentId: '1' },
      { id: '3', title: 'Grandchild', parentId: '2' },
    ];

    const result = flattenActions(actions);

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual(expect.objectContaining({ depth: 0, hasChildren: true }));
    expect(result[1]).toEqual(expect.objectContaining({ depth: 1, hasChildren: true }));
    expect(result[2]).toEqual(expect.objectContaining({ depth: 2, hasChildren: false }));
  });

  it('should support infinite nesting (5 levels deep)', () => {
    const actions: Action[] = [
      { id: '1', title: 'Level 0', parentId: null },
      { id: '2', title: 'Level 1', parentId: '1' },
      { id: '3', title: 'Level 2', parentId: '2' },
      { id: '4', title: 'Level 3', parentId: '3' },
      { id: '5', title: 'Level 4', parentId: '4' },
    ];

    const result = flattenActions(actions);

    expect(result).toHaveLength(5);
    expect(result[0].depth).toBe(0);
    expect(result[1].depth).toBe(1);
    expect(result[2].depth).toBe(2);
    expect(result[3].depth).toBe(3);
    expect(result[4].depth).toBe(4);
  });

  it('should handle multiple children at each level', () => {
    const actions: Action[] = [
      { id: '1', title: 'Parent 1', parentId: null },
      { id: '2', title: 'Parent 2', parentId: null },
      { id: '3', title: 'Child 1 of P1', parentId: '1' },
      { id: '4', title: 'Child 2 of P1', parentId: '1' },
      { id: '5', title: 'Grandchild of C1', parentId: '3' },
    ];

    const result = flattenActions(actions);

    expect(result).toHaveLength(5);
    // Parent 1 and its subtree
    expect(result[0].action.title).toBe('Parent 1');
    expect(result[0].depth).toBe(0);
    expect(result[1].action.title).toBe('Child 1 of P1');
    expect(result[1].depth).toBe(1);
    expect(result[2].action.title).toBe('Grandchild of C1');
    expect(result[2].depth).toBe(2);
    expect(result[3].action.title).toBe('Child 2 of P1');
    expect(result[3].depth).toBe(1);
    // Parent 2 at root
    expect(result[4].action.title).toBe('Parent 2');
    expect(result[4].depth).toBe(0);
  });

  it('should hide children when parent is collapsed', () => {
    const actions: Action[] = [
      { id: '1', title: 'Parent', parentId: null },
      { id: '2', title: 'Child', parentId: '1' },
      { id: '3', title: 'Grandchild', parentId: '2' },
    ];

    const result = flattenActions(actions, new Set(['1'])); // Parent is collapsed

    expect(result).toHaveLength(1);
    expect(result[0].action.title).toBe('Parent');
  });

  it('should only hide direct subtree when mid-level is collapsed', () => {
    const actions: Action[] = [
      { id: '1', title: 'Parent', parentId: null },
      { id: '2', title: 'Child', parentId: '1' },
      { id: '3', title: 'Grandchild', parentId: '2' },
    ];

    const result = flattenActions(actions, new Set(['2'])); // Child is collapsed

    expect(result).toHaveLength(2);
    expect(result[0].action.title).toBe('Parent');
    expect(result[1].action.title).toBe('Child');
  });
});

describe('ActionContextMenu subtask feature', () => {
  it('should have Add Subtask option in context menu', async () => {
    const { ActionContextMenu } = await import('../ActionContextMenu');

    const mockAction = {
      id: '1',
      title: 'Parent Task',
      parentId: null,
      status: 'active' as const,
      flagged: false,
      tags: [],
    };

    render(
      <ActionContextMenu
        action={mockAction}
        position={{ x: 100, y: 100 }}
        onClose={jest.fn()}
      />
    );

    expect(screen.getByText('Add Subtask')).toBeInTheDocument();
  });
});
