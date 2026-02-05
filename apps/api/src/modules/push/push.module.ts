import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PushController } from './push.controller';
import { PushService } from './push.service';
import { TaskNotificationsService } from './task-notifications.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [PushController],
  providers: [PushService, TaskNotificationsService],
  exports: [PushService],
})
export class PushModule {}
