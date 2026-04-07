import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { LoginBodySchema } from './auth.schemas';
import * as controller from './auth.controller';

export const authRoutes = Router();

// Public — rate-limited at the app.ts level via authRateLimiter
authRoutes.post(
  '/login',
  validate({ body: LoginBodySchema }),
  controller.login,
);

// Protected
authRoutes.get('/me', authenticate, controller.me);
authRoutes.post('/logout', authenticate, controller.logout);
authRoutes.post('/touch', authenticate, controller.touch);
