import { Controller, Get, HttpException, HttpStatus, Query, Req } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { Request } from 'express';

/**
 * Market Proxy Controller
 * Public: /market/ticker (no auth)
 * Protected: /market/quote, /market/candles (auth required)
 */
@Controller('market')
export class MarketProxyController {
  private readonly marketServiceUrl: string;

  constructor(private readonly httpService: HttpService) {
    this.marketServiceUrl = process.env.MARKET_SERVICE_URL || 'http://localhost:4003';
  }

  /**
   * Public ticker endpoint — no authentication required.
   * Used for the landing page market ticker.
   */
  @Get('ticker')
  async getTicker() {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.marketServiceUrl}/market/ticker`),
      );
      return response.data;
    } catch (err) {
      const axiosError = err as AxiosError;
      if (axiosError.response) {
        throw new HttpException(
          (axiosError.response.data as any)?.message || 'Market service error',
          axiosError.response.status,
        );
      }
      throw new HttpException('Market service is unreachable', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  @Get('quote')
  async getQuote(@Query('symbol') symbol: string, @Req() request: Request) {
    return this.forward('/market/quote', { symbol }, request);
  }

  @Get('candles')
  async getCandles(
    @Query('symbol') symbol: string,
    @Query('interval') interval: string,
    @Req() request: Request,
  ) {
    return this.forward('/market/candles', { symbol, interval }, request);
  }

  private async forward(path: string, params: Record<string, string>, request: Request) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.marketServiceUrl}${path}`, {
          params,
          headers: { Authorization: request.headers.authorization || '' },
        }),
      );
      return response.data;
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;

      if (axiosError.response) {
        throw new HttpException(
          axiosError.response.data?.message || 'Market service error',
          axiosError.response.status,
        );
      }

      throw new HttpException('Market service is unreachable', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }
}
