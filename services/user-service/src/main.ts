// This MUST be the very first import - see the identical comment in
// authentication-service and api-gateway's main.ts for why: without
// this, this service silently uses the wrong JWT secret and every
// token verification will fail.
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

  const port = process.env.PORT ? Number(process.env.PORT) : 4002;
  await app.listen(port);
  console.log(`User Service is running on http://localhost:${port}`);
}

bootstrap();
