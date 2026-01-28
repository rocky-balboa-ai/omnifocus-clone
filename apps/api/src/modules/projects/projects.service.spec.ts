import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectType, ItemStatus } from '@prisma/client';

describe('ProjectsService', () => {
  let service: ProjectsService;

  const mockPrismaService = {
    project: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    projectTag: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    action: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a project with next review date', async () => {
      const dto = { name: 'Test Project', reviewInterval: '1w' };
      const expected = {
        id: '1',
        name: 'Test Project',
        reviewInterval: '1w',
        nextReviewAt: expect.any(Date),
      };

      mockPrismaService.project.create.mockResolvedValue(expected);

      const result = await service.create(dto);

      expect(result).toEqual(expected);
      expect(mockPrismaService.project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Test Project',
            reviewInterval: '1w',
            nextReviewAt: expect.any(Date),
          }),
        }),
      );
    });

    it('should create a sequential project', async () => {
      const dto = { name: 'Sequential Project', type: ProjectType.sequential };
      const expected = { id: '1', name: 'Sequential Project', type: 'sequential' };

      mockPrismaService.project.create.mockResolvedValue(expected);

      await service.create(dto);

      expect(mockPrismaService.project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ type: 'sequential' }),
        }),
      );
    });
  });

  describe('getAvailableActions', () => {
    it('should return only first action for sequential project', async () => {
      const project = {
        id: '1',
        type: ProjectType.sequential,
        status: ItemStatus.active,
        actions: [
          { id: 'a1', title: 'First', position: 0, status: ItemStatus.active },
          { id: 'a2', title: 'Second', position: 1, status: ItemStatus.active },
          { id: 'a3', title: 'Third', position: 2, status: ItemStatus.active },
        ],
      };

      mockPrismaService.project.findUnique.mockResolvedValue(project);

      const result = await service.getAvailableActions('1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('a1');
    });

    it('should return all actions for parallel project', async () => {
      const project = {
        id: '1',
        type: ProjectType.parallel,
        status: ItemStatus.active,
        actions: [
          { id: 'a1', title: 'First', position: 0, status: ItemStatus.active },
          { id: 'a2', title: 'Second', position: 1, status: ItemStatus.active },
        ],
      };

      mockPrismaService.project.findUnique.mockResolvedValue(project);

      const result = await service.getAvailableActions('1');

      expect(result).toHaveLength(2);
    });
  });

  describe('review', () => {
    it('should update lastReviewedAt and nextReviewAt', async () => {
      const project = {
        id: '1',
        reviewInterval: '1w',
      };

      mockPrismaService.project.findUnique.mockResolvedValue(project);
      mockPrismaService.project.update.mockResolvedValue({
        ...project,
        lastReviewedAt: expect.any(Date),
        nextReviewAt: expect.any(Date),
      });

      await service.review('1');

      expect(mockPrismaService.project.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            lastReviewedAt: expect.any(Date),
            nextReviewAt: expect.any(Date),
          }),
        }),
      );
    });
  });
});
