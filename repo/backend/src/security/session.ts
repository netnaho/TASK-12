/**
 * Express session factory backed by MySQL.
 *
 * Session semantics:
 *   - Cookie name: leaseops.sid
 *   - httpOnly: true (JS cannot read the cookie → mitigates XSS token theft)
 *   - sameSite: 'strict' (cookie not sent on cross-origin requests → CSRF protection)
 *     'strict' is safe here because this is an internal tool, not a public site
 *     receiving third-party navigations.
 *   - secure: true only in production (HTTPS required for cookie transmission)
 *   - maxAge: 2× the inactivity timeout so the cookie outlives a single idle window;
 *     the server-side authenticate middleware enforces the real 30-min sliding timeout.
 *   - rolling: false — we manage activity updates ourselves in authenticate.
 *
 * CSRF strategy: Cookie-based auth with sameSite=strict means the browser never
 * sends the session cookie on cross-origin requests. Combined with the CORS origin
 * whitelist and the fact that all mutations use POST/PUT/PATCH/DELETE (never GET),
 * this provides defense-in-depth against CSRF without a separate token.
 *
 * Docker/LAN note: For local/LAN deployment where HTTPS may not be available,
 * secure=false is acceptable. The sameSite + httpOnly settings still protect
 * against XSS and most CSRF vectors.
 */
import session from 'express-session';
import MySQLStoreFactory from 'express-mysql-session';
import { env } from '../config/env';
import { SESSION_COOKIE_NAME } from '../config/constants';

function parseDatabaseUrl(url: string) {
  const u = new URL(url);
  return {
    host: u.hostname,
    port: u.port ? parseInt(u.port, 10) : 3306,
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.replace(/^\//, ''),
    connectionLimit: 5,
    clearExpired: true,
    checkExpirationInterval: 15 * 60 * 1000, // 15 min
    createDatabaseTable: true,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MySQLStore = MySQLStoreFactory(session as any);

export function buildSessionMiddleware() {
  const store = new MySQLStore(parseDatabaseUrl(env.DATABASE_URL));

  return session({
    name: SESSION_COOKIE_NAME,
    secret: env.SESSION_SECRET,
    store,
    resave: false,
    saveUninitialized: false,
    rolling: false,
    cookie: {
      httpOnly: true,
      secure: env.COOKIE_SECURE,
      sameSite: 'strict',
      maxAge: env.SESSION_INACTIVITY_MS * 2,
      path: '/',
    },
  });
}
