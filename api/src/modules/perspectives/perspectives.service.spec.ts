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
          projectId: 'seq-project',
          parentId: null,
          project: { id: 'seq-project', type: 'sequential' },
        },
        {
          id: '2',
          title: 'Second task',
          position: 1,
          status: 'active',
          projectId: 'seq-project',
          parentId: null,
          project: { id: 'seq-project', type: 'sequential' },
        },
        {
          id: '3',
          title: 'Third task',
          position: 2,
          status: 'active',
          projectId: 'seq-project',
          parentId: null,
          project: { id: 'seq-project', type: 'sequential' },
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
          projectId: 'par-project',
          parentId: null,
          project: { id: 'par-project', type: 'parallel' },
        },
        {
          id: '2',
          title: 'Second task',
          position: 1,
          status: 'active',
          projectId: 'par-project',
          parentId: null,
          project: { id: 'par-project', type: 'parallel' },
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
          projectId: 'seq-project',
          parentId: null,
          project: { id: 'seq-project', type: 'sequential' },
        },
        {
          id: '2',
          title: 'Seq Second',
          position: 1,
          status: 'active',
          projectId: 'seq-project',
          parentId: null,
          project: { id: 'seq-project', type: 'sequential' },
        },
        // Parallel project - all should show
        {
          id: '3',
          title: 'Par First',
          position: 0,
          status: 'active',
          projectId: 'par-project',
          parentId: null,
          project: { id: 'par-project', type: 'parallel' },
        },
        {
          id: '4',
          title: 'Par Second',
          position: 1,
          status: 'active',
          projectId: 'par-project',
          parentId: null,
          project: { id: 'par-project', type: 'parallel' },
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
  });
});
