import { Module } from '@nestjs/common';
import { ResumesController } from './resumes.controller';
import { PublicResumesController } from './public-resumes.controller';
import { ResumesService } from './resumes.service';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  controllers: [ResumesController, PublicResumesController],
  providers: [ResumesService],
})
export class ResumesModule {}