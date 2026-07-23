// This MUST be the very first import - see the identical comment in
// authentication-service and user-service's main.ts for why. Without
// this, this service silently uses the wrong JWT secret and every
// token verification will fail.
import 'dotenv/config';

import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Browsers block cross-origin requests by default. The frontend runs
  // on a different port (3000) than the gateway (4000), so without this
  // every fetch() call from the browser would fail with a CORS error -
  // even though curl (which doesn't enforce CORS) worked fine in testing.
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  const port = process.env.PORT ? Number(process.env.PORT) : 4000;
  await app.listen(port);
  console.log(`API Gateway is running on http://localhost:${port}`);
  console.log(`Health check: http://localhost:${port}/health`);
}

bootstrap();
