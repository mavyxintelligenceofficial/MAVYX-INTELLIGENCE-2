export type UserRole = 'ADMINISTRATOR' | 'PROFESSIONAL' | 'STANDARD' | 'RESEARCH';

export interface Profile {
  id: string;
  authUserId: string;
  role: UserRole;
  displayName: string | null;
  timezone: string | null;
  notificationPreferences: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfilePayload {
  displayName?: string;
  timezone?: string;
}
