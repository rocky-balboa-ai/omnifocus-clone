import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ItemStatus, RepeatMode } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateActionDto } from './dto/create-action.dto';
import { UpdateActionDto } from './dto/update-action.dto';
import { ActionQueryDto, SearchActionDto } from './dto/action-query.dto';
import { parseInterval, addInterval } from '../../common/utils/date.utils';
import { ChangelogService } from '../changelog/changelog.service';
import { PushService } from '../push/push.service';

// Helper to convert date string to ISO-8601 datetime
function toISODateTime(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  // If already has time component, return as is
  if (dateStr.includes('T')) return dateStr;
  // Otherwise append time to make it a valid datetime
  return `${dateStr}T00:00:00.000Z`;
}

@Injectable()
export class ActionsService {
  constructor(
    private prisma: PrismaService,
    private changelogService: ChangelogService,
    private pushService: PushService,
  ) {}

  async create(dto: CreateActionDto, actor: string = 'system') {
    const { tagIds, dueDate, deferDate, plannedDate, ...rest } = dto;
    const data = {
      ...rest,
      dueDate: toISODateTime(dueDate),
      deferDate: toISODateTime(deferDate),
      plannedDate: toISODateTime(plannedDate),
    };

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
        blockedByActions: { select: { blockingId: true } },
      },
    });

    // Log the change
    await this.changelogService.logChange({
      entityType: 'action',
      entityId: action.id,
      action: 'create',
      actor,
      changes: { title: { old: null, new: action.title } },
    });

    return {
      ...action,
      blockedBy: action.blockedByActions.map((d) => d.blockingId),
    };
  }

  async findAll(query: ActionQueryDto) {
    const where: Prisma.ActionWhereInput = {};

    // Text search across title and note
    if (query.q) {
      where.AND = [
        {
          OR: [
            { title: { contains: query.q, mode: 'insensitive' } },
            { note: { contains: query.q, mode: 'insensitive' } },
          ],
        },
      ];
    }

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

    // Rocky Integration Filters
    if (query.managedBy) {
      where.managedBy = query.managedBy;
    }

    if (query.rockyStatus) {
      where.rockyStatus = query.rockyStatus;
    }

    if (query.category) {
      where.category = query.category;
    }

    if (query.priority) {
      where.priority = query.priority;
    }

    if (query.available) {
      // Only show actions that are available (deferred date passed or no defer date)
      const existingAnd = Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : [];
      where.AND = [
        ...existingAnd,
        {
          OR: [
            { deferDate: null },
            { deferDate: { lte: new Date() } },
          ],
        },
      ];
      where.status = ItemStatus.active;
    }

    const take = query.limit || undefined;
    const skip = query.offset || undefined;

    const [actions, total] = await Promise.all([
      this.prisma.action.findMany({
        where,
        include: {
          tags: { include: { tag: true } },
          project: true,
          parent: true,
          children: true,
          attachments: true,
          blockedByActions: { select: { blockingId: true } },
        },
        orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
        take,
        skip,
      }),
      this.prisma.action.count({ where }),
    ]);

    // Transform blockedByActions to blockedBy array
    const transformedActions = actions.map((action) => ({
      ...action,
      blockedBy: action.blockedByActions.map((d) => d.blockingId),
    }));

    // If pagination is used, return paginated response
    if (take !== undefined || skip !== undefined) {
      return {
        data: transformedActions,
        meta: {
          total,
          limit: take || total,
          offset: skip || 0,
          hasMore: (skip || 0) + actions.length < total,
        },
      };
    }

    // Otherwise return plain array for backwards compatibility
    return transformedActions;
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
        blockedByActions: { select: { blockingId: true } },
      },
    });

    if (!action) {
      throw new NotFoundException(`Action ${id} not found`);
    }

    return {
      ...action,
      blockedBy: action.blockedByActions.map((d) => d.blockingId),
    };
  }

  async update(id: string, dto: UpdateActionDto, actor: string = 'system') {
    // Get the old action state for diff
    const oldAction = await this.prisma.action.findUnique({
      where: { id },
      include: { blockedByActions: { select: { blockingId: true } } },
    });

    const { tagIds, blockedBy, dueDate, deferDate, plannedDate, ...rest } = dto;
    const data = {
      ...rest,
      ...(dueDate !== undefined && { dueDate: toISODateTime(dueDate) }),
      ...(deferDate !== undefined && { deferDate: toISODateTime(deferDate) }),
      ...(plannedDate !== undefined && { plannedDate: toISODateTime(plannedDate) }),
    };

    // Handle tag updates
    if (tagIds !== undefined) {
      await this.prisma.actionTag.deleteMany({ where: { actionId: id } });
      if (tagIds.length > 0) {
        await this.prisma.actionTag.createMany({
          data: tagIds.map((tagId) => ({ actionId: id, tagId })),
        });
      }
    }

    // Handle blockedBy updates
    if (blockedBy !== undefined) {
      // Delete existing dependencies
      await this.prisma.actionDependency.deleteMany({ where: { blockedId: id } });
      // Create new dependencies
      if (blockedBy.length > 0) {
        await this.prisma.actionDependency.createMany({
          data: blockedBy.map((blockingId) => ({ blockedId: id, blockingId })),
        });
      }
    }

    const action = await this.prisma.action.update({
      where: { id },
      data,
      include: {
        tags: { include: { tag: true } },
        project: true,
        parent: true,
        children: true,
        blockedByActions: { select: { blockingId: true } },
      },
    });

    // Build field-level changes for logging
    const changes: Record<string, { old: unknown; new: unknown }> = {};
    const fieldsToTrack = ['title', 'note', 'status', 'flagged', 'dueDate', 'deferDate', 'plannedDate', 'projectId', 'priority', 'managedBy', 'rockyStatus', 'category'];
    for (const field of fieldsToTrack) {
      if (dto[field as keyof UpdateActionDto] !== undefined && oldAction) {
        const oldVal = (oldAction as Record<string, unknown>)[field];
        const newVal = (action as Record<string, unknown>)[field];
        if (oldVal !== newVal) {
          changes[field] = { old: oldVal, new: newVal };
        }
      }
    }

    // Log the change if there were any changes
    if (Object.keys(changes).length > 0) {
      await this.changelogService.logChange({
        entityType: 'action',
        entityId: id,
        action: 'update',
        actor,
        changes,
      });
    }

    // Transform blockedByActions to blockedBy array
    return {
      ...action,
      blockedBy: action.blockedByActions.map((d) => d.blockingId),
    };
  }

  async delete(id: string, actor: string = 'system') {
    // Get action title before deleting for the log
    const action = await this.prisma.action.findUnique({
      where: { id },
      select: { title: true },
    });

    await this.prisma.action.delete({ where: { id } });

    // Log the deletion
    await this.changelogService.logChange({
      entityType: 'action',
      entityId: id,
      action: 'delete',
      actor,
      changes: action ? { title: { old: action.title, new: null } } : null,
    });

    return { success: true };
  }

  async complete(id: string, actor: string = 'system') {
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

    // Log the completion
    await this.changelogService.logChange({
      entityType: 'action',
      entityId: id,
      action: 'complete',
      actor,
      changes: { status: { old: action.status, new: 'completed' } },
    });

    // Send push notification for task completion
    await this.pushService.sendToAll({
      title: '✅ Task Completed',
      body: action.title,
      tag: `complete-${id}`,
      url: '/',
    });

    // Handle repeating actions
    if (action.repeatMode && action.repeatInterval) {
      await this.createNextRepeat(action, now);
    }

    return this.findOne(id);
  }

  async drop(id: string, actor: string = 'system') {
    const oldAction = await this.prisma.action.findUnique({
      where: { id },
      select: { status: true },
    });

    const action = await this.prisma.action.update({
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

    // Log the drop
    await this.changelogService.logChange({
      entityType: 'action',
      entityId: id,
      action: 'drop',
      actor,
      changes: { status: { old: oldAction?.status, new: 'dropped' } },
    });

    return action;
  }

  async uncomplete(id: string, actor: string = 'system') {
    const action = await this.prisma.action.update({
      where: { id },
      data: {
        status: ItemStatus.active,
        completedAt: null,
      },
      include: {
        tags: { include: { tag: true } },
        project: true,
        parent: true,
        children: true,
      },
    });

    // Log the uncomplete
    await this.changelogService.logChange({
      entityType: 'action',
      entityId: id,
      action: 'uncomplete',
      actor,
      changes: { status: { old: 'completed', new: 'active' } },
    });

    return action;
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

  async search(dto: SearchActionDto) {
    const limit = dto.limit || 50;
    const query = dto.q.toLowerCase();

    // Search actions
    const actions = await this.prisma.action.findMany({
      where: {
        AND: [
          dto.status ? { status: dto.status } : {},
          {
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { note: { contains: query, mode: 'insensitive' } },
            ],
          },
        ],
      },
      include: {
        tags: { include: { tag: true } },
        project: true,
      },
      take: limit,
      orderBy: { updatedAt: 'desc' },
    });

    // Search projects
    const projects = await this.prisma.project.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { note: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: Math.min(10, limit),
      orderBy: { updatedAt: 'desc' },
    });

    // Search tags
    const tags = await this.prisma.tag.findMany({
      where: {
        name: { contains: query, mode: 'insensitive' },
      },
      take: Math.min(10, limit),
      orderBy: { name: 'asc' },
    });

    return {
      actions,
      projects,
      tags,
      query: dto.q,
    };
  }

  async bulkComplete(actionIds: string[], actor: string = 'system') {
    const now = new Date();

    await this.prisma.action.updateMany({
      where: { id: { in: actionIds } },
      data: {
        status: ItemStatus.completed,
        completedAt: now,
      },
    });

    // Log changes for each action
    for (const actionId of actionIds) {
      await this.changelogService.logChange({
        entityType: 'action',
        entityId: actionId,
        action: 'complete',
        actor,
        changes: { status: { old: 'active', new: 'completed' } },
      });
    }

    // Handle repeating actions
    const actions = await this.prisma.action.findMany({
      where: {
        id: { in: actionIds },
        repeatMode: { not: null },
        repeatInterval: { not: null },
      },
      include: {
        tags: { include: { tag: true } },
      },
    });

    for (const action of actions) {
      await this.createNextRepeat(action, now);
    }

    return { success: true, count: actionIds.length };
  }

  async bulkDelete(actionIds: string[], actor: string = 'system') {
    const result = await this.prisma.action.deleteMany({
      where: { id: { in: actionIds } },
    });

    // Log deletions for each action
    for (const actionId of actionIds) {
      await this.changelogService.logChange({
        entityType: 'action',
        entityId: actionId,
        action: 'delete',
        actor,
      });
    }

    return { success: true, count: result.count };
  }

  async bulkUpdate(actionIds: string[], update: Record<string, unknown>, actor: string = 'system') {
    // Remove any fields that shouldn't be bulk updated
    const { id, createdAt, updatedAt, tags, ...safeUpdate } = update as Record<string, unknown>;

    await this.prisma.action.updateMany({
      where: { id: { in: actionIds } },
      data: safeUpdate as Prisma.ActionUpdateManyMutationInput,
    });

    // Log updates for each action
    const changes: Record<string, { old: unknown; new: unknown }> = {};
    for (const [key, value] of Object.entries(safeUpdate)) {
      changes[key] = { old: null, new: value }; // We don't track old values in bulk update
    }

    for (const actionId of actionIds) {
      await this.changelogService.logChange({
        entityType: 'action',
        entityId: actionId,
        action: 'update',
        actor,
        changes,
      });
    }

    return { success: true, count: actionIds.length };
  }

  async bulkMove(actionIds: string[], projectId: string | null, actor: string = 'system') {
    await this.prisma.action.updateMany({
      where: { id: { in: actionIds } },
      data: {
        projectId,
        isInbox: projectId === null,
      },
    });

    // Log move for each action
    for (const actionId of actionIds) {
      await this.changelogService.logChange({
        entityType: 'action',
        entityId: actionId,
        action: 'update',
        actor,
        changes: { projectId: { old: null, new: projectId } },
      });
    }

    return { success: true, count: actionIds.length };
  }

  async addActivityLog(id: string, author: string, note: string) {
    const action = await this.prisma.action.findUnique({
      where: { id },
      select: { activityLog: true },
    });

    if (!action) {
      throw new NotFoundException(`Action ${id} not found`);
    }

    const currentLog = (action.activityLog as Array<{ timestamp: string; author: string; note: string }>) || [];
    const newEntry = {
      timestamp: new Date().toISOString(),
      author,
      note,
    };

    const updatedAction = await this.prisma.action.update({
      where: { id },
      data: {
        activityLog: [...currentLog, newEntry],
      },
      include: {
        tags: { include: { tag: true } },
        project: true,
        parent: true,
        children: true,
        blockedByActions: { select: { blockingId: true } },
      },
    });

    return {
      ...updatedAction,
      blockedBy: updatedAction.blockedByActions.map((d) => d.blockingId),
    };
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
