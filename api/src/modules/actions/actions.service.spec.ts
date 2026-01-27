import { Test, TestingModule } from '@nestjs/testing';
import { ActionsService } from './actions.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('ActionsService', () => {
  let service: ActionsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    action: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    actionTag: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActionsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ActionsService>(ActionsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an action', async () => {
      const dto = { title: 'Test Action' };
      const expected = { id: '1', title: 'Test Action', isInbox: true };

      mockPrismaService.action.create.mockResolvedValue(expected);

      const result = await service.create(dto);

      expect(result).toEqual(expected);
      expect(mockPrismaService.action.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ title: 'Test Action', isInbox: true }),
        }),
      );
    });

    it('should set isInbox to false when projectId provided', async () => {
      const dto = { title: 'Test Action', projectId: 'project-1' };
      const expected = { id: '1', title: 'Test Action', isInbox: false, projectId: 'project-1' };

      mockPrismaService.action.create.mockResolvedValue(expected);

      await service.create(dto);

      expect(mockPrismaService.action.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isInbox: false }),
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return actions filtered by inbox', async () => {
      const actions = [{ id: '1', title: 'Inbox Action', isInbox: true }];
      mockPrismaService.action.findMany.mockResolvedValue(actions);
      mockPrismaService.action.count.mockResolvedValue(1);

      const result = await service.findAll({ inbox: true });

      expect(result).toEqual(actions);
      expect(mockPrismaService.action.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isInbox: true, projectId: null }),
        }),
      );
    });

    it('should return actions filtered by flagged', async () => {
      const actions = [{ id: '1', title: 'Flagged Action', flagged: true }];
      mockPrismaService.action.findMany.mockResolvedValue(actions);
      mockPrismaService.action.count.mockResolvedValue(1);

      const result = await service.findAll({ flagged: true });

      expect(result).toEqual(actions);
      expect(mockPrismaService.action.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ flagged: true }),
        }),
      );
    });
  });

  describe('complete', () => {
    it('should mark action as completed', async () => {
      const action = {
        id: '1',
        title: 'Test',
        repeatMode: null,
        tags: [],
      };

      mockPrismaService.action.findUnique.mockResolvedValue(action);
      mockPrismaService.action.update.mockResolvedValue({
        ...action,
        status: 'completed',
        completedAt: expect.any(Date),
      });

      await service.complete('1');

      expect(mockPrismaService.action.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: '1' },
          data: expect.objectContaining({ status: 'completed' }),
        }),
      );
    });
  });
});
