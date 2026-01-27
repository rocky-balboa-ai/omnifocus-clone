import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AttachmentsService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads');

  constructor(private prisma: PrismaService) {
    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async create(actionId: string, file: Express.Multer.File) {
    // Verify action exists
    const action = await this.prisma.action.findUnique({
      where: { id: actionId },
    });

    if (!action) {
      throw new NotFoundException(`Action ${actionId} not found`);
    }

    // Create attachment record
    const attachment = await this.prisma.attachment.create({
      data: {
        filename: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: `/uploads/${file.filename}`,
        actionId,
      },
    });

    return attachment;
  }

  async findByAction(actionId: string) {
    return this.prisma.attachment.findMany({
      where: { actionId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id },
    });

    if (!attachment) {
      throw new NotFoundException(`Attachment ${id} not found`);
    }

    return attachment;
  }

  async delete(id: string) {
    const attachment = await this.findOne(id);

    // Delete file from disk
    const filePath = path.join(process.cwd(), attachment.url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete record
    await this.prisma.attachment.delete({ where: { id } });

    return { success: true };
  }

  getFilePath(filename: string): string {
    return path.join(this.uploadDir, filename);
  }
}
