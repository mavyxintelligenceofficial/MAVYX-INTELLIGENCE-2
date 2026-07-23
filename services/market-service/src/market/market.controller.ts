import { BadRequestException, Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { MarketService } from './market.service';

/**
 * Symbols are passed as a query param (?symbol=EUR/USD), not a URL path
 * segment - a literal "/" in a path segment would be misread as an extra
 * route level.
 */
@UseGuards(JwtAuthGuard)
@Controller('market')
export class MarketController {
  constructor(private readonly marketService: MarketService) {}

  @Get('quote')
  async getQuote(@Query('symbol') symbol?: string) {
    if (!symbol) {
      throw new BadRequestException('symbol query parameter is required, e.g. ?symbol=EUR/USD');
    }
    return this.marketService.getQuote(symbol);
  }

  @Get('candles')
  async getCandles(@Query('symbol') symbol?: string, @Query('interval') interval = '1h') {
    if (!symbol) {
      throw new BadRequestException('symbol query parameter is required, e.g. ?symbol=EUR/USD');
    }
    return this.marketService.getCandles(symbol, interval);
  }
}
