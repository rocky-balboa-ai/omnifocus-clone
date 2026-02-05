import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ChangelogQueryDto } from './dto/changelog-query.dto';

export interface LogChangeDto {
  entityType: string;
  entityId: string;
  action: string;
  actor: string;
  changes?: Record<string, { old: unknown; new: unknown }> | null;
}

@Injectable()
export class ChangelogService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: ChangelogQueryDto) {
    const { since, actor, entityType, limit = 100 } = query;
    const effectiveLimit = Math.min(limit, 500);

    const where: Record<string, unknown> = {
      createdAt: { gt: new Date(since) },
    };

    if (actor && actor !== 'all') {
      where.actor = actor;
    }

    if (entityType) {
      where.entityType = entityType;
    }

    const changes = await this.prisma.changeLog.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      take: effectiveLimit,
    });

    const cursor =
      changes.length > 0
        ? changes[changes.length - 1].createdAt.toISOString()
        : null;

    return { changes, cursor };
  }

  async logChange(data: LogChangeDto) {
    return this.prisma.changeLog.create({
      data: {
        entityType: data.entityType,
        entityId: data.entityId,
        action: data.action,
        actor: data.actor,
        changes: data.changes ? (data.changes as Prisma.InputJsonValue) : Prisma.JsonNull,
      },
    });
  }
}
