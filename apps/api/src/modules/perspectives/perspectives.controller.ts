import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { PerspectivesService } from './perspectives.service';
import { CreatePerspectiveDto } from './dto/create-perspective.dto';
import { UpdatePerspectiveDto } from './dto/update-perspective.dto';
import { AuthGuard } from '../auth/guards/auth.guard';

@Controller('perspectives')
@UseGuards(AuthGuard)
export class PerspectivesController {
  constructor(private perspectivesService: PerspectivesService) {}

  @Post()
  create(@Body() dto: CreatePerspectiveDto) {
    return this.perspectivesService.create(dto);
  }

  @Get()
  findAll() {
    return this.perspectivesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.perspectivesService.findOne(id);
  }

  @Get(':id/actions')
  getActions(@Param('id') id: string) {
    return this.perspectivesService.getActions(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePerspectiveDto) {
    return this.perspectivesService.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.perspectivesService.delete(id);
  }
}
