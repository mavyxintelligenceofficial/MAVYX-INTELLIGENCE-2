import { apiRequest } from '@/services/api-client';
import { AuthResponse } from './types';

interface SignupData {
  email: string;
  password: string;
  fullName?: string;
}

export async function signup(data: SignupData): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/signup', {
    method: 'POST',
    body: data,
  });
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
}

export async function loginWithCredentials(data: { email: string; password: string }): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: data,
  });
}
