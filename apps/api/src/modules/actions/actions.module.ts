import { Module } from '@nestjs/common';
import { ActionsController } from './actions.controller';
import { ActionsService } from './actions.service';
import { AuthModule } from '../auth/auth.module';
import { ChangelogModule } from '../changelog/changelog.module';
import { PushModule } from '../push/push.module';

@Module({
  imports: [AuthModule, ChangelogModule, PushModule],
  controllers: [ActionsController],
  providers: [ActionsService],
  exports: [ActionsService],
})
export class ActionsModule {}
