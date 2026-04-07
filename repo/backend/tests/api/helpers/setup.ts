import { vi } from 'vitest';
import request from 'supertest';
import type { Application } from 'express';
import type { Response } from 'supertest';

// ---------------------------------------------------------------------------
// Hoisted helpers for use inside vi.mock factories
// ---------------------------------------------------------------------------

const { createMockModel, mockPrismaObj, mockLoggerObj } = vi.hoisted(() => {
  const _fn = () => vi.fn();
  function createMockModel() {
    return {
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
      groupBy: vi.fn(),
    };
  }

  const mockPrismaObj: any = {
    user: createMockModel(),
    role: createMockModel(),
    userRole: createMockModel(),
    rolePermission: createMockModel(),
    region: createMockModel(),
    community: createMockModel(),
    property: createMockModel(),
    listing: createMockModel(),
    metricDefinition: createMockModel(),
    metricFormulaVersion: createMockModel(),
    metricValue: createMockModel(),
    metricCalculationJob: createMockModel(),
    testSite: createMockModel(),
    testRoom: createMockModel(),
    seat: createMockModel(),
    seatEquipment: createMockModel(),
    testSession: createMockModel(),
    testRegistration: createMockModel(),
    seatAllocation: createMockModel(),
    notification: createMockModel(),
    notificationTemplate: createMockModel(),
    reportDefinition: createMockModel(),
    report: createMockModel(),
    reportShare: createMockModel(),
    reportExport: createMockModel(),
    outboundMessage: createMockModel(),
    deliveryAttempt: createMockModel(),
    messageBlacklist: createMockModel(),
    quietHoursConfig: createMockModel(),
    auditLog: createMockModel(),
    savedView: createMockModel(),
    reportScheduleExecution: createMockModel(),
    userPreference: createMockModel(),
    $transaction: vi.fn((fn: any) => {
      if (typeof fn === 'function') {
        return fn(mockPrismaObj);
      }
      return Promise.resolve(fn);
    }),
    $connect: vi.fn(),
    $disconnect: vi.fn(),
    $on: vi.fn(),
    $queryRaw: vi.fn(),
  };

  const mockLoggerObj = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
    fatal: vi.fn(),
    child: vi.fn().mockReturnThis(),
  };

  return { createMockModel, mockPrismaObj, mockLoggerObj };
});

export const mockPrisma = mockPrismaObj;

// ---------------------------------------------------------------------------
// Mock Prisma, session store, and logger
// ---------------------------------------------------------------------------

vi.mock('../../../src/config/database', () => ({
  prisma: mockPrismaObj,
}));

vi.mock('../../../src/security/session', async () => {
  const sessionMod = await vi.importActual<any>('express-session');
  const sessionFn = sessionMod.default ?? sessionMod;
  return {
    buildSessionMiddleware: () => (sessionFn as any)({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false,
    }),
  };
});

vi.mock('../../../src/logging/logger', () => ({
  logger: mockLoggerObj,
}));

// ---------------------------------------------------------------------------
// Hoisted service mocks
// ---------------------------------------------------------------------------

