import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AuthProxyController } from './auth-proxy.controller';
import { ProfileProxyController } from './profile-proxy.controller';

@Module({
  imports: [HttpModule],
  controllers: [AuthProxyController, ProfileProxyController],
})
export class ProxyModule {}
