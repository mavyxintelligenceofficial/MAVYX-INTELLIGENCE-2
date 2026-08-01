import { BadRequestException, Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { MarketService } from './market.service';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Writes/updates a single KEY=value line in the .env file on disk, so a
 * key set via Settings actually persists across restarts - not just in
 * process.env for the current process (which is lost the moment this
 * service restarts, and it runs under ts-node-dev --watch, which restarts
 * on every file change).
 */
function persistEnvVar(key: string, value: string): void {
  const envPath = path.join(process.cwd(), '.env');
  let lines: string[] = [];
  if (fs.existsSync(envPath)) {
    lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  }
  const pattern = new RegExp(`^${key}=`);
  const idx = lines.findIndex((l) => pattern.test(l));
  const newLine = `${key}=${value}`;
  if (idx >= 0) {
    lines[idx] = newLine;
  } else {
    if (lines.length > 0 && lines[lines.length - 1].trim() !== '') lines.push('');
    lines.push(newLine);
  }
  fs.writeFileSync(envPath, lines.join('\n'));
}

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
    // Update the environment variable for the current process immediately...
    process.env.MARKET_DATA_API_KEY = body.apiKey;
    // ...and persist it to .env on disk so it survives a restart (this
    // service runs under ts-node-dev --watch, which restarts on every
    // file change - a process.env-only update was being silently lost).
    try {
      persistEnvVar('MARKET_DATA_API_KEY', body.apiKey);
    } catch (err) {
      return {
        success: true,
        message: 'API key updated for this session, but could not be saved to .env on disk: ' + (err as Error).message,
      };
    }
    return { success: true, message: 'API key updated and saved to .env' };
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
