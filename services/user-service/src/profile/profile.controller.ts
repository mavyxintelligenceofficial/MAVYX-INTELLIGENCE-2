import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

interface AuthedRequest extends Request {
  user?: { sub: string; email: string };
}

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  async getMyProfile(@Req() request: AuthedRequest) {
    const authUserId = request.user!.sub;
    return this.profileService.getOrCreateProfile(authUserId);
  }

  @Patch()
  async updateMyProfile(@Req() request: AuthedRequest, @Body() dto: UpdateProfileDto) {
    const authUserId = request.user!.sub;
    return this.profileService.updateProfile(authUserId, dto);
  }
}
