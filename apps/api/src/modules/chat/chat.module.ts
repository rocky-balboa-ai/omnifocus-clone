import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ToolExecutor } from './tool-executor';
import { PrismaModule } from '../../prisma/prisma.module';
import { ActionsModule } from '../actions/actions.module';
import { ProjectsModule } from '../projects/projects.module';
import { TagsModule } from '../tags/tags.module';
import { FoldersModule } from '../folders/folders.module';
import { PerspectivesModule } from '../perspectives/perspectives.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    PrismaModule,
    ActionsModule,
    ProjectsModule,
    TagsModule,
    FoldersModule,
    PerspectivesModule,
    AuthModule,
  ],
  controllers: [ChatController],
  providers: [ChatService, ToolExecutor],
})
export class ChatModule {}
