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
import { FoldersService } from './folders.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { AuthGuard } from '../auth/guards/auth.guard';

@Controller('folders')
@UseGuards(AuthGuard)
export class FoldersController {
  constructor(private foldersService: FoldersService) {}

  @Post()
  create(@Body() dto: CreateFolderDto) {
    return this.foldersService.create(dto);
  }

  @Get()
  findAll() {
    return this.foldersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.foldersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateFolderDto) {
    return this.foldersService.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.foldersService.delete(id);
  }
}
