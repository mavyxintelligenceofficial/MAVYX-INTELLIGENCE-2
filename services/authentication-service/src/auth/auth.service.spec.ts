import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as bcrypt from 'bcrypt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let prisma: any;
  let jwtService: any;
  let authService: AuthService;

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
    };
    jwtService = {
      signAsync: vi.fn().mockResolvedValue('fake.jwt.token'),
    };
    authService = new AuthService(prisma, jwtService);
  });

  describe('signup', () => {
    it('creates a new user with a hashed password and returns a token', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'trader@mavyx.ai',
        fullName: null,
        passwordHash: 'hashed',
        createdAt: new Date('2026-01-01'),
      });

      const result = await authService.signup({
        email: 'trader@mavyx.ai',
        password: 'supersecret123',
      });

      expect(result.user.email).toBe('trader@mavyx.ai');
      expect(result.accessToken).toBe('fake.jwt.token');
      // The password hash must never be leaked back to the caller.
      expect((result.user as any).passwordHash).toBeUndefined();
    });

    it('rejects signup if the email is already registered', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'existing-user' });

      await expect(
        authService.signup({ email: 'trader@mavyx.ai', password: 'supersecret123' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('login', () => {
    it('rejects login for an unknown email', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        authService.login({ email: 'nobody@mavyx.ai', password: 'whatever123' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects login when the password does not match', async () => {
      const passwordHash = await bcrypt.hash('correct-password', 10);
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'trader@mavyx.ai',
        passwordHash,
        fullName: null,
        createdAt: new Date('2026-01-01'),
      });

      await expect(
        authService.login({ email: 'trader@mavyx.ai', password: 'wrong-password' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('logs in successfully with the correct password', async () => {
      const passwordHash = await bcrypt.hash('correct-password', 10);
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'trader@mavyx.ai',
        passwordHash,
        fullName: null,
        createdAt: new Date('2026-01-01'),
      });

      const result = await authService.login({
        email: 'trader@mavyx.ai',
        password: 'correct-password',
      });

      expect(result.accessToken).toBe('fake.jwt.token');
      expect(result.user.email).toBe('trader@mavyx.ai');
    });
  });
});
