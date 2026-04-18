import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 30000,
    pool: 'forks',
    coverage: {
      provider: 'v8',
      // The `coverage/` directory is a bind-mount in Docker test runs, so
      // vitest cannot rmdir it between runs (EBUSY). Tell v8 to overwrite
      // files in-place instead.
      clean: false,
      cleanOnRerun: false,
      reporter: ['text', 'text-summary', 'lcov', 'json-summary'],
      include: ['src/**/*.ts'],
      exclude: [
        // Entry points and bootstrapping
        'src/server.ts',
        'src/app.ts',
        'src/index.ts',
        'src/**/*.d.ts',

        // Pure type/interface declarations (no executable code)
        'src/**/*.types.ts',
        'src/**/*.interface.ts',
        'src/**/interfaces.ts',
        'src/domain/**',
        'src/shared/types/**',

        // Infrastructure configuration (mocked in all tests)
        'src/config/**',

        // File exporters (require actual PDF/CSV/Excel generation libraries)
        'src/exports/**',
        'src/modules/analytics/exporters/**',

        // Background job schedulers and workers.
        // Exception: audit-retention-check is covered by security-hardening tests
        // because its non-destructive guarantee is part of the compliance proof.
        'src/jobs/base.job.ts',
        'src/jobs/scheduler.ts',
        'src/jobs/nightly-metric-recalc.job.ts',
        'src/jobs/report-generation.job.ts',
        'src/jobs/session-cleanup.job.ts',
        'src/jobs/message-retry.job.ts',

        // Repository pattern helpers
        'src/repositories/**',

        // Input validators (Zod schemas only, no executable logic)
        'src/validators/**',

        // Route definitions (just Express.Router calls, no logic)
        'src/**/*.routes.ts',

        // Schema definitions (just Zod object declarations)
        'src/**/*.schemas.ts',

        // Middleware that is purely pass-through or environment-specific
        'src/middleware/cors.middleware.ts',
        'src/middleware/helmet.middleware.ts',
        'src/middleware/morgan.middleware.ts',
        'src/middleware/rate-limit.middleware.ts',
        'src/middleware/request-id.middleware.ts',
        'src/middleware/not-found.middleware.ts',
        'src/middleware/error-handler.middleware.ts',
        'src/middleware/request-logger.middleware.ts',
        'src/middleware/session.middleware.ts',
        'src/middleware/notFound.ts',

        // Session/security infrastructure (cookie stores etc.)
        'src/security/session.ts',

        // HTTP status constants (just an enum/object)
        'src/shared/constants/http-status.constant.ts',
      ],
      thresholds: {
        global: {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
