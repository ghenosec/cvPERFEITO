import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Req,
  Res,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Delete,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { ResumesService } from './resumes.service';
import { Throttle, SkipThrottle } from '@nestjs/throttler';

@Controller('resume')
@UseGuards(AuthGuard('jwt'))
export class ResumesController {
  constructor(private service: ResumesService) {}

@Throttle({ short: { ttl: 60000, limit: 3 } })
@Post('upload')
@UseInterceptors(FileInterceptor('file', {
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new BadRequestException('Apenas arquivos PDF e DOCX são aceitos'), false);
    }
  },
}))
upload(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
  return this.service.upload(req.user.userId, file);
}

@Throttle({ short: { ttl: 60000, limit: 7 } })
@Post(':id/analyze')
analyze(
  @Param('id') id: string,
  @Body('jobDescription') jobDescription: string,
  @Req() req: any,
) {
  return this.service.analyze(req.user.userId, id, jobDescription);
}

  @Get()
  list(@Req() req: any) {
    return this.service.list(req.user.userId);
  }

  @Get(':id')
  getOne(@Param('id') id: string, @Req() req: any) {
    return this.service.getOne(req.user.userId, id);
  }

  @Post(':id/share')
  createShareLink(@Param('id') id: string, @Req() req: any) {
    return this.service.createShareLink(req.user.userId, id);
  }

  @Delete(':id/share')
  revokeShareLink(@Param('id') id: string, @Req() req: any) {
    return this.service.revokeShareLink(req.user.userId, id);
  }

  @Get(':id/history')
  history(@Param('id') id: string, @Req() req: any) {
    return this.service.history(req.user.userId, id);
  }

  @Get(':id/compare')
  compare(@Param('id') id: string, @Req() req: any) {
    return this.service.compare(req.user.userId, id);
  }

  @Get(':id/download')
  async download(
    @Param('id') id: string,
    @Req() req: any,
    @Res() res: Response,
    @Query('format') format: string,
    @Query('lang') lang: string,
    ) {
      const fmt = format === 'docx' ? 'docx' : 'pdf';
      const language = lang === 'en' ? 'en' : 'pt';
      const { buffer, filename, mimeType } = await this.service.downloadOptimized(
        req.user.userId,
        id,
        fmt,
        language,
      );
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.service.remove(req.user.userId, id);
  }
}