const {
  mockAuthServiceObj,
  mockUsersServiceObj,
  mockCommunitiesServiceObj,
  mockListingsServiceObj,
  mockTestCenterServiceObj,
  mockNotificationsServiceObj,
  mockMetricsServiceObj,
  mockAnalyticsServiceObj,
  mockOperationalAnalyticsServiceObj,
  mockSavedViewsServiceObj,
  mockScheduleExecutionsServiceObj,
  mockMessagingServiceObj,
  mockAuditServiceObj,
  mockUserPreferencesServiceObj,
} = vi.hoisted(() => ({
  mockAuthServiceObj: {
    login: vi.fn(),
    getCurrentUser: vi.fn(),
    logout: vi.fn(),
  },
  mockUsersServiceObj: {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    assignRole: vi.fn(),
    removeRole: vi.fn(),
    deactivate: vi.fn(),
  },
  mockCommunitiesServiceObj: {
    createRegion: vi.fn(),
    listRegions: vi.fn(),
    getRegion: vi.fn(),
    updateRegion: vi.fn(),
    deleteRegion: vi.fn(),
    createCommunity: vi.fn(),
    listCommunities: vi.fn(),
    getCommunity: vi.fn(),
    updateCommunity: vi.fn(),
    deleteCommunity: vi.fn(),
    createProperty: vi.fn(),
    listProperties: vi.fn(),
    getProperty: vi.fn(),
    updateProperty: vi.fn(),
  },
  mockListingsServiceObj: {
    create: vi.fn(),
    findAll: vi.fn(),
    findById: vi.fn(),
    update: vi.fn(),
    getListingStats: vi.fn(),
  },
  mockTestCenterServiceObj: {
    listSites: vi.fn(),
    createSite: vi.fn(),
    getSite: vi.fn(),
    updateSite: vi.fn(),
    deleteSite: vi.fn(),
    listRooms: vi.fn(),
    createRoom: vi.fn(),
    getRoomWithSeats: vi.fn(),
    updateRoom: vi.fn(),
    deleteRoom: vi.fn(),
    listSeatsByRoom: vi.fn(),
    createSeat: vi.fn(),
    updateSeat: vi.fn(),
    deleteSeat: vi.fn(),
    listEquipmentBySeat: vi.fn(),
    createEquipment: vi.fn(),
    getEquipment: vi.fn(),
    updateEquipment: vi.fn(),
    deleteEquipment: vi.fn(),
    listSessions: vi.fn(),
    createSession: vi.fn(),
    getSession: vi.fn(),
    cancelSession: vi.fn(),
    registerForSession: vi.fn(),
    cancelRegistration: vi.fn(),
    cancelRegistrationById: vi.fn(),
    getRoomUtilization: vi.fn(),
    getSiteUtilization: vi.fn(),
  },
  mockNotificationsServiceObj: {
    listForUser: vi.fn(),
    getUnreadCount: vi.fn(),
    markRead: vi.fn(),
    markAllRead: vi.fn(),
    snooze: vi.fn(),
    dismiss: vi.fn(),
    listTemplates: vi.fn(),
    createTemplate: vi.fn(),
    getTemplate: vi.fn(),
    updateTemplate: vi.fn(),
    deleteTemplate: vi.fn(),
    previewTemplate: vi.fn(),
  },
  mockMetricsServiceObj: {
    listDefinitions: vi.fn(),
    getDefinition: vi.fn(),
    createDefinition: vi.fn(),
    createVersion: vi.fn(),
    getMetricValues: vi.fn(),
    triggerRecalculation: vi.fn(),
    listJobs: vi.fn(),
  },
  mockAnalyticsServiceObj: {
    listDefinitions: vi.fn(),
    getDefinition: vi.fn(),
    createDefinition: vi.fn(),
    updateDefinition: vi.fn(),
    deleteDefinition: vi.fn(),
    generateReport: vi.fn(),
    listReports: vi.fn(),
    getReport: vi.fn(),
    archiveReport: vi.fn(),
    publishReport: vi.fn(),
    shareReport: vi.fn(),
    revokeShare: vi.fn(),
    listShares: vi.fn(),
    requestExport: vi.fn(),
    downloadExport: vi.fn(),
    pivotQuery: vi.fn(),
    listSchedules: vi.fn(),
  },
  mockOperationalAnalyticsServiceObj: {
    getParticipation: vi.fn(),
    getAttendance: vi.fn(),
    getHourDistribution: vi.fn(),
    getRetention: vi.fn(),
    getStaffingGaps: vi.fn(),
    getEventPopularity: vi.fn(),
    getRankings: vi.fn(),
  },
  mockSavedViewsServiceObj: {
    listSavedViews: vi.fn(),
    getSavedView: vi.fn(),
    createSavedView: vi.fn(),
    updateSavedView: vi.fn(),
    deleteSavedView: vi.fn(),
  },
  mockScheduleExecutionsServiceObj: {
    runWithExecutionLog: vi.fn(),
    listExecutions: vi.fn(),
  },
  mockMessagingServiceObj: {
    enqueueMessage: vi.fn(),
    listMessages: vi.fn(),
    getMessageStatus: vi.fn(),
    updateDeliveryStatus: vi.fn(),
    getFailureAlerts: vi.fn(),
    generatePackage: vi.fn(),
    addToBlacklist: vi.fn(),
    listBlacklist: vi.fn(),
    removeFromBlacklist: vi.fn(),
    getQuietHoursConfig: vi.fn(),
    updateQuietHoursConfig: vi.fn(),
  },
  mockAuditServiceObj: {
    list: vi.fn(),
    getById: vi.fn(),
  },
  mockUserPreferencesServiceObj: {
    getPreferences: vi.fn(),
    updatePreferences: vi.fn(),
  },
}));

