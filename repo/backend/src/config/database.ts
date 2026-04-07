import { PrismaClient } from '@prisma/client';
import { env } from './env';

const createPrismaClient = (): PrismaClient => {
  const logLevels: ('query' | 'info' | 'warn' | 'error')[] =
    env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'];

  return new PrismaClient({
    log: logLevels,
    errorFormat: 'minimal',
  });
};

declare global {
  var __prisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  env.NODE_ENV === 'production'
    ? createPrismaClient()
    : (globalThis.__prisma ?? (globalThis.__prisma = createPrismaClient()));

export async function connectDatabase(): Promise<void> {
  await prisma.$connect();
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}
