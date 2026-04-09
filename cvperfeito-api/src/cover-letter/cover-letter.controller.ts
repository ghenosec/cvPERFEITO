import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CoverLetterService } from './cover-letter.service';

@Controller('cover-letter')
@UseGuards(AuthGuard('jwt'))
export class CoverLetterController {
  constructor(private service: CoverLetterService) {}

  @Post(':resumeId/generate')
  generate(
    @Param('resumeId') resumeId: string,
    @Body('jobDescription') jobDescription: string,
    @Req() req: any,
  ) {
    return this.service.generate(req.user.userId, resumeId, jobDescription);
  }

  @Get(':resumeId')
  list(@Param('resumeId') resumeId: string, @Req() req: any) {
    return this.service.list(req.user.userId, resumeId);
  }
}
