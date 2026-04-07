import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),

  DATABASE_URL: z.string().url(),

  SESSION_SECRET: z.string().min(32),

  AES_ENCRYPTION_KEY: z
    .string()
    .length(64)
    .regex(/^[0-9a-fA-F]+$/, 'Must be 64 hex characters (32 bytes)'),

  CORS_ORIGIN: z.string().default('http://localhost:8080'),

  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().default(10),

  SESSION_INACTIVITY_MS: z.coerce.number().default(30 * 60 * 1000),

  // Set to 'true' only when serving over HTTPS. Keep 'false' for plain HTTP
  // (local Docker, LAN). Decoupled from NODE_ENV so production-mode Node.js
  // optimisations can be used without requiring HTTPS cookies.
  COOKIE_SECURE: z
    .string()
    .transform((v) => v === 'true')
    .default('false'),

  // ─── Feature flags ────────────────────────────────────────────────
  //
  // ANALYST_CAN_TRIGGER_RECALC
  //   The domain model grants METRIC_CALC_TRIGGER to the ANALYST role.
  //   Default: true (aligns the route with the domain model).
  //   Set to 'false' to restrict triggering to SYSTEM_ADMIN and LEASING_OPS_MANAGER only.
  ANALYST_CAN_TRIGGER_RECALC: z
    .string()
    .transform((v) => v === 'true')
    .default('true'),

  // ADA_STRICT_MODE
  //   Controls how the seat allocator handles unreleased accessible (ADA) seats.
  //   true (default, requirement-aligned): unreleased ADA seats are NEVER
  //     allocated to general registrations; the allocator returns null instead
  //     (no seat assigned). This honours the accessibility-reservation
  //     requirement that ADA seating is held unless explicitly released.
  //   false (legacy): unreleased ADA seats are used as a last resort when all
  //     non-accessible and explicitly released ADA seats are full. Retained
  //     as an opt-out for deployments that intentionally need the soft
  //     fallback — but this violates the accessibility requirement and should
  //     not be used in production.
  ADA_STRICT_MODE: z
    .string()
    .transform((v) => v === 'true')
    .default('true'),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.issues
      .map((i) => `  ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${formatted}`);
  }

  return result.data;
}

export const env = validateEnv();
