// Global test setup for vitest
// Sets environment variables before any module loads

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'mysql://test:test@localhost:3306/testdb';
process.env.SESSION_SECRET = 'test-session-secret-that-is-long-enough';
process.env.AES_ENCRYPTION_KEY = 'a'.repeat(64);
process.env.CORS_ORIGIN = 'http://localhost:5173';
process.env.LOG_LEVEL = 'silent';
process.env.PORT = '3000';
// Disable rate limiting in tests
process.env.RATE_LIMIT_MAX = '10000';
process.env.AUTH_RATE_LIMIT_MAX = '10000';
process.env.RATE_LIMIT_WINDOW_MS = '900000';
