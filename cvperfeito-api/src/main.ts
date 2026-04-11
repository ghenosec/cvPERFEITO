import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { json, raw } from 'express';
import helmet from 'helmet';
import { validateEnv } from './commom/validate-env';

async function bootstrap() {
  validateEnv();

  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.use('/api/billing/webhook', raw({ type: '*/*' }));
  app.use(json({ limit: '10mb' }));

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:4200',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );

  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`cvPERFEITO API running on port ${port}`);
}
bootstrap();