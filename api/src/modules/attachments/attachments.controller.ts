import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  Res,
  ParseFilePipe,
  MaxFileSizeValidator,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { Response } from 'express';
import { AttachmentsService } from './attachments.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { v4 as uuid } from 'uuid';
import * as path from 'path';

@Controller('attachments')
@UseGuards(AuthGuard)
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post('actions/:actionId')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const ext = path.extname(file.originalname);
          const filename = `${uuid()}${ext}`;
          cb(null, filename);
        },
      }),
    }),
  )
  upload(
    @Param('actionId') actionId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB limit
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.attachmentsService.create(actionId, file);
  }

  @Get('actions/:actionId')
  findByAction(@Param('actionId') actionId: string) {
    return this.attachmentsService.findByAction(actionId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.attachmentsService.findOne(id);
  }

  @Get(':id/download')
  async download(@Param('id') id: string, @Res() res: Response) {
    const attachment = await this.attachmentsService.findOne(id);
    const filePath = this.attachmentsService.getFilePath(
      path.basename(attachment.url),
    );
    res.download(filePath, attachment.filename);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.attachmentsService.delete(id);
  }
}
