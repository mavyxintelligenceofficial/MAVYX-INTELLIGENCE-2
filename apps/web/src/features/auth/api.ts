import { apiRequest } from '@/services/api-client';
import { AuthResponse } from './types';

export async function signup(email: string, password: string): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/signup', {
    method: 'POST',
    body: { email, password },
  });
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
}
