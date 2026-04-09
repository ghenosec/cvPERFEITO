import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class CoverLetterService {
  constructor(
    private prisma: PrismaService,
    private ai: AiService,
  ) {}

  async generate(userId: string, resumeId: string, jobDescription?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException();
    if (user.creditsLeft <= 0) {
      throw new ForbiddenException(
        'Sem créditos. Compre uma análise para gerar carta de apresentação.',
      );
    }

    const resume = await this.prisma.resume.findFirst({
      where: { id: resumeId, userId },
    });
    if (!resume) throw new NotFoundException('Currículo não encontrado');

    const result = await this.ai.generateCoverLetter(
      resume.originalText,
      jobDescription,
    );

    const formatted = this.format(result);

    return this.prisma.coverLetter.create({
      data: {
        resumeId,
        content: formatted,
      },
    });
  }

  list(userId: string, resumeId: string) {
    return this.prisma.coverLetter.findMany({
      where: { resume: { id: resumeId, userId } },
      orderBy: { createdAt: 'desc' },
    });
  }

  private format(data: any): string {
    if (!data) return '';
    const parts: string[] = [];
    if (data.subject) parts.push(`Assunto: ${data.subject}`, '');
    if (data.greeting) parts.push(data.greeting, '');
    if (data.body) parts.push(data.body, '');
    if (data.closing) parts.push(data.closing);
    return parts.join('\n');
  }
}
