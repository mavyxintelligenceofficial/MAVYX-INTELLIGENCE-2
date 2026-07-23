import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
// Imports from the service's OWN generated client folder (set via
// `output` in prisma/schema.prisma), NOT the shared '@prisma/client'
// package - this keeps this service's types isolated from any other
// service's Prisma schema in the monorepo.
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