export const mockAuthService = mockAuthServiceObj;
export const mockUsersService = mockUsersServiceObj;
export const mockCommunitiesService = mockCommunitiesServiceObj;
export const mockListingsService = mockListingsServiceObj;
export const mockTestCenterService = mockTestCenterServiceObj;
export const mockNotificationsService = mockNotificationsServiceObj;
export const mockMetricsService = mockMetricsServiceObj;
export const mockAnalyticsService = mockAnalyticsServiceObj;
export const mockOperationalAnalyticsService = mockOperationalAnalyticsServiceObj;
export const mockSavedViewsService = mockSavedViewsServiceObj;
export const mockScheduleExecutionsService = mockScheduleExecutionsServiceObj;
export const mockMessagingService = mockMessagingServiceObj;
export const mockAuditService = mockAuditServiceObj;
export const mockUserPreferencesService = mockUserPreferencesServiceObj;

// ---------------------------------------------------------------------------
// Service vi.mock registrations
// ---------------------------------------------------------------------------

vi.mock('../../../src/modules/auth/auth.service', () => ({
  authService: mockAuthServiceObj,
  AuthService: vi.fn().mockImplementation(() => mockAuthServiceObj),
}));

vi.mock('../../../src/modules/users/users.service', () => ({
  usersService: mockUsersServiceObj,
  UsersService: vi.fn().mockImplementation(() => mockUsersServiceObj),
}));

vi.mock('../../../src/modules/communities/communities.service', () => ({
  communitiesService: mockCommunitiesServiceObj,
  CommunitiesService: vi.fn().mockImplementation(() => mockCommunitiesServiceObj),
}));

vi.mock('../../../src/modules/listings/listings.service', () => ({
  listingsService: mockListingsServiceObj,
  ListingsService: vi.fn().mockImplementation(() => mockListingsServiceObj),
}));

vi.mock('../../../src/modules/test-center/test-center.service', () => ({
  testCenterService: mockTestCenterServiceObj,
  TestCenterService: vi.fn().mockImplementation(() => mockTestCenterServiceObj),
}));

vi.mock('../../../src/modules/notifications/notifications.service', () => ({
  notificationsService: mockNotificationsServiceObj,
  NotificationsService: vi.fn().mockImplementation(() => mockNotificationsServiceObj),
}));

vi.mock('../../../src/modules/metrics/metrics.service', () => ({
  metricsService: mockMetricsServiceObj,
  MetricsService: vi.fn().mockImplementation(() => mockMetricsServiceObj),
}));

vi.mock('../../../src/modules/analytics/analytics.service', () => ({
  analyticsService: mockAnalyticsServiceObj,
  AnalyticsService: vi.fn().mockImplementation(() => mockAnalyticsServiceObj),
}));

vi.mock('../../../src/modules/analytics/operational-analytics.service', () => ({
  operationalAnalyticsService: mockOperationalAnalyticsServiceObj,
}));

vi.mock('../../../src/modules/analytics/saved-views.service', () => ({
  savedViewsService: mockSavedViewsServiceObj,
}));

vi.mock('../../../src/modules/analytics/schedule-executions.service', () => ({
  scheduleExecutionsService: mockScheduleExecutionsServiceObj,
}));

vi.mock('../../../src/modules/messaging/messaging.service', () => ({
  messagingService: mockMessagingServiceObj,
  MessagingService: vi.fn().mockImplementation(() => mockMessagingServiceObj),
}));

vi.mock('../../../src/modules/audit/audit.service', () => ({
  auditService: mockAuditServiceObj,
  AuditService: vi.fn().mockImplementation(() => mockAuditServiceObj),
}));

