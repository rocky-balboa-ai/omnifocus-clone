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
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { ActionsService } from './actions.service';
import { CreateActionDto } from './dto/create-action.dto';
import { UpdateActionDto } from './dto/update-action.dto';
import { ActionQueryDto, SearchActionDto } from './dto/action-query.dto';
import { AuthGuard } from '../auth/guards/auth.guard';

// Helper to determine actor from request
function getActor(req: Request): string {
  // API key auth = Rocky
  if (req.headers['x-api-key']) {
    return 'rocky';
  }
  // JWT or session auth = Fred
  return 'fred';
}

@Controller('actions')
@UseGuards(AuthGuard)
export class ActionsController {
  constructor(private actionsService: ActionsService) {}

  @Post()
  create(@Body() dto: CreateActionDto, @Req() req: Request) {
    return this.actionsService.create(dto, getActor(req));
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
  update(@Param('id') id: string, @Body() dto: UpdateActionDto, @Req() req: Request) {
    return this.actionsService.update(id, dto, getActor(req));
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Req() req: Request) {
    return this.actionsService.delete(id, getActor(req));
  }

  @Post(':id/complete')
  complete(@Param('id') id: string, @Req() req: Request) {
    return this.actionsService.complete(id, getActor(req));
  }

  @Post(':id/uncomplete')
  uncomplete(@Param('id') id: string, @Req() req: Request) {
    return this.actionsService.uncomplete(id, getActor(req));
  }

  @Post(':id/drop')
  drop(@Param('id') id: string, @Req() req: Request) {
    return this.actionsService.drop(id, getActor(req));
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
  bulkComplete(@Body() body: { actionIds: string[] }, @Req() req: Request) {
    return this.actionsService.bulkComplete(body.actionIds, getActor(req));
  }

  @Post('bulk/delete')
  bulkDelete(@Body() body: { actionIds: string[] }, @Req() req: Request) {
    return this.actionsService.bulkDelete(body.actionIds, getActor(req));
  }

  @Post('bulk/update')
  bulkUpdate(@Body() body: { actionIds: string[]; update: Record<string, unknown> }, @Req() req: Request) {
    return this.actionsService.bulkUpdate(body.actionIds, body.update, getActor(req));
  }

  @Post('bulk/move')
  bulkMove(@Body() body: { actionIds: string[]; projectId: string | null }, @Req() req: Request) {
    return this.actionsService.bulkMove(body.actionIds, body.projectId, getActor(req));
  }

  @Post(':id/log')
  addActivityLog(@Param('id') id: string, @Body() body: { author: string; note: string }) {
    return this.actionsService.addActivityLog(id, body.author, body.note);
  }
}
