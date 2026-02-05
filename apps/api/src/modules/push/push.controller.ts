import { Body, Controller, Post } from '@nestjs/common';
import { PushService } from './push.service';
import { TaskNotificationsService } from './task-notifications.service';
import { SubscribeDto } from './dto/subscribe.dto';

@Controller('push')
export class PushController {
  constructor(
    private pushService: PushService,
    private taskNotifications: TaskNotificationsService,
  ) {}

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
}
