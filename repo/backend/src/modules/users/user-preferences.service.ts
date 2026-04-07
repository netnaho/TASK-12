import { DeliveryMode } from '@prisma/client';
import { prisma } from '../../config/database';
import { logger } from '../../logging/logger';

export interface UpdatePreferencesInput {
  deliveryMode: DeliveryMode;
}

export class UserPreferencesService {
  /**
   * Get delivery preferences for a user.
   * Returns a default preference object (IN_APP_ONLY) if none is stored.
   */
  async getPreferences(userId: string) {
    const pref = await prisma.userPreference.findUnique({ where: { userId } });

    return pref ?? {
      userId,
      deliveryMode: 'IN_APP_ONLY' as DeliveryMode,
      createdAt: null,
      updatedAt: null,
    };
  }

  /**
   * Create or update delivery preferences for a user.
   *
   * deliveryMode:
   *  IN_APP_ONLY  — notifications appear only in the in-app inbox.
   *  ALSO_PACKAGE — in addition to in-app, an offline message package file
   *                 is generated immediately when a message is enqueued for
   *                 this user. The package can be downloaded and delivered
   *                 manually via email, SMS, or enterprise IM.
   */
  async updatePreferences(userId: string, input: UpdatePreferencesInput) {
    const pref = await prisma.userPreference.upsert({
      where: { userId },
      create: {
        userId,
        deliveryMode: input.deliveryMode,
      },
      update: {
        deliveryMode: input.deliveryMode,
      },
    });

    logger.info({ userId, deliveryMode: input.deliveryMode }, 'User preferences updated');
    return pref;
  }
}

export const userPreferencesService = new UserPreferencesService();
