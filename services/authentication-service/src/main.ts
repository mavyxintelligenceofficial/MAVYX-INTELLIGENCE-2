// This MUST be the very first import in this file. It loads the local
// .env file into process.env explicitly, so every part of this service
// (JwtModule, Prisma, anything else) sees the SAME environment values -
// instead of accidentally relying on Prisma's incidental side effect of
// loading .env, which api-gateway (no Prisma) does not get for free.
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

  const port = process.env.PORT ? Number(process.env.PORT) : 4001;
  await app.listen(port);
  console.log(`Authentication Service is running on http://localhost:${port}`);
}

bootstrap();
