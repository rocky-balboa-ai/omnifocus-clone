import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';

@Injectable()
export class FoldersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateFolderDto) {
    return this.prisma.folder.create({
      data: dto,
      include: {
        parent: true,
        children: true,
        projects: true,
      },
    });
  }

  async findAll() {
    return this.prisma.folder.findMany({
      where: { parentId: null },
      include: {
        children: {
          include: {
            children: true,
            projects: { orderBy: { position: 'asc' } },
          },
          orderBy: { position: 'asc' },
        },
        projects: {
          orderBy: { position: 'asc' },
        },
      },
      orderBy: [{ position: 'asc' }, { name: 'asc' }],
    });
  }

  async findOne(id: string) {
    const folder = await this.prisma.folder.findUnique({
      where: { id },
      include: {
        parent: true,
        children: {
          include: { projects: true },
          orderBy: { position: 'asc' },
        },
        projects: {
          include: { _count: { select: { actions: true } } },
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!folder) {
      throw new NotFoundException(`Folder ${id} not found`);
    }

    return folder;
  }

  async update(id: string, dto: UpdateFolderDto) {
    return this.prisma.folder.update({
      where: { id },
      data: dto,
      include: {
        parent: true,
        children: true,
        projects: true,
      },
    });
  }

  async delete(id: string) {
    await this.prisma.folder.delete({ where: { id } });
    return { success: true };
  }
}
