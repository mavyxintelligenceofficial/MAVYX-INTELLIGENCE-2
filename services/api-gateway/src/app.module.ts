import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { HealthController } from './health/health.controller';
import { HealthService } from './health/health.service';
import { ProxyModule } from './proxy/proxy.module';
import { MeController } from './common/me.controller';
import { JwtAuthGuard } from './common/jwt-auth.guard';

@Module({
  imports: [
    ProxyModule,
    JwtModule.register({
      // Must match JWT_SECRET in authentication-service/.env exactly.
      secret: process.env.JWT_SECRET || 'dev_only_insecure_secret',
    }),
  ],
  controllers: [HealthController, MeController],
  providers: [HealthService, JwtAuthGuard],
})
export class AppModule {}
