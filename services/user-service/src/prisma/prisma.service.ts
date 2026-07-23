import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
// Own generated client folder, not the shared '@prisma/client' - see the
// matching comment in authentication-service's prisma.service.ts.
import { PrismaClient } from '../../generated/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
