import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { extractText } from './parsers/file-parser';
import PDFDocument from 'pdfkit';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
} from 'docx';

@Injectable()
export class ResumesService {
  constructor(
    private prisma: PrismaService,
    private ai: AiService,
  ) {}

  async upload(userId: string, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Nenhum arquivo enviado');

    const text = await extractText(file.buffer, file.mimetype, file.originalname);
    if (!text || text.length < 50) {
      throw new BadRequestException('Não foi possível extrair texto do arquivo');
    }

    const resume = await this.prisma.resume.create({
      data: {
        userId,
        title: file.originalname,
        originalText: text,
        status: 'UPLOADED',
      },
    });

    await this.prisma.resumeVersion.create({
      data: {
        resumeId: resume.id,
        label: 'Original',
        content: text,
      },
    });

    return resume;
  }

  async analyze(
  userId: string,
  resumeId: string,
  jobDescription?: string,
  includeEnglish: boolean = false,
) {
  const user = await this.prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundException('Usuário não encontrado');

  const requiredCredits = includeEnglish ? 2 : 1;
  if (user.creditsLeft < requiredCredits) {
    throw new ForbiddenException(
      `Você precisa de ${requiredCredits} crédito(s) para esta análise. Saldo atual: ${user.creditsLeft}.`,
    );
  }

  const resume = await this.prisma.resume.findFirst({
    where: { id: resumeId, userId },
  });
  if (!resume) throw new NotFoundException('Currículo não encontrado');

  await this.prisma.resume.update({
    where: { id: resumeId },
    data: { status: 'PROCESSING' },
  });

  try {
    const result = await this.ai.fullAnalysis(resume.originalText, jobDescription);

    const analysis = await this.prisma.analysis.create({
      data: {
        resumeId,
        atsScore: Number(result.ats?.score) || 0,
        atsReport: result.ats || {},
        rewrittenResume: result.rewritten || {},
        recruiterFeedback: result.recruiter || {},
        innovationTips: result.innovation || {},
      },
    });

    await this.prisma.resumeVersion.create({
      data: {
        resumeId,
        label: `Otimizado v${await this.versionCount(resumeId)}`,
        content: this.rewrittenToText(result.rewritten),
        rewritten: result.rewritten || {},
      },
    });

    if (includeEnglish && result.rewritten) {
      const englishRewritten = await this.ai.translateToEnglish(result.rewritten);
      await this.prisma.resumeVersion.create({
        data: {
          resumeId,
          label: `English v${await this.versionCount(resumeId)}`,
          content: this.rewrittenToText(englishRewritten),
          rewritten: englishRewritten || {},
        },
      });
    }

    if (jobDescription && result.jobMatch) {
      await this.prisma.jobMatch.create({
        data: {
          resumeId,
          jobDescription,
          matchScore: Number(result.jobMatch.matchScore) || 0,
          missingKeywords: result.jobMatch.missingKeywords || [],
          suggestions: result.jobMatch.alignmentTips || [],
        },
      });
    }

    await this.prisma.resume.update({
      where: { id: resumeId },
      data: { status: 'ANALYZED' },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { creditsLeft: { decrement: requiredCredits } },
    });

    return analysis;
  } catch (err) {
    await this.prisma.resume.update({
      where: { id: resumeId },
      data: { status: 'FAILED' },
    });
    throw err;
  }
}

  list(userId: string) {
    return this.prisma.resume.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        analyses: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
  }

