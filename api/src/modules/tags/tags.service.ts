import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

@Injectable()
export class TagsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTagDto) {
    return this.prisma.tag.create({
      data: dto,
      include: {
        parent: true,
        children: true,
      },
    });
  }

  async findAll() {
    return this.prisma.tag.findMany({
      where: { parentId: null },
      include: {
        children: {
          include: { children: true },
          orderBy: { position: 'asc' },
        },
        _count: { select: { actions: true, projects: true } },
      },
      orderBy: [{ position: 'asc' }, { name: 'asc' }],
    });
  }

  async findOne(id: string) {
    const tag = await this.prisma.tag.findUnique({
      where: { id },
      include: {
        parent: true,
        children: {
          include: { children: true },
          orderBy: { position: 'asc' },
        },
        actions: {
          include: {
            action: {
              include: { project: true },
            },
          },
        },
      },
    });

    if (!tag) {
      throw new NotFoundException(`Tag ${id} not found`);
    }

    return tag;
  }

  async update(id: string, dto: UpdateTagDto) {
    return this.prisma.tag.update({
      where: { id },
      data: dto,
      include: {
        parent: true,
        children: true,
      },
    });
  }

  async delete(id: string) {
    await this.prisma.tag.delete({ where: { id } });
    return { success: true };
  }
}
