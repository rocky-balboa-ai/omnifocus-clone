import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ItemStatus, RepeatMode } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateActionDto } from './dto/create-action.dto';
import { UpdateActionDto } from './dto/update-action.dto';
import { ActionQueryDto } from './dto/action-query.dto';
import { parseInterval, addInterval } from '../../common/utils/date.utils';

@Injectable()
export class ActionsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateActionDto) {
    const { tagIds, ...data } = dto;

    const action = await this.prisma.action.create({
      data: {
        ...data,
        isInbox: !data.projectId,
        tags: tagIds
          ? {
              create: tagIds.map((tagId) => ({ tagId })),
            }
          : undefined,
      },
      include: {
        tags: { include: { tag: true } },
        project: true,
        parent: true,
        children: true,
      },
    });

    return action;
  }

  async findAll(query: ActionQueryDto) {
    const where: Prisma.ActionWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.projectId) {
      where.projectId = query.projectId;
    }

    if (query.tagId) {
      where.tags = { some: { tagId: query.tagId } };
    }

    if (query.flagged !== undefined) {
      where.flagged = query.flagged;
    }

    if (query.inbox) {
      where.isInbox = true;
      where.projectId = null;
    }

    if (query.dueBefore) {
      where.dueDate = { lte: new Date(query.dueBefore) };
    }

    if (query.dueAfter) {
      where.dueDate = { gte: new Date(query.dueAfter) };
    }

    if (query.available) {
      // Only show actions that are available (deferred date passed or no defer date)
      where.OR = [
        { deferDate: null },
        { deferDate: { lte: new Date() } },
      ];
      where.status = ItemStatus.active;
    }

    return this.prisma.action.findMany({
      where,
      include: {
        tags: { include: { tag: true } },
        project: true,
        parent: true,
        children: true,
        attachments: true,
      },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async findOne(id: string) {
    const action = await this.prisma.action.findUnique({
      where: { id },
      include: {
        tags: { include: { tag: true } },
        project: true,
        parent: true,
        children: {
          include: {
            tags: { include: { tag: true } },
          },
        },
        attachments: true,
      },
    });

    if (!action) {
      throw new NotFoundException(`Action ${id} not found`);
    }

    return action;
  }

  async update(id: string, dto: UpdateActionDto) {
    const { tagIds, ...data } = dto;

    // Handle tag updates
    if (tagIds !== undefined) {
      await this.prisma.actionTag.deleteMany({ where: { actionId: id } });
      if (tagIds.length > 0) {
        await this.prisma.actionTag.createMany({
          data: tagIds.map((tagId) => ({ actionId: id, tagId })),
        });
      }
    }

    return this.prisma.action.update({
      where: { id },
      data,
      include: {
        tags: { include: { tag: true } },
        project: true,
        parent: true,
        children: true,
      },
    });
  }

  async delete(id: string) {
    await this.prisma.action.delete({ where: { id } });
    return { success: true };
  }

  async complete(id: string) {
    const action = await this.findOne(id);
    const now = new Date();

    // Update current action to completed
    await this.prisma.action.update({
      where: { id },
      data: {
        status: ItemStatus.completed,
        completedAt: now,
      },
    });

    // Handle repeating actions
    if (action.repeatMode && action.repeatInterval) {
      await this.createNextRepeat(action, now);
    }

    return this.findOne(id);
  }

  async drop(id: string) {
    return this.prisma.action.update({
      where: { id },
      data: {
        status: ItemStatus.dropped,
        droppedAt: new Date(),
      },
      include: {
        tags: { include: { tag: true } },
        project: true,
      },
    });
  }

  async reorder(actionIds: string[]) {
    // Update position for each action
    const updates = actionIds.map((id, index) =>
      this.prisma.action.update({
        where: { id },
        data: { position: index },
      })
    );

    await this.prisma.$transaction(updates);
    return { success: true };
  }

  async cleanup(olderThanDays: number) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.prisma.action.deleteMany({
      where: {
        status: ItemStatus.completed,
        completedAt: {
          lt: cutoffDate,
        },
      },
    });

    return { deleted: result.count };
  }

  private async createNextRepeat(
    action: Prisma.ActionGetPayload<{
      include: { tags: { include: { tag: true } } };
    }>,
    completedAt: Date,
  ) {
    // Check if we've hit the repeat limit
    if (action.repeatEndCount && action.repeatCount >= action.repeatEndCount) {
      return null;
    }

    // Check if we've passed the end date
    if (action.repeatEndDate && new Date() > action.repeatEndDate) {
      return null;
    }

    const interval = parseInterval(action.repeatInterval!);
    let newDeferDate: Date | null = null;
    let newDueDate: Date | null = null;

    switch (action.repeatMode) {
      case RepeatMode.fixed:
        // Fixed schedule - add interval to original dates
        if (action.deferDate) {
          newDeferDate = addInterval(action.deferDate, interval);
        }
        if (action.dueDate) {
          newDueDate = addInterval(action.dueDate, interval);
        }
        break;

      case RepeatMode.defer_another:
        // Defer another - new defer date from completion
        newDeferDate = addInterval(completedAt, interval);
        if (action.dueDate && action.deferDate) {
          // Maintain the same duration between defer and due
          const duration = action.dueDate.getTime() - action.deferDate.getTime();
          newDueDate = new Date(newDeferDate.getTime() + duration);
        }
        break;

      case RepeatMode.due_again:
        // Due again - new due date from completion
        newDueDate = addInterval(completedAt, interval);
        if (action.deferDate && action.dueDate) {
          // Maintain the same lead time before due
          const leadTime = action.dueDate.getTime() - action.deferDate.getTime();
          newDeferDate = new Date(newDueDate.getTime() - leadTime);
        }
        break;
    }

    // Create the next instance
    return this.prisma.action.create({
      data: {
        title: action.title,
        note: action.note,
        flagged: action.flagged,
        estimatedMinutes: action.estimatedMinutes,
        projectId: action.projectId,
        parentId: action.parentId,
        position: action.position,
        deferDate: newDeferDate,
        dueDate: newDueDate,
        repeatMode: action.repeatMode,
        repeatInterval: action.repeatInterval,
        repeatEndDate: action.repeatEndDate,
        repeatEndCount: action.repeatEndCount,
        repeatCount: action.repeatCount + 1,
        tags: {
          create: action.tags.map((t) => ({ tagId: t.tagId })),
        },
      },
    });
  }
}
