import { ArrayMaxSize, IsArray, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Note: role is intentionally NOT editable through this DTO. Role
 * changes go through the Administration Module (per SRS Vol. II Ch. 4,
 * Section 4.18 - "Administrators manage users, roles..."), not
 * self-service by the user themselves. That admin endpoint doesn't
 * exist yet - flagged as a follow-up in the project report.
 */
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  timezone?: string;

  @IsOptional()
  @IsObject()
  notificationPreferences?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(50)
  watchlistSymbols?: string[];
}