  async getOne(userId: string, id: string) {
    const resume = await this.prisma.resume.findFirst({
      where: { id, userId },
      include: {
        analyses: { orderBy: { createdAt: 'desc' } },
        jobMatches: { orderBy: { createdAt: 'desc' } },
        versions: { orderBy: { createdAt: 'asc' } },
        coverLetters: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!resume) throw new NotFoundException();
    return resume;
  }

  history(userId: string, id: string) {
    return this.prisma.resumeVersion.findMany({
      where: { resume: { id, userId } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async compare(userId: string, id: string) {
    const resume = await this.prisma.resume.findFirst({
      where: { id, userId },
      include: {
        versions: { orderBy: { createdAt: 'asc' } },
        analyses: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    if (!resume) throw new NotFoundException();
    const original = resume.versions.find((v) => v.label === 'Original');
    const latestOptimized = [...resume.versions]
      .reverse()
      .find((v) => v.label !== 'Original');
    return {
      original: original?.content || resume.originalText,
      optimized: latestOptimized?.content || '',
      rewritten: latestOptimized?.rewritten || null,
      analysis: resume.analyses[0] || null,
    };
  }

  async downloadOptimized(
  userId: string,
  resumeId: string,
  format: 'pdf' | 'docx' = 'pdf',
  language: 'pt' | 'en' = 'pt',
) {
  const user = await this.prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundException('Usuário não encontrado');

  const resume = await this.prisma.resume.findFirst({
    where: { id: resumeId, userId },
    include: {
      versions: { orderBy: { createdAt: 'desc' } },
      analyses: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });
  if (!resume) throw new NotFoundException('Currículo não encontrado');

  const optimized =
    language === 'en'
      ? resume.versions.find((v) => v.label.startsWith('English'))
      : resume.versions.find(
          (v) => v.label !== 'Original' && !v.label.startsWith('English'),
        );

  if (!optimized) {
    throw new BadRequestException(
      language === 'en'
        ? 'Versão em inglês não disponível. Você pediu essa versão ao analisar?'
        : 'Nenhuma versão otimizada disponível. Analise o currículo primeiro.',
    );
  }

  const rewritten: any = optimized.rewritten || {};
  const contact = this.resolveContact(rewritten.contact, user);

  const safeName = resume.title
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9-_]/g, '_');
  const suffix = language === 'en' ? '_english' : '_otimizado';

  if (format === 'docx') {
    const buffer = await this.buildDocx(rewritten, contact);
    return {
      buffer,
      filename: `${safeName}${suffix}.docx`,
      mimeType:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };
  }

  const buffer = await this.buildPdf(rewritten, contact);
  return {
    buffer,
    filename: `${safeName}${suffix}.pdf`,
    mimeType: 'application/pdf',
  };
}

async createShareLink(userId: string, resumeId: string) {
  const resume = await this.prisma.resume.findFirst({
    where: { id: resumeId, userId },
  });
  if (!resume) throw new NotFoundException();

  let token = resume.shareToken;
  if (!token) {
    token = this.generateToken();
    await this.prisma.resume.update({
      where: { id: resumeId },
      data: { shareToken: token },
    });
  }
  return { token };
}

async revokeShareLink(userId: string, resumeId: string) {
  const resume = await this.prisma.resume.findFirst({
    where: { id: resumeId, userId },
  });
  if (!resume) throw new NotFoundException();
  await this.prisma.resume.update({
    where: { id: resumeId },
    data: { shareToken: null },
  });
  return { ok: true };
}

async getPublicByToken(token: string) {
  const resume = await this.prisma.resume.findUnique({
    where: { shareToken: token },
    include: {
      versions: { orderBy: { createdAt: 'desc' } },
      user: { select: { name: true, email: true } },
    },
  });
  if (!resume) throw new NotFoundException('Link inválido ou expirado');

  const optimized = resume.versions.find(
    (v) => v.label !== 'Original' && !v.label.startsWith('English'),
  );
  if (!optimized) throw new NotFoundException('Versão otimizada não disponível');

  const rewritten: any = optimized.rewritten || {};
  const contact = this.resolveContact(rewritten.contact, resume.user);

  return {
    title: resume.title,
    rewritten,
    contact,
  };
}

private generateToken(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

  private resolveContact(fromCv: any, user: any) {
    const c = fromCv || {};
    return {
      name: c.name || user.name,
      email: c.email || user.email,
      phone: c.phone || null,
      location: c.location || null,
    };
  }

  remove(userId: string, id: string) {
    return this.prisma.resume.deleteMany({ where: { id, userId } });
  }

  private async versionCount(resumeId: string) {
    const c = await this.prisma.resumeVersion.count({ where: { resumeId } });
    return c;
  }

  private rewrittenToText(rewritten: any): string {
    if (!rewritten) return '';
    const lines: string[] = [];
    if (rewritten.headline) lines.push(rewritten.headline.toUpperCase(), '');
    if (rewritten.summary) lines.push('RESUMO', rewritten.summary, '');
    if (Array.isArray(rewritten.experience)) {
      lines.push('EXPERIÊNCIA');
      for (const exp of rewritten.experience) {
        lines.push(`${exp.role || ''} - ${exp.company || ''} (${exp.period || ''})`);
        if (Array.isArray(exp.bullets)) {
          for (const b of exp.bullets) lines.push(`  • ${b}`);
        }
        lines.push('');
      }
    }
    if (Array.isArray(rewritten.education)) {
      lines.push('FORMAÇÃO');
      for (const ed of rewritten.education) {
        lines.push(`${ed.degree || ''} - ${ed.school || ''} (${ed.period || ''})`);
      }
      lines.push('');
    }
    if (Array.isArray(rewritten.skills)) {
      lines.push('HABILIDADES', rewritten.skills.join(', '));
    }
    return lines.join('\n');
  }

  private buildPdf(rewritten: any, contact: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 55, bottom: 55, left: 60, right: 60 },
        });

        const chunks: Buffer[] = [];
        doc.on('data', (c: Buffer) => chunks.push(c));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const INK = '#1A1A1A';
        const MUTED = '#555555';
        const LINE = '#BFBFBF';
        const PAGE_W = doc.page.width;
        const LEFT = doc.page.margins.left;
        const RIGHT = PAGE_W - doc.page.margins.right;
        const CONTENT_W = RIGHT - LEFT;

        const sectionTitle = (label: string) => {
          doc.moveDown(0.8);
          doc
            .fillColor(INK)
            .font('Helvetica-Bold')
            .fontSize(10.5)
            .text(label.toUpperCase(), LEFT, doc.y, { characterSpacing: 1.5 });
          doc.moveDown(0.15);
          const y = doc.y;
          doc
            .strokeColor(LINE)
            .lineWidth(0.7)
            .moveTo(LEFT, y)
            .lineTo(RIGHT, y)
            .stroke();
          doc.moveDown(0.5);
        };

        const ensureSpace = (needed: number) => {
          if (doc.y + needed > doc.page.height - doc.page.margins.bottom) {
            doc.addPage();
          }
        };

        doc
          .fillColor(INK)
          .font('Helvetica-Bold')
          .fontSize(24)
          .text(contact.name || 'Nome do Candidato', LEFT, doc.y, {
            align: 'center',
            width: CONTENT_W,
          });

        if (rewritten.headline) {
          doc.moveDown(0.25);
          doc
            .fillColor(MUTED)
            .font('Helvetica')
            .fontSize(11.5)
            .text(rewritten.headline, LEFT, doc.y, {
              align: 'center',
              width: CONTENT_W,
            });
        }

        const contactParts: string[] = [];
        if (contact.email) contactParts.push(contact.email);
        if (contact.phone) contactParts.push(contact.phone);
        if (contact.location) contactParts.push(contact.location);

        if (contactParts.length) {
          doc.moveDown(0.35);
          doc
            .fillColor(MUTED)
            .font('Helvetica')
            .fontSize(9.5)
            .text(contactParts.join('  •  '), LEFT, doc.y, {
              align: 'center',
              width: CONTENT_W,
            });
        }

        doc.moveDown(0.6);
        const headerLineY = doc.y;
        doc
          .strokeColor(LINE)
          .lineWidth(0.5)
          .moveTo(LEFT, headerLineY)
          .lineTo(RIGHT, headerLineY)
          .stroke();
        doc.moveDown(0.3);

        if (rewritten.summary) {
          sectionTitle('Resumo Profissional');
          doc
            .fillColor(INK)
            .font('Helvetica')
            .fontSize(10)
            .text(rewritten.summary, LEFT, doc.y, {
              align: 'justify',
              width: CONTENT_W,
              lineGap: 2,
            });
        }

        if (Array.isArray(rewritten.experience) && rewritten.experience.length) {
          sectionTitle('Experiência Profissional');

          for (const exp of rewritten.experience) {
            ensureSpace(80);

            const role = exp.role || '';
            const company = exp.company || '';
            const period = exp.period || '';

            const topY = doc.y;
            doc
              .fillColor(INK)
              .font('Helvetica-Bold')
              .fontSize(11)
              .text(role, LEFT, topY, { width: CONTENT_W * 0.7 });

            if (period) {
              doc
                .fillColor(MUTED)
                .font('Helvetica')
                .fontSize(9.5)
                .text(period, LEFT + CONTENT_W * 0.7, topY, {
                  width: CONTENT_W * 0.3,
                  align: 'right',
                });
            }

            doc.y = Math.max(doc.y, topY + 14);

            if (company) {
              doc
                .fillColor(MUTED)
                .font('Helvetica-Oblique')
                .fontSize(10)
                .text(company, LEFT, doc.y, { width: CONTENT_W });
            }

            doc.moveDown(0.35);

            if (Array.isArray(exp.bullets)) {
              for (const b of exp.bullets) {
                ensureSpace(24);
                const bulletX = LEFT + 4;
                const textX = LEFT + 14;
                const startY = doc.y;

                doc
                  .fillColor(INK)
                  .font('Helvetica')
                  .fontSize(10)
                  .text('•', bulletX, startY, { width: 8 });

                doc
                  .fillColor(INK)
                  .font('Helvetica')
                  .fontSize(10)
                  .text(b, textX, startY, {
                    width: CONTENT_W - 14,
                    lineGap: 2,
                    align: 'left',
                  });

                doc.moveDown(0.15);
              }
            }

            doc.moveDown(0.5);
          }
        }

        if (Array.isArray(rewritten.education) && rewritten.education.length) {
          sectionTitle('Formação Acadêmica');

          for (const ed of rewritten.education) {
            ensureSpace(40);
            const topY = doc.y;

            doc
              .fillColor(INK)
              .font('Helvetica-Bold')
              .fontSize(11)
              .text(ed.degree || '', LEFT, topY, { width: CONTENT_W * 0.7 });

            if (ed.period) {
              doc
                .fillColor(MUTED)
                .font('Helvetica')
                .fontSize(9.5)
                .text(ed.period, LEFT + CONTENT_W * 0.7, topY, {
                  width: CONTENT_W * 0.3,
                  align: 'right',
                });
            }

            doc.y = Math.max(doc.y, topY + 14);

            if (ed.school) {
              doc
                .fillColor(MUTED)
                .font('Helvetica-Oblique')
                .fontSize(10)
                .text(ed.school, LEFT, doc.y, { width: CONTENT_W });
            }

            doc.moveDown(0.5);
          }
        }

        if (Array.isArray(rewritten.skills) && rewritten.skills.length) {
          sectionTitle('Habilidades');
          doc
            .fillColor(INK)
            .font('Helvetica')
            .fontSize(10)
            .text(rewritten.skills.join('  •  '), LEFT, doc.y, {
              width: CONTENT_W,
              lineGap: 3,
              align: 'left',
            });
        }

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  private async buildDocx(rewritten: any, contact: any): Promise<Buffer> {
    const INK = '1A1A1A';
    const MUTED = '555555';
    const LINE = 'BFBFBF';

    const sectionTitle = (label: string) =>
      new Paragraph({
        spacing: { before: 280, after: 80 },
        border: {
          bottom: { color: LINE, space: 4, style: BorderStyle.SINGLE, size: 6 },
        },
        children: [
          new TextRun({
            text: label.toUpperCase(),
            bold: true,
            size: 21,
            color: INK,
            characterSpacing: 30,
          }),
        ],
      });

    const children: Paragraph[] = [];

    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
        children: [
          new TextRun({
            text: contact.name || 'Nome do Candidato',
            bold: true,
            size: 48,
            color: INK,
          }),
        ],
      }),
    );

    if (rewritten.headline) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
          children: [
            new TextRun({
              text: rewritten.headline,
              size: 23,
              color: MUTED,
            }),
          ],
        }),
      );
    }

    const contactParts: string[] = [];
    if (contact.email) contactParts.push(contact.email);
    if (contact.phone) contactParts.push(contact.phone);
    if (contact.location) contactParts.push(contact.location);

    if (contactParts.length) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          border: {
            bottom: { color: LINE, space: 8, style: BorderStyle.SINGLE, size: 4 },
          },
          children: [
            new TextRun({
              text: contactParts.join('   •   '),
              size: 19,
              color: MUTED,
            }),
          ],
        }),
      );
    }

    if (rewritten.summary) {
      children.push(sectionTitle('Resumo Profissional'));
      children.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120, line: 300 },
          children: [new TextRun({ text: rewritten.summary, size: 20, color: INK })],
        }),
      );
    }

    if (Array.isArray(rewritten.experience) && rewritten.experience.length) {
      children.push(sectionTitle('Experiência Profissional'));

      for (const exp of rewritten.experience) {
        const role = exp.role || '';
        const company = exp.company || '';
        const period = exp.period || '';

        children.push(
          new Paragraph({
            spacing: { before: 120, after: 40 },
            children: [
              new TextRun({ text: role, bold: true, size: 22, color: INK }),
              ...(period
                ? [
                    new TextRun({
                      text: `   —   ${period}`,
                      size: 19,
                      color: MUTED,
                    }),
                  ]
                : []),
            ],
          }),
        );

        if (company) {
          children.push(
            new Paragraph({
              spacing: { after: 80 },
              children: [
                new TextRun({
                  text: company,
                  italics: true,
                  size: 20,
                  color: MUTED,
                }),
              ],
            }),
          );
        }

        if (Array.isArray(exp.bullets)) {
          for (const b of exp.bullets) {
            children.push(
              new Paragraph({
                bullet: { level: 0 },
                spacing: { after: 60, line: 280 },
                children: [new TextRun({ text: b, size: 20, color: INK })],
              }),
            );
          }
        }
      }
    }

    if (Array.isArray(rewritten.education) && rewritten.education.length) {
      children.push(sectionTitle('Formação Acadêmica'));

      for (const ed of rewritten.education) {
        children.push(
          new Paragraph({
            spacing: { before: 100, after: 40 },
            children: [
              new TextRun({
                text: ed.degree || '',
                bold: true,
                size: 22,
                color: INK,
              }),
              ...(ed.period
                ? [
                    new TextRun({
                      text: `   —   ${ed.period}`,
                      size: 19,
                      color: MUTED,
                    }),
                  ]
                : []),
            ],
          }),
        );

        if (ed.school) {
          children.push(
            new Paragraph({
              spacing: { after: 80 },
              children: [
                new TextRun({
                  text: ed.school,
                  italics: true,
                  size: 20,
                  color: MUTED,
                }),
              ],
            }),
          );
        }
      }
    }

    if (Array.isArray(rewritten.skills) && rewritten.skills.length) {
      children.push(sectionTitle('Habilidades'));
      children.push(
        new Paragraph({
          spacing: { after: 120, line: 300 },
          children: [
            new TextRun({
              text: rewritten.skills.join('   •   '),
              size: 20,
              color: INK,
            }),
          ],
        }),
      );
    }

    const doc = new Document({
      styles: {
        default: {
          document: { run: { font: 'Calibri' } },
        },
      },
      sections: [
        {
          properties: {
            page: {
              margin: { top: 1100, right: 1200, bottom: 1100, left: 1200 },
            },
          },
          children,
        },
      ],
    });

    return Packer.toBuffer(doc);
  }
}