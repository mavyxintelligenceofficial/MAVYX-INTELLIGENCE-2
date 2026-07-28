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
  async analyzeStream(@Body() body: any, @Req() request: Request, @Res() response: Response) {
    const url = `${this.aiServiceUrl}/analyze/stream`;
    const postData = JSON.stringify(body);
    const parsedUrl = new URL(url);
    
    const proxyReq = http.request({
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': request.headers.authorization || '',
      },
    }, (proxyRes) => {
      response.writeHead(proxyRes.statusCode || 200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      });
      proxyRes.pipe(response);
    });
    
    proxyReq.on('error', () => {
      if (!response.headersSent) {
        response.status(502).json({ message: 'AI service unreachable' });
      }
    });
    
    proxyReq.write(postData);
    proxyReq.end();
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
