import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * A profile is never explicitly "signed up for" - it's created lazily
   * the first time a logged-in user touches anything profile-related.
   * This keeps authentication-service and user-service fully decoupled:
   * auth service doesn't need to know user-service exists at signup time.
   */
  async getOrCreateProfile(authUserId: string) {
    const existing = await this.prisma.userProfile.findUnique({
      where: { authUserId },
    });
    if (existing) return existing;

    return this.prisma.userProfile.create({
      data: { authUserId },
    });
  }

  async updateProfile(authUserId: string, dto: UpdateProfileDto) {
    await this.getOrCreateProfile(authUserId);

    return this.prisma.userProfile.update({
      where: { authUserId },
      data: {
        ...(dto.displayName !== undefined && { displayName: dto.displayName }),
        ...(dto.timezone !== undefined && { timezone: dto.timezone }),
        ...(dto.notificationPreferences !== undefined && {
          // Prisma's Json columns require its own InputJsonValue type,
          // which plain `Record<string, unknown>` doesn't satisfy on
          // the nose - this cast is safe because we've already validated
          // the shape is a plain object via @IsObject() in the DTO.
          notificationPreferences: dto.notificationPreferences as Prisma.InputJsonValue,
        }),
        ...(dto.watchlistSymbols !== undefined && {
          // Full replace, not append/merge - the frontend always sends
          // the complete desired list (add/remove is a client-side
          // concern), same as how PATCH already works for the other
          // fields on this DTO.
          watchlistSymbols: dto.watchlistSymbols,
        }),
      },
    });
  }
}
