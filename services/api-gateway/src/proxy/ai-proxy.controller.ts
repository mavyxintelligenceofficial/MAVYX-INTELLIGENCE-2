import { Controller, Post, Get, Body, Req, Res, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { Request, Response } from 'express';

/**
 * AI Service proxy — forwards /ai/* requests to the Python model-service
 * (port 4004). Follows the exact same pattern as MarketProxyController
 * and ProfileProxyController.
 *
 * The model-service handles:
 * - POST /generate — raw AI generation (used by agents internally)
 * - POST /analyze  — full analysis pipeline (7 agents + executive engine)
 * - GET  /health   — health check
 */
@Controller('ai')
export class AiProxyController {
  private readonly aiServiceUrl: string;

  constructor(private readonly httpService: HttpService) {
    this.aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:4004';
  }

  @Post('analyze')
  async analyze(@Body() body: any, @Req() request: Request) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.aiServiceUrl}/analyze`, body, {
          headers: { Authorization: request.headers.authorization || '' },
        }),
      );
      return response.data;
    } catch (err) {
      return this.handleError(err);
    }
  }

  @Post('analyze/stream')
  async analyzeStream(@Body() body: any, @Req() request: Request, @Res() res: Response) {
    // Use raw axios with responseType stream to pipe SSE through
    const axios = require('axios');
    try {
      const upstream = await axios({
        method: 'POST',
        url: `${this.aiServiceUrl}/analyze/stream`,
        data: body,
        headers: { Authorization: request.headers.authorization || '' },
        responseType: 'stream',
      });
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      upstream.data.pipe(res);
    } catch (err) {
      if (!res.headersSent) {
        res.status(502).json({ message: 'AI service unreachable' });
      }
    }
  }

  @Post('assistant')
  async assistant(@Body() body: any, @Req() request: Request) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.aiServiceUrl}/assistant`, body, {
          headers: { Authorization: request.headers.authorization || '' },
        }),
      );
      return response.data;
    } catch (err) {
      return this.handleError(err);
    }
  }

  @Post('generate')
  async generate(@Body() body: any, @Req() request: Request) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.aiServiceUrl}/generate`, body, {
          headers: { Authorization: request.headers.authorization || '' },
        }),
      );
      return response.data;
    } catch (err) {
      return this.handleError(err);
    }
  }

  @Post('journal/review')
  async journalReview(@Body() body: any, @Req() request: Request) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.aiServiceUrl}/journal/review`, body, {
          headers: { Authorization: request.headers.authorization || '' },
        }),
      );
      return response.data;
    } catch (err) {
      return this.handleError(err);
    }
  }

  @Post('journal/weekly-review')
  async weeklyReview(@Body() body: any, @Req() request: Request) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.aiServiceUrl}/journal/weekly-review`, body, {
          headers: { Authorization: request.headers.authorization || '' },
        }),
      );
      return response.data;
    } catch (err) {
      return this.handleError(err);
    }
  }

  @Get('health')
  async health() {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.aiServiceUrl}/health`),
      );
      return response.data;
    } catch (err) {
      return this.handleError(err);
    }
  }

  @Get('health/system')
  async systemHealth() {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.aiServiceUrl}/health/system`),
      );
      return response.data;
    } catch (err) {
      return this.handleError(err);
    }
  }

  @Get('analyze/history')
  async analysisHistory(@Req() request: Request) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.aiServiceUrl}/analyze/history`, {
          headers: { Authorization: request.headers.authorization || '' },
        }),
      );
      return response.data;
    } catch (err) {
      return this.handleError(err);
    }
  }

  @Get('analyze/:id')
  async getAnalysis(@Req() request: Request) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.aiServiceUrl}/analyze/${request.params.id}`, {
          headers: { Authorization: request.headers.authorization || '' },
        }),
      );
      return response.data;
    } catch (err) {
      return this.handleError(err);
    }
  }

  private handleError(err: unknown): never {
    const axiosError = err as AxiosError<{ message?: string; detail?: string }>;

    if (axiosError.response) {
      throw new HttpException(
        axiosError.response.data?.detail ||
          axiosError.response.data?.message ||
          'AI service error',
        axiosError.response.status,
      );
    }

    throw new HttpException(
      'AI service is unreachable',
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}
