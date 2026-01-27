import { Module } from '@nestjs/common';
import { PerspectivesController } from './perspectives.controller';
import { PerspectivesService } from './perspectives.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [PerspectivesController],
  providers: [PerspectivesService],
  exports: [PerspectivesService],
})
export class PerspectivesModule {}
