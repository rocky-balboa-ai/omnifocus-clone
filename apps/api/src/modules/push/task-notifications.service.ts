import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { PushService } from './push.service';

@Injectable()
export class TaskNotificationsService {
  private readonly logger = new Logger(TaskNotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private pushService: PushService,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async checkDueTasks() {
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    // Find active tasks due within the next hour
    const dueSoon = await this.prisma.action.findMany({
      where: {
        status: 'active',
        dueDate: {
          gte: now,
          lte: oneHourFromNow,
        },
      },
      select: { id: true, title: true, dueDate: true },
    });

    for (const task of dueSoon) {
      await this.pushService.sendToAll({
        title: 'Task Due Soon',
        body: task.title,
        tag: `due-soon-${task.id}`,
        url: '/',
      });
    }

    // Find active tasks that are overdue
    const overdue = await this.prisma.action.findMany({
      where: {
        status: 'active',
        dueDate: {
          lt: now,
        },
      },
      select: { id: true, title: true, dueDate: true },
    });

    // Only notify for recently overdue tasks (overdue by less than 10 minutes)
    // to avoid re-notifying on every cron tick
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
    const recentlyOverdue = overdue.filter(
      (t) => t.dueDate && t.dueDate >= tenMinutesAgo,
    );

    for (const task of recentlyOverdue) {
      await this.pushService.sendToAll({
        title: 'Task Overdue',
        body: task.title,
        tag: `overdue-${task.id}`,
        url: '/',
      });
    }

    if (dueSoon.length > 0 || recentlyOverdue.length > 0) {
      this.logger.log(
        `Notified: ${dueSoon.length} due soon, ${recentlyOverdue.length} overdue`,
      );
    }
  }
}
