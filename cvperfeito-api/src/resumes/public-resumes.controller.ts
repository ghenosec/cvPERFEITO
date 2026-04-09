import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { ResumesService } from './resumes.service';

@Controller('public/resume')
export class PublicResumesController {
  constructor(private service: ResumesService) {}

  @Get(':token')
  async getByToken(@Param('token') token: string) {
    return this.service.getPublicByToken(token);
  }
}