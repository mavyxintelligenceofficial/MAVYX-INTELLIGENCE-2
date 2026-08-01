import { BadRequestException, Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { MarketService } from './market.service';

@Controller('market')
export class MarketController {
  constructor(private readonly marketService: MarketService) {}

  /**
   * Public ticker endpoint — returns prices for common pairs.
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

  /**
   * Update API key at runtime — accepts key from frontend settings.
   * Auth-guarded: this overwrites the live provider credential, so it
   * must not be reachable by an unauthenticated caller.
   */
  @UseGuards(JwtAuthGuard)
  @Post('api-key')
  async updateApiKey(@Body() body: { apiKey: string }) {
    if (!body.apiKey) {
      throw new BadRequestException('apiKey is required');
    }
    // Update the environment variable at runtime
    process.env.MARKET_DATA_API_KEY = body.apiKey;
    return { success: true, message: 'API key updated' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('api-key/status')
  async apiKeyStatus() {
    const key = process.env.MARKET_DATA_API_KEY || '';
    const configured = key.length > 0;
    return {
      configured,
      keyPreview: configured && key.length >= 4 ? '…' + key.slice(-4) : null,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('quote')
  async getQuote(@Query('symbol') symbol?: string) {
    if (!symbol) {
      throw new BadRequestException('symbol query parameter is required');
    }
    return this.marketService.getQuote(symbol);
  }

  @UseGuards(JwtAuthGuard)
  @Get('candles')
  async getCandles(@Query('symbol') symbol?: string, @Query('interval') interval = '1h') {
    if (!symbol) {
      throw new BadRequestException('symbol query parameter is required');
    }
    return this.marketService.getCandles(symbol, interval);
  }
}
