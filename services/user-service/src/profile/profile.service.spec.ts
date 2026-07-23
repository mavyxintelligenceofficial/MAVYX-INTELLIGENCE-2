import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProfileService } from './profile.service';

describe('ProfileService', () => {
  let prisma: any;
  let service: ProfileService;

  beforeEach(() => {
    prisma = {
      userProfile: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
    };
    service = new ProfileService(prisma);
  });

  describe('getOrCreateProfile', () => {
    it('returns the existing profile if one already exists', async () => {
      const existing = { id: 'p1', authUserId: 'user-1', role: 'STANDARD' };
      prisma.userProfile.findUnique.mockResolvedValue(existing);

      const result = await service.getOrCreateProfile('user-1');

      expect(result).toEqual(existing);
      expect(prisma.userProfile.create).not.toHaveBeenCalled();
    });

    it('creates a default profile if none exists yet', async () => {
      prisma.userProfile.findUnique.mockResolvedValue(null);
      const created = { id: 'p2', authUserId: 'user-2', role: 'STANDARD' };
      prisma.userProfile.create.mockResolvedValue(created);

      const result = await service.getOrCreateProfile('user-2');

      expect(result).toEqual(created);
      expect(prisma.userProfile.create).toHaveBeenCalledWith({
        data: { authUserId: 'user-2' },
      });
    });
  });

  describe('updateProfile', () => {
    it('updates only the fields that were provided', async () => {
      prisma.userProfile.findUnique.mockResolvedValue({ id: 'p1', authUserId: 'user-1' });
      prisma.userProfile.update.mockResolvedValue({
        id: 'p1',
        authUserId: 'user-1',
        displayName: 'Trader Joe',
      });

      const result = await service.updateProfile('user-1', { displayName: 'Trader Joe' });

      expect(result.displayName).toBe('Trader Joe');
      expect(prisma.userProfile.update).toHaveBeenCalledWith({
        where: { authUserId: 'user-1' },
        data: { displayName: 'Trader Joe' },
      });
    });
  });
});
