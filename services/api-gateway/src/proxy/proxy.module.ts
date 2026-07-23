import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AuthProxyController } from './auth-proxy.controller';
import { ProfileProxyController } from './profile-proxy.controller';
import { MarketProxyController } from './market-proxy.controller';
import { AiProxyController } from './ai-proxy.controller';

@Module({
  imports: [HttpModule],
  controllers: [AuthProxyController, ProfileProxyController, MarketProxyController, AiProxyController],
})
export class ProxyModule {}
