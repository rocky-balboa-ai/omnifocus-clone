import { Test, TestingModule } from '@nestjs/testing';
import { PerspectivesService } from './perspectives.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('PerspectivesService', () => {
  let service: PerspectivesService;
  let mockPrismaService: any;

  beforeEach(async () => {
    mockPrismaService = {
      perspective: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        upsert: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      action: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PerspectivesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<PerspectivesService>(PerspectivesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('filterSequentialProjects', () => {
    it('should only return first action for sequential projects', async () => {
      const mockPerspective = {
        id: 'projects',
        name: 'Projects',
        filterRules: [],
        sortRules: [],
        isBuiltIn: true,
      };

      const mockActions = [
        {
          id: '1',
          title: 'First task',
          position: 0,
          status: 'active',
          deferDate: null,
          projectId: 'seq-project',
          parentId: null,
          project: { id: 'seq-project', type: 'sequential', status: 'active' },
        },
        {
          id: '2',
          title: 'Second task',
          position: 1,
          status: 'active',
          deferDate: null,
          projectId: 'seq-project',
          parentId: null,
          project: { id: 'seq-project', type: 'sequential', status: 'active' },
        },
        {
          id: '3',
          title: 'Third task',
          position: 2,
          status: 'active',
          deferDate: null,
          projectId: 'seq-project',
          parentId: null,
          project: { id: 'seq-project', type: 'sequential', status: 'active' },
        },
      ];

      mockPrismaService.perspective.findUnique.mockResolvedValue(mockPerspective);
      mockPrismaService.action.findMany.mockResolvedValue(mockActions);

      const result = await service.getActions('projects');

      // For sequential project, only first task should be returned
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('First task');
    });

    it('should return all actions for parallel projects', async () => {
      const mockPerspective = {
        id: 'projects',
        name: 'Projects',
        filterRules: [],
        sortRules: [],
        isBuiltIn: true,
      };

      const mockActions = [
        {
          id: '1',
          title: 'First task',
          position: 0,
          status: 'active',
          deferDate: null,
          projectId: 'par-project',
          parentId: null,
          project: { id: 'par-project', type: 'parallel', status: 'active' },
        },
        {
          id: '2',
          title: 'Second task',
          position: 1,
          status: 'active',
          deferDate: null,
          projectId: 'par-project',
          parentId: null,
          project: { id: 'par-project', type: 'parallel', status: 'active' },
        },
      ];

      mockPrismaService.perspective.findUnique.mockResolvedValue(mockPerspective);
      mockPrismaService.action.findMany.mockResolvedValue(mockActions);

      const result = await service.getActions('projects');

      // For parallel project, all tasks should be returned
      expect(result).toHaveLength(2);
    });

    it('should handle mixed sequential and parallel projects', async () => {
      const mockPerspective = {
        id: 'projects',
        name: 'Projects',
        filterRules: [],
        sortRules: [],
        isBuiltIn: true,
      };

      const mockActions = [
        // Sequential project - only first should show
        {
          id: '1',
          title: 'Seq First',
          position: 0,
          status: 'active',
          deferDate: null,
          projectId: 'seq-project',
          parentId: null,
          project: { id: 'seq-project', type: 'sequential', status: 'active' },
        },
        {
          id: '2',
          title: 'Seq Second',
          position: 1,
          status: 'active',
          deferDate: null,
          projectId: 'seq-project',
          parentId: null,
          project: { id: 'seq-project', type: 'sequential', status: 'active' },
        },
        // Parallel project - all should show
        {
          id: '3',
          title: 'Par First',
          position: 0,
          status: 'active',
          deferDate: null,
          projectId: 'par-project',
          parentId: null,
          project: { id: 'par-project', type: 'parallel', status: 'active' },
        },
        {
          id: '4',
          title: 'Par Second',
          position: 1,
          status: 'active',
          deferDate: null,
          projectId: 'par-project',
          parentId: null,
          project: { id: 'par-project', type: 'parallel', status: 'active' },
        },
      ];

      mockPrismaService.perspective.findUnique.mockResolvedValue(mockPerspective);
      mockPrismaService.action.findMany.mockResolvedValue(mockActions);

      const result = await service.getActions('projects');

      // Should have 3 actions: 1 from sequential + 2 from parallel
      expect(result).toHaveLength(3);

      const titles = result.map(a => a.title);
      expect(titles).toContain('Seq First');
      expect(titles).not.toContain('Seq Second');
      expect(titles).toContain('Par First');
      expect(titles).toContain('Par Second');
    });

    it('should apply isAvailable filter for defer dates via Prisma query', async () => {
      // This test verifies the applyFilterRule method sets up the correct
      // Prisma query for defer date filtering. The actual filtering happens
      // at the database level.
      const mockPerspective = {
        id: 'available',
        name: 'Available',
        filterRules: [{ field: 'isAvailable', operator: 'eq', value: true }],
        sortRules: [],
        isBuiltIn: true,
      };

      // Mock actions that would be returned by Prisma (already filtered)
      const mockActions = [
        {
          id: '1',
          title: 'Available task (no defer)',
          position: 0,
          status: 'active',
          deferDate: null,
          projectId: null,
          parentId: null,
          project: null,
        },
        {
          id: '2',
          title: 'Available task (past defer)',
          position: 1,
          status: 'active',
          deferDate: new Date(Date.now() - 86400000), // yesterday
          projectId: null,
          parentId: null,
          project: null,
        },
      ];

      mockPrismaService.perspective.findUnique.mockResolvedValue(mockPerspective);
      mockPrismaService.action.findMany.mockResolvedValue(mockActions);

      const result = await service.getActions('available');

      // Verify Prisma query was called with correct defer date filter
      expect(mockPrismaService.action.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { deferDate: null },
              expect.objectContaining({ deferDate: expect.objectContaining({ lte: expect.any(Date) }) }),
            ]),
          }),
        })
      );

      expect(result).toHaveLength(2);
    });

    it('should filter out tasks from on-hold projects', async () => {
      const mockPerspective = {
        id: 'available',
        name: 'Available',
        filterRules: [{ field: 'isAvailable', operator: 'eq', value: true }],
        sortRules: [],
        isBuiltIn: true,
      };

      const mockActions = [
        {
          id: '1',
          title: 'Available task (active project)',
          position: 0,
          status: 'active',
          deferDate: null,
          projectId: 'active-project',
          parentId: null,
          project: { id: 'active-project', type: 'parallel', status: 'active' },
        },
        {
          id: '2',
          title: 'Unavailable task (on hold project)',
          position: 1,
          status: 'active',
          deferDate: null,
          projectId: 'onhold-project',
          parentId: null,
          project: { id: 'onhold-project', type: 'parallel', status: 'on_hold' },
        },
      ];

      mockPrismaService.perspective.findUnique.mockResolvedValue(mockPerspective);
      mockPrismaService.action.findMany.mockResolvedValue(mockActions);

      const result = await service.getActions('available');

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Available task (active project)');
    });

    it('should show all inbox actions (no project)', async () => {
      const mockPerspective = {
        id: 'inbox',
        name: 'Inbox',
        filterRules: [{ field: 'isInbox', operator: 'eq', value: true }],
        sortRules: [],
        isBuiltIn: true,
      };

      const mockActions = [
        {
          id: '1',
          title: 'Inbox task 1',
          position: 0,
          status: 'active',
          projectId: null,
          parentId: null,
          project: null,
        },
        {
          id: '2',
          title: 'Inbox task 2',
          position: 1,
          status: 'active',
          projectId: null,
          parentId: null,
          project: null,
        },
      ];

      mockPrismaService.perspective.findUnique.mockResolvedValue(mockPerspective);
      mockPrismaService.action.findMany.mockResolvedValue(mockActions);

      const result = await service.getActions('inbox');

      // Inbox (no project) should show all actions
      expect(result).toHaveLength(2);
    });

    it('should filter out blocked tasks with incomplete blocking actions', async () => {
      const mockPerspective = {
        id: 'available',
        name: 'Available',
        filterRules: [{ field: 'isAvailable', operator: 'eq', value: true }],
        sortRules: [],
        isBuiltIn: true,
      };

      const mockActions = [
        {
          id: '1',
          title: 'Available task',
          position: 0,
          status: 'active',
          deferDate: null,
          projectId: null,
          parentId: null,
          project: null,
          blockedByActions: [],
        },
        {
          id: '2',
          title: 'Blocked by incomplete task',
          position: 1,
          status: 'active',
          deferDate: null,
          projectId: null,
          parentId: null,
          project: null,
          blockedByActions: [{ blockingId: '3', blocking: { status: 'active' } }],
        },
        {
          id: '3',
          title: 'Blocking task',
          position: 2,
          status: 'active',
          deferDate: null,
          projectId: null,
          parentId: null,
          project: null,
          blockedByActions: [],
        },
        {
          id: '4',
          title: 'Blocked by completed task (should show)',
          position: 3,
          status: 'active',
          deferDate: null,
          projectId: null,
          parentId: null,
          project: null,
          blockedByActions: [{ blockingId: '5', blocking: { status: 'completed' } }],
        },
      ];

      mockPrismaService.perspective.findUnique.mockResolvedValue(mockPerspective);
      mockPrismaService.action.findMany.mockResolvedValue(mockActions);

      const result = await service.getActions('available');

      // Should have 3 actions: task 1, 3, and 4 (blocked by complete task)
      // Task 2 should be filtered out (blocked by incomplete task)
      expect(result).toHaveLength(3);

      const titles = result.map(a => a.title);
      expect(titles).toContain('Available task');
      expect(titles).toContain('Blocking task');
      expect(titles).toContain('Blocked by completed task (should show)');
      expect(titles).not.toContain('Blocked by incomplete task');
    });
  });
});
