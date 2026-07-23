import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ProfileModule } from './profile/profile.module';
import { JwtAuthGuard } from './common/jwt-auth.guard';

@Module({
  imports: [
    ProfileModule,
    JwtModule.register({
      // Must match JWT_SECRET in authentication-service/.env and
      // api-gateway/.env exactly.
      secret: process.env.JWT_SECRET || 'dev_only_insecure_secret',
    }),
  ],
  providers: [JwtAuthGuard],
  exports: [JwtAuthGuard],
})
export class AppModule {}
