import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ChangelogService } from './changelog.service';
import { ChangelogQueryDto } from './dto/changelog-query.dto';
import { AuthGuard } from '../auth/guards/auth.guard';

@Controller('changelog')
@UseGuards(AuthGuard)
export class ChangelogController {
  constructor(private changelogService: ChangelogService) {}

  @Get()
  findAll(@Query() query: ChangelogQueryDto) {
    return this.changelogService.findAll(query);
  }
}