vi.mock('../../../src/modules/users/user-preferences.service', () => ({
  userPreferencesService: mockUserPreferencesServiceObj,
  UserPreferencesService: vi.fn().mockImplementation(() => mockUserPreferencesServiceObj),
}));

// ---------------------------------------------------------------------------
// App import -- vi.mock calls above are hoisted by vitest, so this import
// will already see the mocked modules.
// ---------------------------------------------------------------------------

import { createApp } from '../../../src/app';

const appInstance = createApp();

export function getApp(): Application {
  return appInstance;
}

export function createAgent() {
  return request(getApp());
}

// ---------------------------------------------------------------------------
// Auth helpers -- simulate logged-in sessions
// ---------------------------------------------------------------------------

const ROLE_CREDENTIALS: Record<string, { username: string; roles: string[] }> = {
  SYSTEM_ADMIN: { username: 'admin', roles: ['SYSTEM_ADMIN'] },
  LEASING_OPS_MANAGER: { username: 'manager', roles: ['LEASING_OPS_MANAGER'] },
  TEST_PROCTOR: { username: 'proctor', roles: ['TEST_PROCTOR'] },
  ANALYST: { username: 'analyst', roles: ['ANALYST'] },
  STANDARD_USER: { username: 'agent', roles: ['STANDARD_USER'] },
};

/**
 * Returns a supertest agent with an active session for the given role.
 *
 * Uses the mock auth service for the login call AND mocks
 * prisma.user.findUnique so that the DB-refreshed `authenticate` middleware
 * sees an active user with the right roles on every subsequent request.
 *
 * This intentionally does NOT short-circuit the auth middleware: each request
 * still hits the (mocked) prisma.user.findUnique, which is what would catch a
 * deactivated user in production. Tests can override the mock between requests
 * to simulate role revocation or deactivation.
 */
export async function loginAs(role: string): Promise<request.Agent> {
  const creds = ROLE_CREDENTIALS[role];
  if (!creds) throw new Error(`Unknown role: ${role}`);

  const userId = `user-${creds.username}-id`;

  // Configure mock to return a user for the login service call
  mockAuthService.login.mockResolvedValueOnce({
    id: userId,
    username: creds.username,
    displayName: creds.username,
    email: `${creds.username}@test.com`,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    roles: creds.roles.map((r) => ({ id: `role-${r}`, name: r, description: r })),
    permissions: [],
  });

  // Configure mock prisma so that requireAuth (DB-refresh) sees an active
  // user with the right roles on every request after login.
  const dbUserShape = {
    id: userId,
    username: creds.username,
    displayName: creds.username,
    email: `${creds.username}@test.com`,
    roles: creds.roles.map((r) => ({
      role: {
        name: r,
        permissions: [],
      },
    })),
  };
  mockPrismaObj.user.findUnique.mockImplementation(({ where }: any) => {
    if (where?.id === userId && (where.isActive === undefined || where.isActive === true)) {
      return Promise.resolve(dbUserShape);
    }
    return Promise.resolve(null);
  });

  const agent = request.agent(getApp());

  await agent
    .post('/api/v1/auth/login')
    .send({ username: creds.username, password: 'Password123!' });

  return agent;
}

// ---------------------------------------------------------------------------
// Assertion helpers
// ---------------------------------------------------------------------------

export function assertSuccess(res: Response, statusCode = 200) {
  expect(res.status).toBe(statusCode);
  expect(res.body).toHaveProperty('success', true);
  expect(res.body).toHaveProperty('data');
}

export function assertError(res: Response, statusCode: number, code?: string) {
  expect(res.status).toBe(statusCode);
  expect(res.body).toHaveProperty('success', false);
  expect(res.body).toHaveProperty('error');
  if (code) {
    expect(res.body.error.code).toBe(code);
  }
}

export function assertPaginated(res: Response, statusCode = 200) {
  expect(res.status).toBe(statusCode);
  expect(res.body).toHaveProperty('success', true);
  expect(res.body).toHaveProperty('data');
  expect(res.body).toHaveProperty('meta');
  expect(res.body.meta).toHaveProperty('page');
  expect(res.body.meta).toHaveProperty('pageSize');
  expect(res.body.meta).toHaveProperty('total');
  expect(res.body.meta).toHaveProperty('totalPages');
}
