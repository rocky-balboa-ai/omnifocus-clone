import { Test, TestingModule } from '@nestjs/testing';
import { ChangelogService } from './changelog.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('ChangelogService', () => {
  let service: ChangelogService;

  const mockPrismaService = {
    changeLog: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChangelogService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ChangelogService>(ChangelogService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return changes since a given timestamp', async () => {
      const since = new Date('2026-02-05T10:00:00Z');
      const changes = [
        {
          id: '1',
          entityType: 'action',
          entityId: 'action-1',
          action: 'create',
          actor: 'fred',
          changes: null,
          createdAt: new Date('2026-02-05T11:00:00Z'),
        },
      ];

      mockPrismaService.changeLog.findMany.mockResolvedValue(changes);

      const result = await service.findAll({ since: since.toISOString() });

      expect(result.changes).toEqual(changes);
      expect(mockPrismaService.changeLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: { gt: since },
          }),
        }),
      );
    });

    it('should filter by actor', async () => {
      const since = new Date('2026-02-05T10:00:00Z');
      mockPrismaService.changeLog.findMany.mockResolvedValue([]);

      await service.findAll({ since: since.toISOString(), actor: 'rocky' });

      expect(mockPrismaService.changeLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            actor: 'rocky',
          }),
        }),
      );
    });

    it('should not filter by actor when actor is "all"', async () => {
      const since = new Date('2026-02-05T10:00:00Z');
      mockPrismaService.changeLog.findMany.mockResolvedValue([]);

      await service.findAll({ since: since.toISOString(), actor: 'all' });

      expect(mockPrismaService.changeLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({
            actor: expect.anything(),
          }),
        }),
      );
    });

    it('should filter by entityType', async () => {
      const since = new Date('2026-02-05T10:00:00Z');
      mockPrismaService.changeLog.findMany.mockResolvedValue([]);

      await service.findAll({ since: since.toISOString(), entityType: 'action' });

      expect(mockPrismaService.changeLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            entityType: 'action',
          }),
        }),
      );
    });

    it('should respect limit parameter', async () => {
      const since = new Date('2026-02-05T10:00:00Z');
      mockPrismaService.changeLog.findMany.mockResolvedValue([]);

      await service.findAll({ since: since.toISOString(), limit: 50 });

      expect(mockPrismaService.changeLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
        }),
      );
    });

    it('should use default limit of 100', async () => {
      const since = new Date('2026-02-05T10:00:00Z');
      mockPrismaService.changeLog.findMany.mockResolvedValue([]);

      await service.findAll({ since: since.toISOString() });

      expect(mockPrismaService.changeLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100,
        }),
      );
    });

    it('should cap limit at 500', async () => {
      const since = new Date('2026-02-05T10:00:00Z');
      mockPrismaService.changeLog.findMany.mockResolvedValue([]);

      await service.findAll({ since: since.toISOString(), limit: 1000 });

      expect(mockPrismaService.changeLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 500,
        }),
      );
    });

    it('should return cursor for pagination', async () => {
      const since = new Date('2026-02-05T10:00:00Z');
      const lastCreatedAt = new Date('2026-02-05T12:00:00Z');
      const changes = [
        {
          id: '1',
          entityType: 'action',
          entityId: 'action-1',
          action: 'create',
          actor: 'fred',
          changes: null,
          createdAt: lastCreatedAt,
        },
      ];

      mockPrismaService.changeLog.findMany.mockResolvedValue(changes);

      const result = await service.findAll({ since: since.toISOString() });

      expect(result.cursor).toBe(lastCreatedAt.toISOString());
    });

    it('should return null cursor when no changes', async () => {
      const since = new Date('2026-02-05T10:00:00Z');
      mockPrismaService.changeLog.findMany.mockResolvedValue([]);

      const result = await service.findAll({ since: since.toISOString() });

      expect(result.cursor).toBeNull();
    });
  });

  describe('logChange', () => {
    it('should create a changelog entry', async () => {
      const entry = {
        entityType: 'action',
        entityId: 'action-1',
        action: 'create',
        actor: 'fred',
        changes: { title: { old: null, new: 'New Task' } },
      };

      const created = { id: '1', ...entry, createdAt: new Date() };
      mockPrismaService.changeLog.create.mockResolvedValue(created);

      const result = await service.logChange(entry);

      expect(result).toEqual(created);
      expect(mockPrismaService.changeLog.create).toHaveBeenCalledWith({
        data: entry,
      });
    });
  });
});
