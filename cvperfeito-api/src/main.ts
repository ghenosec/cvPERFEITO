import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { json, raw } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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
  console.log(`cvPERFEITO API running on http://localhost:${port}`);
}
bootstrap();
