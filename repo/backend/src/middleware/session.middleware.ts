import session from 'express-session';
import MySQLStoreFactory from 'express-mysql-session';
import { config } from '../config';

const MySQLStore = MySQLStoreFactory(session as any);

function parseConnectionUrl(url: string) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port, 10) || 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ''),
  };
}

const dbOptions = parseConnectionUrl(config.DATABASE_URL);

const sessionStore = new MySQLStore({
  host: dbOptions.host,
  port: dbOptions.port,
  user: dbOptions.user,
  password: dbOptions.password,
  database: dbOptions.database,
  clearExpired: true,
  checkExpirationInterval: 900000, // 15 minutes
  expiration: 1800000, // 30 minutes
  createDatabaseTable: true,
});

export const sessionMiddleware = session({
  secret: config.SESSION_SECRET,
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 60 * 1000, // 30 minutes
    httpOnly: true,
    sameSite: 'lax',
    secure: config.NODE_ENV === 'production',
  },
});
