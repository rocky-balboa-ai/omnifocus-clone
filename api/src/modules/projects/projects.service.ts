import { Injectable, NotFoundException } from '@nestjs/common';
import { ItemStatus, ProjectType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { parseInterval, addInterval } from '../../common/utils/date.utils';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateProjectDto) {
    const { tagIds, ...data } = dto;

    // Calculate next review date if review interval is set
    let nextReviewAt: Date | undefined;
    if (data.reviewInterval) {
      const interval = parseInterval(data.reviewInterval);
      nextReviewAt = addInterval(new Date(), interval);
    }

    return this.prisma.project.create({
      data: {
        ...data,
        nextReviewAt,
        tags: tagIds
          ? { create: tagIds.map((tagId) => ({ tagId })) }
          : undefined,
      },
      include: {
        tags: { include: { tag: true } },
        folder: true,
        actions: {
          where: { parentId: null },
          orderBy: { position: 'asc' },
        },
      },
    });
  }

  async findAll(folderId?: string) {
    return this.prisma.project.findMany({
      where: folderId ? { folderId } : undefined,
      include: {
        tags: { include: { tag: true } },
        folder: true,
        _count: { select: { actions: true } },
      },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        tags: { include: { tag: true } },
        folder: true,
        actions: {
          where: { parentId: null },
          include: {
            tags: { include: { tag: true } },
            children: {
              include: { tags: { include: { tag: true } } },
              orderBy: { position: 'asc' },
            },
          },
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`Project ${id} not found`);
    }

    return project;
  }

  async update(id: string, dto: UpdateProjectDto) {
    const { tagIds, ...data } = dto;

    // Handle tag updates
    if (tagIds !== undefined) {
      await this.prisma.projectTag.deleteMany({ where: { projectId: id } });
      if (tagIds.length > 0) {
        await this.prisma.projectTag.createMany({
          data: tagIds.map((tagId) => ({ projectId: id, tagId })),
        });
      }
    }

    // Update next review date if review interval changed
    let nextReviewAt: Date | undefined;
    if (data.reviewInterval) {
      const interval = parseInterval(data.reviewInterval);
      const existing = await this.prisma.project.findUnique({ where: { id } });
      const lastReview = existing?.lastReviewedAt || new Date();
      nextReviewAt = addInterval(lastReview, interval);
    }

    return this.prisma.project.update({
      where: { id },
      data: {
        ...data,
        ...(nextReviewAt && { nextReviewAt }),
      },
      include: {
        tags: { include: { tag: true } },
        folder: true,
        actions: {
          where: { parentId: null },
          orderBy: { position: 'asc' },
        },
      },
    });
  }

  async delete(id: string) {
    await this.prisma.project.delete({ where: { id } });
    return { success: true };
  }

  async review(id: string) {
    const project = await this.findOne(id);
    const now = new Date();

    let nextReviewAt: Date | null = null;
    if (project.reviewInterval) {
      const interval = parseInterval(project.reviewInterval);
      nextReviewAt = addInterval(now, interval);
    }

    return this.prisma.project.update({
      where: { id },
      data: {
        lastReviewedAt: now,
        nextReviewAt,
      },
      include: {
        tags: { include: { tag: true } },
        folder: true,
      },
    });
  }

  async findDueForReview() {
    return this.prisma.project.findMany({
      where: {
        status: ItemStatus.active,
        nextReviewAt: { lte: new Date() },
      },
      include: {
        folder: true,
        _count: { select: { actions: true } },
      },
      orderBy: { nextReviewAt: 'asc' },
    });
  }

  async getAvailableActions(id: string) {
    const project = await this.findOne(id);

    if (project.type === ProjectType.sequential) {
      // For sequential projects, only the first incomplete action is available
      const firstIncomplete = project.actions.find(
        (a) => a.status === ItemStatus.active,
      );
      return firstIncomplete ? [firstIncomplete] : [];
    }

    // For parallel and single_actions, all incomplete actions are available
    return project.actions.filter((a) => a.status === ItemStatus.active);
  }
}
