import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AuthGuard } from '../auth/guards/auth.guard';

@Controller('projects')
@UseGuards(AuthGuard)
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Post()
  create(@Body() dto: CreateProjectDto) {
    return this.projectsService.create(dto);
  }

  @Get()
  findAll(@Query('folderId') folderId?: string) {
    return this.projectsService.findAll(folderId);
  }

  @Get('review')
  findDueForReview() {
    return this.projectsService.findDueForReview();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Get(':id/available-actions')
  getAvailableActions(@Param('id') id: string) {
    return this.projectsService.getAvailableActions(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.projectsService.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.projectsService.delete(id);
  }

  @Post(':id/review')
  review(@Param('id') id: string) {
    return this.projectsService.review(id);
  }
}
