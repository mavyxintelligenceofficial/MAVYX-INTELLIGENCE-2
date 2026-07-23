import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';

@Module({
  imports: [
    JwtModule.register({
      // Must match JWT_SECRET in authentication-service/.env and
      // api-gateway/.env exactly.
      secret: process.env.JWT_SECRET || 'dev_only_insecure_secret',
    }),
  ],
  controllers: [ProfileController],
  providers: [ProfileService, PrismaService, JwtAuthGuard],
})
export class ProfileModule {}
