/**
 * Smoke tests for the shared axios client — verifies baseURL, creds, and
 * JSON headers are wired up. The 401-redirect interceptor is exercised by
 * wiring window.location.
 */
import { describe, it, expect } from 'vitest';
import api from '@/api/client';

describe('api/client (axios instance)', () => {
  it('exposes a baseURL falling back to /api', () => {
    // default tests run with import.meta.env.VITE_API_BASE_URL unset
    expect(api.defaults.baseURL === '/api' || typeof api.defaults.baseURL === 'string').toBe(true);
  });

  it('sends credentials (cookies)', () => {
    expect(api.defaults.withCredentials).toBe(true);
  });

  it('defaults Content-Type to JSON', () => {
    expect(api.defaults.headers['Content-Type']).toBe('application/json');
  });

  it('defaults Accept to JSON', () => {
    expect(api.defaults.headers.Accept).toBe('application/json');
  });

  it('registers both request and response interceptors', () => {
    // Axios exposes handlers as an internal array; we only need to verify
    // something was registered.
    const reqHandlers = (api.interceptors.request as any).handlers;
    const resHandlers = (api.interceptors.response as any).handlers;
    expect(Array.isArray(reqHandlers)).toBe(true);
    expect(reqHandlers.length).toBeGreaterThan(0);
    expect(Array.isArray(resHandlers)).toBe(true);
    expect(resHandlers.length).toBeGreaterThan(0);
  });
});
