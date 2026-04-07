import { prisma } from '../config/database';
import { logger } from '../logging/logger';

/**
 * Session cleanup job. Runs every 15 minutes.
 * Removes expired app_sessions rows.
 * Note: express-mysql-session also runs its own cleanup via clearExpired option.
 * This job provides belt-and-suspenders guarantees on our application metadata table.
 */
export async function sessionCleanup(): Promise<void> {
  const now = new Date();
  logger.info('Session cleanup started');

  try {
    const result = await prisma.appSession.deleteMany({
      where: {
        expiresAt: { lt: now },
      },
    });

    logger.info({ deletedCount: result.count }, 'Session cleanup completed');
  } catch (error) {
    logger.error({ error }, 'Session cleanup failed');
    throw error;
  }
}
