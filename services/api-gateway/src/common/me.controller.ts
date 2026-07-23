import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from './jwt-auth.guard';

/**
 * Proof that JwtAuthGuard actually works: this route returns 401 with no
 * token / a bad token, and returns the decoded token payload when a
 * valid one (from a real /auth/login) is sent. This is the pattern every
 * future "must be logged in" route in this gateway will copy.
 */
@Controller('me')
export class MeController {
  @UseGuards(JwtAuthGuard)
  @Get()
  getProfile(@Req() request: Request) {
    return { authenticatedAs: (request as Request & { user?: unknown }).user };
  }
}
