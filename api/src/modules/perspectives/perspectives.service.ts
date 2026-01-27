import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { Prisma, ItemStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePerspectiveDto } from './dto/create-perspective.dto';
import { UpdatePerspectiveDto } from './dto/update-perspective.dto';

interface FilterRule {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'isNull' | 'isNotNull';
  value?: string | number | boolean;
}

@Injectable()
export class PerspectivesService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedBuiltInPerspectives();
  }

  private async seedBuiltInPerspectives() {
    const builtIn = [
      {
        name: 'Inbox',
        icon: 'inbox',
        isBuiltIn: true,
        position: 0,
        filterRules: [{ field: 'isInbox', operator: 'eq', value: true }],
      },
      {
        name: 'Projects',
        icon: 'folder',
        isBuiltIn: true,
        position: 1,
        filterRules: [],
      },
      {
        name: 'Tags',
        icon: 'tag',
        isBuiltIn: true,
        position: 2,
        filterRules: [],
      },
      {
        name: 'Forecast',
        icon: 'calendar',
        isBuiltIn: true,
        position: 3,
        filterRules: [{ field: 'dueDate', operator: 'isNotNull' }],
      },
      {
        name: 'Flagged',
        icon: 'flag',
        isBuiltIn: true,
        position: 4,
        filterRules: [{ field: 'flagged', operator: 'eq', value: true }],
      },
      {
        name: 'Review',
        icon: 'refresh',
        isBuiltIn: true,
        position: 5,
        filterRules: [],
      },
    ];

    for (const perspective of builtIn) {
      await this.prisma.perspective.upsert({
        where: { id: perspective.name.toLowerCase() },
        create: {
          id: perspective.name.toLowerCase(),
          ...perspective,
          filterRules: perspective.filterRules as Prisma.JsonArray,
        },
        update: {},
      });
    }
  }

  async create(dto: CreatePerspectiveDto) {
    return this.prisma.perspective.create({
      data: {
        ...dto,
        filterRules: dto.filterRules as unknown as Prisma.JsonArray,
        sortRules: dto.sortRules as unknown as Prisma.JsonArray,
      },
    });
  }

  async findAll() {
    return this.prisma.perspective.findMany({
      orderBy: [{ isBuiltIn: 'desc' }, { position: 'asc' }, { name: 'asc' }],
    });
  }

  async findOne(id: string) {
    const perspective = await this.prisma.perspective.findUnique({
      where: { id },
    });

    if (!perspective) {
      throw new NotFoundException(`Perspective ${id} not found`);
    }

    return perspective;
  }

  async update(id: string, dto: UpdatePerspectiveDto) {
    return this.prisma.perspective.update({
      where: { id },
      data: {
        ...dto,
        filterRules: dto.filterRules as Prisma.JsonArray | undefined,
        sortRules: dto.sortRules as Prisma.JsonArray | undefined,
      },
    });
  }

  async delete(id: string) {
    const perspective = await this.findOne(id);
    if (perspective.isBuiltIn) {
      throw new Error('Cannot delete built-in perspectives');
    }
    await this.prisma.perspective.delete({ where: { id } });
    return { success: true };
  }

  async getActions(id: string) {
    const perspective = await this.findOne(id);
    const filterRules = (perspective.filterRules as unknown as FilterRule[]) || [];

    // Build Prisma where clause from filter rules
    const where: Prisma.ActionWhereInput = {
      status: ItemStatus.active,
    };

    for (const rule of filterRules) {
      this.applyFilterRule(where, rule);
    }

    return this.prisma.action.findMany({
      where,
      include: {
        tags: { include: { tag: true } },
        project: true,
        parent: true,
      },
      orderBy: this.buildOrderBy(perspective.sortRules as any[], perspective.groupBy),
    });
  }

  private applyFilterRule(where: Prisma.ActionWhereInput, rule: FilterRule) {
    switch (rule.field) {
      case 'isInbox':
        where.isInbox = rule.value as boolean;
        where.projectId = null;
        break;
      case 'flagged':
        where.flagged = rule.value as boolean;
        break;
      case 'status':
        where.status = rule.value as ItemStatus;
        break;
      case 'dueDate':
        if (rule.operator === 'isNotNull') {
          where.dueDate = { not: null };
        } else if (rule.operator === 'isNull') {
          where.dueDate = null;
        } else if (rule.operator === 'lte') {
          where.dueDate = { lte: new Date(rule.value as string) };
        } else if (rule.operator === 'gte') {
          where.dueDate = { gte: new Date(rule.value as string) };
        }
        break;
      case 'deferDate':
        if (rule.operator === 'lte') {
          where.OR = [
            { deferDate: null },
            { deferDate: { lte: new Date(rule.value as string) } },
          ];
        }
        break;
      case 'projectId':
        where.projectId = rule.value as string;
        break;
      case 'tagId':
        where.tags = { some: { tagId: rule.value as string } };
        break;
    }
  }

  private buildOrderBy(
    sortRules?: { field: string; direction: 'asc' | 'desc' }[],
    groupBy?: string | null,
  ): Prisma.ActionOrderByWithRelationInput[] {
    const orderBy: Prisma.ActionOrderByWithRelationInput[] = [];

    if (groupBy) {
      orderBy.push({ [groupBy]: 'asc' });
    }

    if (sortRules?.length) {
      for (const rule of sortRules) {
        orderBy.push({ [rule.field]: rule.direction });
      }
    }

    // Default sort
    if (!orderBy.length) {
      orderBy.push({ position: 'asc' }, { createdAt: 'asc' });
    }

    return orderBy;
  }
}
