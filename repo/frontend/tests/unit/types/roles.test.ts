import { describe, it, expect } from 'vitest';
import { Role, roleLabels, roleColors } from '@/types/roles';

describe('types/roles', () => {
  it('Role enum maps to the canonical backend role names', () => {
    expect(Role.Admin).toBe('SYSTEM_ADMIN');
    expect(Role.Manager).toBe('LEASING_OPS_MANAGER');
    expect(Role.Proctor).toBe('TEST_PROCTOR');
    expect(Role.Analyst).toBe('ANALYST');
    expect(Role.User).toBe('STANDARD_USER');
  });

  it('every role has a human-readable label', () => {
    for (const r of Object.values(Role)) {
      expect(roleLabels[r as Role]).toBeTruthy();
    }
  });

  it('every role has a color class string', () => {
    for (const r of Object.values(Role)) {
      expect(roleColors[r as Role]).toMatch(/bg-\w+-100/);
      expect(roleColors[r as Role]).toMatch(/text-\w+-800/);
    }
  });
});
