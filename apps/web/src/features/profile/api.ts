import { apiRequest } from '@/services/api-client';
import { Profile, UpdateProfilePayload } from './types';

export async function getProfile(token: string): Promise<Profile> {
  return apiRequest<Profile>('/profile', { token });
}

export async function updateProfile(token: string, payload: UpdateProfilePayload): Promise<Profile> {
  return apiRequest<Profile>('/profile', {
    method: 'PATCH',
    token,
    body: payload,
  });
}
