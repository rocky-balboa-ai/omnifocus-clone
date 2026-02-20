export const chatTools = [
  // ============================================================================
  // Actions
  // ============================================================================
  {
    type: 'function' as const,
    function: {
      name: 'create_action',
      description: 'Create a new action (task). Use this when the user wants to add a new task or to-do item.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'The title of the action' },
          note: { type: 'string', description: 'Optional notes for the action' },
          flagged: { type: 'boolean', description: 'Whether to flag/star the action' },
          dueDate: { type: 'string', description: 'Due date in ISO format (YYYY-MM-DD)' },
          deferDate: { type: 'string', description: 'Defer/start date in ISO format (YYYY-MM-DD)' },
          plannedDate: { type: 'string', description: 'Planned date in ISO format (YYYY-MM-DD)' },
          projectId: { type: 'string', description: 'UUID of the project to add this action to' },
          tagIds: { type: 'array', items: { type: 'string' }, description: 'Array of tag UUIDs' },
          estimatedMinutes: { type: 'number', description: 'Estimated time in minutes' },
          priority: { type: 'string', enum: ['high', 'medium', 'low'], description: 'Priority level' },
          parentId: { type: 'string', description: 'UUID of parent action for creating action groups' },
          links: { type: 'array', items: { type: 'string' }, description: 'Array of URLs to attach to the action' },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'list_actions',
      description: 'List actions with optional filters. Use for queries like "what tasks do I have?" or "show me due tasks".',
      parameters: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['active', 'completed', 'dropped', 'on_hold'], description: 'Filter by status' },
          projectId: { type: 'string', description: 'Filter by project UUID' },
          tagIds: { type: 'array', items: { type: 'string' }, description: 'Filter by tag UUIDs (any match)' },
          flagged: { type: 'boolean', description: 'Filter by flagged status' },
          dueBefore: { type: 'string', description: 'Filter actions due before this date (ISO format)' },
          dueAfter: { type: 'string', description: 'Filter actions due after this date (ISO format)' },
          deferBefore: { type: 'string', description: 'Filter actions deferred before this date' },
          deferAfter: { type: 'string', description: 'Filter actions deferred after this date' },
          limit: { type: 'number', description: 'Maximum number of results' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'search_actions',
      description: 'Search actions by title or note content. Use when the user is looking for specific tasks.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query string' },
          status: { type: 'string', enum: ['active', 'completed', 'dropped', 'on_hold'] },
          limit: { type: 'number', description: 'Maximum number of results' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_action',
      description: 'Get detailed information about a specific action by ID.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'UUID of the action' },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'update_action',
      description: 'Update an existing action. Only provide fields that need to change.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'UUID of the action to update' },
          title: { type: 'string', description: 'New title' },
          note: { type: 'string', description: 'New note' },
          flagged: { type: 'boolean', description: 'Flag/unflag the action' },
          dueDate: { type: 'string', description: 'New due date (ISO format or null to clear)' },
          deferDate: { type: 'string', description: 'New defer date (ISO format or null to clear)' },
          plannedDate: { type: 'string', description: 'New planned date (ISO format or null to clear)' },
          projectId: { type: 'string', description: 'Move to different project (UUID or null for inbox)' },
          tagIds: { type: 'array', items: { type: 'string' }, description: 'Replace all tags with these UUIDs' },
          estimatedMinutes: { type: 'number', description: 'New time estimate' },
          priority: { type: 'string', enum: ['high', 'medium', 'low'], description: 'New priority' },
          status: { type: 'string', enum: ['active', 'completed', 'dropped', 'on_hold'], description: 'Change status' },
          addTags: { type: 'array', items: { type: 'string' }, description: 'Tag UUIDs to add' },
          removeTags: { type: 'array', items: { type: 'string' }, description: 'Tag UUIDs to remove' },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'complete_action',
      description: 'Mark an action as completed.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'UUID of the action to complete' },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'uncomplete_action',
      description: 'Mark a completed action as active again.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'UUID of the action to uncomplete' },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'delete_action',
      description: 'Permanently delete an action.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'UUID of the action to delete' },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'bulk_complete_actions',
      description: 'Complete multiple actions at once.',
      parameters: {
        type: 'object',
        properties: {
          actionIds: { type: 'array', items: { type: 'string' }, description: 'Array of action UUIDs to complete' },
        },
        required: ['actionIds'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'bulk_move_actions',
      description: 'Move multiple actions to a different project or inbox.',
      parameters: {
        type: 'object',
        properties: {
          actionIds: { type: 'array', items: { type: 'string' }, description: 'Array of action UUIDs to move' },
          projectId: { type: 'string', description: 'Target project UUID (null for inbox)' },
        },
        required: ['actionIds'],
      },
    },
  },
  // ============================================================================
  // Projects
  // ============================================================================
  {
    type: 'function' as const,
    function: {
      name: 'create_project',
      description: 'Create a new project. Use when the user wants to organize tasks into a project.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'The name of the project' },
          note: { type: 'string', description: 'Optional notes for the project' },
          type: { type: 'string', enum: ['sequential', 'parallel', 'single_actions'], description: 'Project type: sequential (one at a time), parallel (any order), or single_actions (loose collection)' },
          status: { type: 'string', enum: ['active', 'completed', 'dropped', 'on_hold'], description: 'Project status' },
          flagged: { type: 'boolean', description: 'Whether to flag the project' },
          folderId: { type: 'string', description: 'UUID of folder to place project in' },
          dueDate: { type: 'string', description: 'Due date in ISO format' },
          deferDate: { type: 'string', description: 'Defer/start date in ISO format' },
          reviewInterval: { type: 'string', description: 'Review interval like "1w", "2w", "1m"' },
          tagIds: { type: 'array', items: { type: 'string' }, description: 'Array of tag UUIDs' },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'list_projects',
      description: 'List all projects with optional folder filter.',
      parameters: {
        type: 'object',
        properties: {
          folderId: { type: 'string', description: 'Filter by folder UUID' },
          status: { type: 'string', enum: ['active', 'completed', 'dropped', 'on_hold'], description: 'Filter by status' },
          includeStats: { type: 'boolean', description: 'Include action counts' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_project',
      description: 'Get detailed information about a specific project including its actions.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'UUID of the project' },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'update_project',
      description: 'Update an existing project. Only provide fields that need to change.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'UUID of the project to update' },
          name: { type: 'string', description: 'New name' },
          note: { type: 'string', description: 'New note' },
          type: { type: 'string', enum: ['sequential', 'parallel', 'single_actions'], description: 'New project type' },
          status: { type: 'string', enum: ['active', 'completed', 'dropped', 'on_hold'], description: 'New status' },
          flagged: { type: 'boolean', description: 'Flag/unflag the project' },
          folderId: { type: 'string', description: 'Move to different folder (UUID or null)' },
          dueDate: { type: 'string', description: 'New due date (ISO format or null)' },
          deferDate: { type: 'string', description: 'New defer date (ISO format or null)' },
          reviewInterval: { type: 'string', description: 'New review interval' },
          tagIds: { type: 'array', items: { type: 'string' }, description: 'Replace all tags' },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'delete_project',
      description: 'Permanently delete a project and all its actions.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'UUID of the project to delete' },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'review_project',
      description: 'Mark a project as reviewed and update its next review date.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'UUID of the project to review' },
        },
        required: ['id'],
      },
    },
  },
  // ============================================================================
  // Tags
  // ============================================================================
  {
    type: 'function' as const,
    function: {
      name: 'create_tag',
      description: 'Create a new tag for organizing actions and projects.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'The name of the tag' },
          parentId: { type: 'string', description: 'UUID of parent tag for nesting' },
          availableFrom: { type: 'string', description: 'Available from time (HH:MM)' },
          availableUntil: { type: 'string', description: 'Available until time (HH:MM)' },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'list_tags',
      description: 'List all tags, optionally with their hierarchy.',
      parameters: {
        type: 'object',
        properties: {
          includeChildren: { type: 'boolean', description: 'Include nested tag structure' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_tag',
      description: 'Get detailed information about a specific tag including tagged items.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'UUID of the tag' },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'update_tag',
      description: 'Update an existing tag.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'UUID of the tag to update' },
          name: { type: 'string', description: 'New name' },
          parentId: { type: 'string', description: 'New parent tag (null for root)' },
          availableFrom: { type: 'string', description: 'New available from time' },
          availableUntil: { type: 'string', description: 'New available until time' },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'delete_tag',
      description: 'Delete a tag. This will remove it from all actions and projects.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'UUID of the tag to delete' },
        },
        required: ['id'],
      },
    },
  },
  // ============================================================================
  // Folders
  // ============================================================================
  {
    type: 'function' as const,
    function: {
      name: 'create_folder',
      description: 'Create a new folder for organizing projects.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'The name of the folder' },
          parentId: { type: 'string', description: 'UUID of parent folder for nesting' },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'list_folders',
      description: 'List all folders with their hierarchy.',
      parameters: {
        type: 'object',
        properties: {
          includeProjects: { type: 'boolean', description: 'Include projects in each folder' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_folder',
      description: 'Get detailed information about a specific folder including its projects.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'UUID of the folder' },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'update_folder',
      description: 'Update an existing folder.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'UUID of the folder to update' },
          name: { type: 'string', description: 'New name' },
          parentId: { type: 'string', description: 'New parent folder (null for root)' },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'delete_folder',
      description: 'Delete a folder. Projects inside will become unfoldered.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'UUID of the folder to delete' },
        },
        required: ['id'],
      },
    },
  },
  // ============================================================================
  // Perspectives
  // ============================================================================
  {
    type: 'function' as const,
    function: {
      name: 'create_perspective',
      description: 'Create a custom perspective (filtered view) for the user.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'The name of the perspective' },
          icon: { type: 'string', description: 'Icon name or emoji for the perspective' },
          filterRules: { type: 'object', description: 'JSON object with filter criteria (status, tags, dates, etc.)' },
          sortRules: { type: 'object', description: 'JSON object with sort configuration' },
          groupBy: { type: 'string', description: 'Field to group by (project, tag, due_date, etc.)' },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'list_perspectives',
      description: 'List all custom perspectives.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'update_perspective',
      description: 'Update an existing perspective.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'UUID of the perspective to update' },
          name: { type: 'string', description: 'New name' },
          icon: { type: 'string', description: 'New icon' },
          filterRules: { type: 'object', description: 'New filter rules' },
          sortRules: { type: 'object', description: 'New sort rules' },
          groupBy: { type: 'string', description: 'New group by field' },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'delete_perspective',
      description: 'Delete a custom perspective.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'UUID of the perspective to delete' },
        },
        required: ['id'],
      },
    },
  },
];
