// Global test setup for vitest
// Sets default environment variables for unit / mocked-api tests. The
// Docker-driven integration container supplies its own DATABASE_URL (pointing
// at the test-db service) and should NOT be overridden here, otherwise
// Prisma will try to reach `localhost:3306` from inside the container and
// fail. Every variable below is set only when not already present.

function setDefault(name: string, value: string) {
  if (!process.env[name]) process.env[name] = value;
}

setDefault('NODE_ENV', 'test');
setDefault('DATABASE_URL', 'mysql://test:test@localhost:3306/testdb');
setDefault('SESSION_SECRET', 'test-session-secret-that-is-long-enough');
setDefault('AES_ENCRYPTION_KEY', 'a'.repeat(64));
setDefault('CORS_ORIGIN', 'http://localhost:5173');
setDefault('LOG_LEVEL', 'silent');
setDefault('PORT', '3000');
// Disable rate limiting in tests
setDefault('RATE_LIMIT_MAX', '10000');
setDefault('AUTH_RATE_LIMIT_MAX', '10000');
setDefault('RATE_LIMIT_WINDOW_MS', '900000');
