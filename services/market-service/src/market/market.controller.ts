import { BadRequestException, Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { MarketService } from './market.service';

/**
 * Market Controller
 * Public endpoint: /market/ticker (no auth required)
 * Protected endpoints: /market/quote, /market/candles (auth required)
 */
@Controller('market')
export class MarketController {
  constructor(private readonly marketService: MarketService) {}

  /**
   * Public ticker endpoint — returns prices for common pairs.
   * No authentication required. Used for the landing page ticker.
   */
  @Get('ticker')
  async getTicker() {
    const symbols = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD'];
    const results: Record<string, { price: number; timestamp: string } | null> = {};

    await Promise.allSettled(
      symbols.map(async (symbol) => {
        try {
          const quote = await this.marketService.getQuote(symbol);
          results[symbol] = { price: quote.price, timestamp: quote.timestamp };
        } catch {
          results[symbol] = null;
        }
      }),
    );

    return results;
  }

  @UseGuards(JwtAuthGuard)
  @Get('quote')
  async getQuote(@Query('symbol') symbol?: string) {
    if (!symbol) {
      throw new BadRequestException('symbol query parameter is required, e.g. ?symbol=EUR/USD');
    }
    return this.marketService.getQuote(symbol);
  }

  @UseGuards(JwtAuthGuard)
  @Get('candles')
  async getCandles(@Query('symbol') symbol?: string, @Query('interval') interval = '1h') {
    if (!symbol) {
      throw new BadRequestException('symbol query parameter is required, e.g. ?symbol=EUR/USD');
    }
    return this.marketService.getCandles(symbol, interval);
  }
}
