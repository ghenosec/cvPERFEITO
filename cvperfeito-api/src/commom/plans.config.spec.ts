import { hasFeature, PLANS } from './plans.config';

describe('Plans Config', () => {
  describe('FREE plan', () => {
    it('should have 1 credit', () => {
      expect(PLANS.FREE.credits).toBe(1);
    });

    it('should not allow downloads', () => {
      expect(hasFeature('FREE', 'canDownloadFile')).toBe(false);
    });

    it('should not allow cover letter', () => {
      expect(hasFeature('FREE', 'canGenerateCoverLetter')).toBe(false);
    });

    it('should not allow job match', () => {
      expect(hasFeature('FREE', 'canMatchJob')).toBe(false);
    });

    it('should not allow english version', () => {
      expect(hasFeature('FREE', 'canGenerateEnglishVersion')).toBe(false);
    });

    it('should allow seeing rewritten resume', () => {
      expect(hasFeature('FREE', 'canSeeRewrittenResume')).toBe(true);
    });
  });

  describe('BASIC plan', () => {
    it('should have 5 credits', () => {
      expect(PLANS.BASIC.credits).toBe(5);
    });

    it('should allow downloads', () => {
      expect(hasFeature('BASIC', 'canDownloadFile')).toBe(true);
    });

    it('should allow cover letter', () => {
      expect(hasFeature('BASIC', 'canGenerateCoverLetter')).toBe(true);
    });

    it('should not allow job match', () => {
      expect(hasFeature('BASIC', 'canMatchJob')).toBe(false);
    });

    it('should not allow english version', () => {
      expect(hasFeature('BASIC', 'canGenerateEnglishVersion')).toBe(false);
    });

    it('should cost 490 cents', () => {
      expect(PLANS.BASIC.priceCents).toBe(490);
    });
  });

  describe('PREMIUM plan', () => {
    it('should have 15 credits', () => {
      expect(PLANS.PREMIUM.credits).toBe(15);
    });

    it('should allow everything', () => {
      const features = PLANS.PREMIUM.features;
      Object.values(features).forEach((v) => {
        expect(v).toBe(true);
      });
    });

    it('should cost 990 cents', () => {
      expect(PLANS.PREMIUM.priceCents).toBe(990);
    });
  });
});