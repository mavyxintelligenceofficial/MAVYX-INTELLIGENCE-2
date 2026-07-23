export interface AuthUser {
  id: string;
  email: string;
  fullName: string | null;
  createdAt: string;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
}
