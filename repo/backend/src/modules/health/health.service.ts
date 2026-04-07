import { prisma } from '../../config/database';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    database: 'ok' | 'error';
  };
}

export async function getHealthStatus(): Promise<HealthStatus> {
  let dbStatus: 'ok' | 'error' = 'ok';

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = 'error';
  }

  const allOk = dbStatus === 'ok';

  return {
    status: allOk ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env['npm_package_version'] ?? '1.0.0',
    checks: { database: dbStatus },
  };
}

export function getLivenessStatus(): { status: 'alive'; uptime: number } {
  return { status: 'alive', uptime: process.uptime() };
}

export function getReadinessStatus(): { ready: boolean; uptime: number } {
  return { ready: true, uptime: process.uptime() };
}
