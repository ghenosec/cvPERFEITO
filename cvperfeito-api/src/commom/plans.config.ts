import { Plan } from '@prisma/client';

export interface PlanConfig {
  plan: Plan;
  name: string;
  credits: number;
  priceCents: number;
  features: {
    canDownloadFile: boolean;
    canGenerateCoverLetter: boolean;
    canSeeRewrittenResume: boolean;
    canCompareVersions: boolean;
    canSeeHistory: boolean;
    canMatchJob: boolean;
    canGenerateEnglishVersion: boolean;
    canSeeScoreEvolution: boolean;
  };
}

export const PLANS: Record<Plan, PlanConfig> = {
  FREE: {
  plan: 'FREE',
  name: 'Gratuito',
  credits: 1,
  priceCents: 0,
  features: {
    canDownloadFile: false,
    canGenerateCoverLetter: false,
    canSeeRewrittenResume: true,
    canCompareVersions: false,
    canSeeHistory: false,
    canMatchJob: false,
    canGenerateEnglishVersion: false,
    canSeeScoreEvolution: false,
  },
},
  BASIC: {
    plan: 'BASIC',
    name: 'Básico',
    credits: 5,
    priceCents: 490,
    features: {
      canDownloadFile: true,
      canGenerateCoverLetter: true,
      canSeeRewrittenResume: true,
      canCompareVersions: true,
      canSeeHistory: true,
      canMatchJob: false,
      canGenerateEnglishVersion: false,
      canSeeScoreEvolution: false,
    },
  },
  PREMIUM: {
    plan: 'PREMIUM',
    name: 'Premium',
    credits: 15,
    priceCents: 990,
    features: {
      canDownloadFile: true,
      canGenerateCoverLetter: true,
      canSeeRewrittenResume: true,
      canCompareVersions: true,
      canSeeHistory: true,
      canMatchJob: true,
      canGenerateEnglishVersion: true,
      canSeeScoreEvolution: true,
    },
  },
};

export function hasFeature(
  plan: Plan,
  feature: keyof PlanConfig['features'],
): boolean {
  return PLANS[plan].features[feature];
}