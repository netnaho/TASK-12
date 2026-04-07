import { createApp } from './app';
import { env } from './config/env';
import { logger } from './logging/logger';
import { prisma } from './config/database';
import { startScheduler, stopScheduler } from './jobs/scheduler';

async function bootstrap(): Promise<void> {
  try {
    // Verify DB connectivity
    await prisma.$connect();
    logger.info('Database connected');

    const app = createApp();

    const server = app.listen(env.PORT, () => {
      logger.info(
        { port: env.PORT, env: env.NODE_ENV },
        'LeaseOps API server started',
      );
    });

    // Start cron jobs
    startScheduler();

    // Graceful shutdown
    const shutdown = async (signal: string): Promise<void> => {
      logger.info({ signal }, 'Shutdown signal received');

      stopScheduler();

      server.close(async () => {
        await prisma.$disconnect();
        logger.info('Server shut down cleanly');
        process.exit(0);
      });

      // Force exit after 10 s
      setTimeout(() => {
        logger.error('Forced shutdown — timeout exceeded');
        process.exit(1);
      }, 10_000).unref();
    };

    process.on('SIGTERM', () => void shutdown('SIGTERM'));
    process.on('SIGINT', () => void shutdown('SIGINT'));

    process.on('unhandledRejection', (reason) => {
      logger.error({ reason }, 'Unhandled promise rejection');
    });

    process.on('uncaughtException', (err) => {
      logger.fatal({ err }, 'Uncaught exception — shutting down');
      process.exit(1);
    });
  } catch (err) {
    logger.fatal({ err }, 'Failed to start server');
    process.exit(1);
  }
}

void bootstrap();
