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
import { ActionsService } from './actions.service';
import { CreateActionDto } from './dto/create-action.dto';
import { UpdateActionDto } from './dto/update-action.dto';
import { ActionQueryDto, SearchActionDto } from './dto/action-query.dto';
import { AuthGuard } from '../auth/guards/auth.guard';

@Controller('actions')
@UseGuards(AuthGuard)
export class ActionsController {
  constructor(private actionsService: ActionsService) {}

  @Post()
  create(@Body() dto: CreateActionDto) {
    return this.actionsService.create(dto);
  }

  @Get()
  findAll(@Query() query: ActionQueryDto) {
    return this.actionsService.findAll(query);
  }

  @Get('search')
  search(@Query() query: SearchActionDto) {
    return this.actionsService.search(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.actionsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateActionDto) {
    return this.actionsService.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.actionsService.delete(id);
  }

  @Post(':id/complete')
  complete(@Param('id') id: string) {
    return this.actionsService.complete(id);
  }

  @Post(':id/uncomplete')
  uncomplete(@Param('id') id: string) {
    return this.actionsService.uncomplete(id);
  }

  @Post(':id/drop')
  drop(@Param('id') id: string) {
    return this.actionsService.drop(id);
  }

  @Post('reorder')
  reorder(@Body() body: { actionIds: string[] }) {
    return this.actionsService.reorder(body.actionIds);
  }

  @Post('cleanup')
  cleanup(@Body() body: { olderThanDays?: number }) {
    return this.actionsService.cleanup(body.olderThanDays || 7);
  }

  @Post('bulk/complete')
  bulkComplete(@Body() body: { actionIds: string[] }) {
    return this.actionsService.bulkComplete(body.actionIds);
  }

  @Post('bulk/delete')
  bulkDelete(@Body() body: { actionIds: string[] }) {
    return this.actionsService.bulkDelete(body.actionIds);
  }

  @Post('bulk/update')
  bulkUpdate(@Body() body: { actionIds: string[]; update: Record<string, unknown> }) {
    return this.actionsService.bulkUpdate(body.actionIds, body.update);
  }

  @Post('bulk/move')
  bulkMove(@Body() body: { actionIds: string[]; projectId: string | null }) {
    return this.actionsService.bulkMove(body.actionIds, body.projectId);
  }
}
