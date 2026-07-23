// This MUST be the very first import - see the identical comment in
// every other service's main.ts for why. Without this, this service
// silently uses the wrong JWT secret and every token verification fails.
import 'dotenv/config';

import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT ? Number(process.env.PORT) : 4003;
  await app.listen(port);
  console.log(`Market Service is running on http://localhost:${port}`);
}

bootstrap();
