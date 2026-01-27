import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ExportService {
  constructor(private prisma: PrismaService) {}

  async exportAll() {
    const [actions, projects, tags, folders, perspectives] = await Promise.all([
      this.prisma.action.findMany({
        include: {
          tags: { include: { tag: true } },
          attachments: true,
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.project.findMany({
        include: {
          tags: { include: { tag: true } },
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.tag.findMany({
        orderBy: { name: 'asc' },
      }),
      this.prisma.folder.findMany({
        orderBy: { name: 'asc' },
      }),
      this.prisma.perspective.findMany({
        where: { isBuiltIn: false },
        orderBy: { name: 'asc' },
      }),
    ]);

    return {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      data: {
        actions: actions.map((action) => ({
          ...action,
          tags: action.tags.map((t) => t.tag.name),
        })),
        projects: projects.map((project) => ({
          ...project,
          tags: project.tags.map((t) => t.tag.name),
        })),
        tags,
        folders,
        perspectives,
      },
    };
  }

  async getSummary() {
    const [
      totalActions,
      completedActions,
      activeActions,
      totalProjects,
      activeProjects,
      totalTags,
    ] = await Promise.all([
      this.prisma.action.count(),
      this.prisma.action.count({ where: { status: 'completed' } }),
      this.prisma.action.count({ where: { status: 'active' } }),
      this.prisma.project.count(),
      this.prisma.project.count({ where: { status: 'active' } }),
      this.prisma.tag.count(),
    ]);

    return {
      actions: {
        total: totalActions,
        completed: completedActions,
        active: activeActions,
      },
      projects: {
        total: totalProjects,
        active: activeProjects,
      },
      tags: {
        total: totalTags,
      },
    };
  }
}
