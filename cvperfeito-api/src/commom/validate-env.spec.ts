import { validateEnv } from './validate-env';

describe('validateEnv', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      DATABASE_URL: 'postgresql://test',
      JWT_SECRET: 'a'.repeat(32),
      OPENAI_API_KEY: 'sk-test',
      ABACATEPAY_API_KEY: 'abc_test',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should not exit when all vars are present', () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });
    expect(() => validateEnv()).not.toThrow();
    exitSpy.mockRestore();
  });

  it('should exit when DATABASE_URL is missing', () => {
    delete process.env.DATABASE_URL;
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });
    expect(() => validateEnv()).toThrow('exit');
    exitSpy.mockRestore();
  });

  it('should exit when JWT_SECRET is too short', () => {
    process.env.JWT_SECRET = 'short';
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });
    expect(() => validateEnv()).toThrow('exit');
    exitSpy.mockRestore();
  });
});