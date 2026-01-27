import { Controller, Get, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard } from '../auth/guards/auth.guard';
import { ExportService } from './export.service';

@Controller('export')
@UseGuards(AuthGuard)
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get()
  async exportAll(@Res() res: Response) {
    const data = await this.exportService.exportAll();
    const filename = `omnifocus-export-${new Date().toISOString().split('T')[0]}.json`;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(JSON.stringify(data, null, 2));
  }

  @Get('summary')
  async getSummary() {
    return this.exportService.getSummary();
  }
}
