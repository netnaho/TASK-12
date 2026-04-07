import { logger } from '../logging/logger';

export abstract class BaseJob {
  abstract readonly name: string;
  abstract readonly cronExpression: string;

  async run(): Promise<void> {
    const start = Date.now();
    logger.info({ job: this.name }, 'Job started');
    try {
      await this.execute();
      logger.info({ job: this.name, durationMs: Date.now() - start }, 'Job completed');
    } catch (err) {
      logger.error({ job: this.name, err, durationMs: Date.now() - start }, 'Job failed');
    }
  }

  protected abstract execute(): Promise<void>;
}
