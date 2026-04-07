import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    userPreference: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

vi.mock('../../../src/config/database', () => ({ prisma: mockPrisma }));
vi.mock('../../../src/logging/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { UserPreferencesService } from '../../../src/modules/users/user-preferences.service';

let service: UserPreferencesService;

beforeEach(() => {
  vi.resetAllMocks();
  service = new UserPreferencesService();
});

describe('getPreferences', () => {
  it('returns stored preference when one exists', async () => {
    const stored = { userId: 'u1', deliveryMode: 'ALSO_PACKAGE', createdAt: new Date(), updatedAt: new Date() };
    mockPrisma.userPreference.findUnique.mockResolvedValue(stored);

    const result = await service.getPreferences('u1');
    expect(result.deliveryMode).toBe('ALSO_PACKAGE');
  });

  it('returns default IN_APP_ONLY when no preference exists', async () => {
    mockPrisma.userPreference.findUnique.mockResolvedValue(null);

    const result = await service.getPreferences('u1');
    expect(result.deliveryMode).toBe('IN_APP_ONLY');
    expect(result.userId).toBe('u1');
    expect(result.createdAt).toBeNull();
  });
});

describe('updatePreferences', () => {
  it('upserts to ALSO_PACKAGE', async () => {
    const pref = { userId: 'u1', deliveryMode: 'ALSO_PACKAGE', createdAt: new Date(), updatedAt: new Date() };
    mockPrisma.userPreference.upsert.mockResolvedValue(pref);

    const result = await service.updatePreferences('u1', { deliveryMode: 'ALSO_PACKAGE' });
    expect(result.deliveryMode).toBe('ALSO_PACKAGE');
    expect(mockPrisma.userPreference.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ deliveryMode: 'ALSO_PACKAGE' }),
        update: expect.objectContaining({ deliveryMode: 'ALSO_PACKAGE' }),
      }),
    );
  });

  it('upserts to IN_APP_ONLY', async () => {
    const pref = { userId: 'u1', deliveryMode: 'IN_APP_ONLY', createdAt: new Date(), updatedAt: new Date() };
    mockPrisma.userPreference.upsert.mockResolvedValue(pref);

    const result = await service.updatePreferences('u1', { deliveryMode: 'IN_APP_ONLY' });
    expect(result.deliveryMode).toBe('IN_APP_ONLY');
  });
});
