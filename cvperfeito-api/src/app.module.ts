import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ResumesModule } from './resumes/resumes.module';
import { AiModule } from './ai/ai.module';
import { BillingModule } from './billing/billing.module';
import { CoverLetterModule } from './cover-letter/cover-letter.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    ResumesModule,
    AiModule,
    BillingModule,
    CoverLetterModule,
  ],
})
export class AppModule {}
