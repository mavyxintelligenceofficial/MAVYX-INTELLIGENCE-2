import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

/**
 * Attach this guard to any route that should require "must be logged in".
 * It does NOT call the Authentication Service over the network - it
 * verifies the JWT's signature and expiry locally using the same
 * JWT_SECRET both services share. This keeps protected routes fast and
 * means the gateway still works even if the Authentication Service is
 * temporarily unreachable (the token itself is proof of a prior valid
 * login).
 *
 * Usage on a controller method:
 *   @UseGuards(JwtAuthGuard)
 *   @Get('me')
 *   getProfile(@Req() req) { return req.user; }
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'dev_only_insecure_secret',
      });
      // Makes the decoded token (userId as `sub`, email) available to
      // the route handler via req.user.
      (request as Request & { user?: unknown }).user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractToken(request: Request): string | undefined {
    const header = request.headers.authorization;
    if (!header) return undefined;
    const [type, token] = header.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
