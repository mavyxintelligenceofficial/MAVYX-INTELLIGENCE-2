import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';
import { MarketController } from './market.controller';
import { MarketService } from './market.service';
import { CacheService } from '../common/cache.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { TwelveDataProvider } from './providers/twelve-data.provider';
import { MARKET_DATA_PROVIDER } from './providers/market-data-provider.interface';

@Module({
  imports: [
    HttpModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev_only_insecure_secret',
    }),
  ],
  controllers: [MarketController],
  providers: [
    MarketService,
    CacheService,
    JwtAuthGuard,
    // Bound to the interface token, not the concrete class - swapping
    // providers later means changing only this one line.
    { provide: MARKET_DATA_PROVIDER, useClass: TwelveDataProvider },
  ],
})
export class MarketModule {}
