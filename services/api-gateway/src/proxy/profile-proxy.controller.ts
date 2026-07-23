import { Body, Controller, Get, HttpException, HttpStatus, Patch, Req } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { Request } from 'express';

/**
 * Same forwarding pattern as AuthProxyController, but this one also
 * passes the client's Authorization header through - user-service needs
 * it to verify the JWT and know which user's profile to load/update.
 */
@Controller('profile')
export class ProfileProxyController {
  private readonly userServiceUrl: string;

  constructor(private readonly httpService: HttpService) {
    this.userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:4002';
  }

  @Get()
  async getProfile(@Req() request: Request) {
    return this.forward('get', '/profile', request, undefined);
  }

  @Patch()
  async updateProfile(@Req() request: Request, @Body() body: unknown) {
    return this.forward('patch', '/profile', request, body);
  }

  private async forward(
    method: 'get' | 'patch',
    path: string,
    request: Request,
    body: unknown,
  ) {
    try {
      const headers = request.headers.authorization
        ? { Authorization: request.headers.authorization }
        : {};

      const response = await firstValueFrom(
        method === 'get'
          ? this.httpService.get(`${this.userServiceUrl}${path}`, { headers })
          : this.httpService.patch(`${this.userServiceUrl}${path}`, body, { headers }),
      );
      return response.data;
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;

      if (axiosError.response) {
        throw new HttpException(
          axiosError.response.data?.message || 'User service error',
          axiosError.response.status,
        );
      }

      throw new HttpException('User service is unreachable', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }
}
