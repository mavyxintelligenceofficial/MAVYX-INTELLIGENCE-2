import { Body, Controller, HttpException, HttpStatus, Post } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

/**
 * The gateway does NOT implement authentication itself - it forwards
 * these requests to the Authentication Service and passes the response
 * straight back through. This is the "single entry point" pattern from
 * TAD Vol. III Ch. 2: clients only ever talk to the gateway, never
 * directly to internal services.
 */
@Controller('auth')
export class AuthProxyController {
  private readonly authServiceUrl: string;

  constructor(private readonly httpService: HttpService) {
    this.authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:4001';
  }

  @Post('signup')
  async signup(@Body() body: unknown) {
    return this.forward('/auth/signup', body);
  }

  @Post('login')
  async login(@Body() body: unknown) {
    return this.forward('/auth/login', body);
  }

  private async forward(path: string, body: unknown) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.authServiceUrl}${path}`, body),
      );
      return response.data;
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;

      if (axiosError.response) {
        // Pass through the Authentication Service's own status code and
        // message (e.g. 409 Conflict for a duplicate email) instead of
        // masking every failure as a generic gateway error.
        throw new HttpException(
          axiosError.response.data?.message || 'Authentication service error',
          axiosError.response.status,
        );
      }

      // The Authentication Service didn't respond at all (down, wrong
      // port, etc.) - this is a gateway-side problem, not a user error.
      throw new HttpException(
        'Authentication service is unreachable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
