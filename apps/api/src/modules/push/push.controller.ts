import { Body, Controller, Get, Post } from '@nestjs/common';
import { PushService } from './push.service';
import { TaskNotificationsService } from './task-notifications.service';
import { SubscribeDto } from './dto/subscribe.dto';

@Controller('push')
export class PushController {
  constructor(
    private pushService: PushService,
    private taskNotifications: TaskNotificationsService,
  ) {}

  @Get('status')
  async status() {
    const subscriptions = await this.pushService.getAllSubscriptions();
    return { 
      subscriptionCount: subscriptions.length,
      hasSubscriptions: subscriptions.length > 0,
    };
  }

  @Post('subscribe')
  async subscribe(@Body() dto: SubscribeDto) {
    await this.pushService.subscribe(dto);
    return { success: true };
  }

  @Post('unsubscribe')
  async unsubscribe(@Body('endpoint') endpoint: string) {
    await this.pushService.unsubscribe(endpoint);
    return { success: true };
  }

  @Post('check-due')
  async checkDueTasks() {
    await this.taskNotifications.checkDueTasks();
    return { success: true };
  }

  @Post('test')
  async testNotification() {
    const result = await this.pushService.sendToAll({
      title: '🧪 Test Notification',
      body: 'Push notifications are working!',
      tag: 'test',
      url: '/',
    });
    return { success: true, result };
  }
}
