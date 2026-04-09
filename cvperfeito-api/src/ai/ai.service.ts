import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import {
  ATS_ANALYZER_PROMPT,
  RESUME_WRITER_PROMPT,
  RECRUITER_VISION_PROMPT,
  MARKET_MATCH_PROMPT,
  INNOVATION_PROMPT,
  COVER_LETTER_PROMPT,
} from './prompts';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'sk-placeholder',
    });
  }

  private async callJson(systemPrompt: string, userContent: string): Promise<any> {
    try {
      const res = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        temperature: 0.4,
      });
      const raw = res.choices[0].message.content ?? '{}';
      return JSON.parse(raw);
    } catch (err) {
      this.logger.error('AI call failed', err);
      return {};
    }
  }

  analyzeAts(resumeText: string) {
    return this.callJson(ATS_ANALYZER_PROMPT, resumeText);
  }

  rewriteResume(resumeText: string) {
    return this.callJson(RESUME_WRITER_PROMPT, resumeText);
  }

  recruiterView(resumeText: string) {
    return this.callJson(RECRUITER_VISION_PROMPT, resumeText);
  }
  
  translateToEnglish(rewritten: any) {
  const systemPrompt = `You are a professional resume translator.
Translate the following Brazilian Portuguese resume JSON into professional American English.
Keep the EXACT same JSON structure. Translate all string values including headline, summary,
role, company, period, bullets, degree, school, and skills. Do not translate proper nouns
(company names, school names, person names). Return ONLY valid JSON, no extra text.`;
  return this.callJson(systemPrompt, JSON.stringify(rewritten));
}

  matchJob(resumeText: string, jobDescription: string) {
    const payload = `CURRICULO:\n${resumeText}\n\nVAGA:\n${jobDescription}`;
    return this.callJson(MARKET_MATCH_PROMPT, payload);
  }

  innovationTips(resumeText: string) {
    return this.callJson(INNOVATION_PROMPT, resumeText);
  }

  generateCoverLetter(resumeText: string, jobDescription?: string) {
    const payload = jobDescription
      ? `CURRICULO:\n${resumeText}\n\nVAGA:\n${jobDescription}`
      : `CURRICULO:\n${resumeText}`;
    return this.callJson(COVER_LETTER_PROMPT, payload);
  }

  async fullAnalysis(resumeText: string, jobDescription?: string) {
    const tasks: Promise<any>[] = [
      this.analyzeAts(resumeText),
      this.rewriteResume(resumeText),
      this.recruiterView(resumeText),
      this.innovationTips(resumeText),
    ];
    if (jobDescription) tasks.push(this.matchJob(resumeText, jobDescription));

    const results = await Promise.all(tasks);
    const [ats, rewritten, recruiter, innovation, jobMatch] = results;

    return {
      ats: ats || {},
      rewritten: rewritten || {},
      recruiter: recruiter || {},
      innovation: innovation || {},
      jobMatch: jobMatch || null,
    };
  }
}
