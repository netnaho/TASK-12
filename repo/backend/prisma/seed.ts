/**
 * LeaseOps Insight & Assessment — Database Seed
 *
 * Idempotent: uses upsert throughout. Safe to run multiple times.
 * Seeding order respects FK constraints.
 */
import { PrismaClient, RoleName, MetricType, NotificationChannel, ReportFrequency } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = 12;
const DEFAULT_PASSWORD = 'Password123!';

// ══════════════════════════════════════════════════════════════════════════════
// RBAC DEFINITIONS
// ══════════════════════════════════════════════════════════════════════════════

const ROLES: { name: RoleName; description: string }[] = [
  {
    name: 'SYSTEM_ADMIN',
    description: 'Full system access. Manages users, roles, permissions, and all platform resources.',
  },
  {
    name: 'LEASING_OPS_MANAGER',
    description: 'Manages properties, listings, metric definitions, and analytics reports for leasing operations.',
  },
  {
    name: 'TEST_PROCTOR',
    description: 'Manages test sites, sessions, seat allocations, and on-site assessment logistics.',
  },
  {
    name: 'ANALYST',
    description: 'Read-only access to properties and listings. Can trigger metric calculations and build reports.',
  },
  {
    name: 'STANDARD_USER',
    description: 'Basic access: view properties, manage own listings, register for sessions, view shared reports.',
  },
];

const PERMISSIONS: { resource: string; action: string; description: string }[] = [
  // user
  { resource: 'user', action: 'create',      description: 'Create new user accounts' },
  { resource: 'user', action: 'read',         description: 'View user profiles' },
  { resource: 'user', action: 'update',       description: 'Update user information' },
  { resource: 'user', action: 'deactivate',   description: 'Deactivate user accounts' },
  { resource: 'user', action: 'assign_role',  description: 'Assign or remove roles from users' },
  // property
  { resource: 'property', action: 'create',   description: 'Create new properties' },
  { resource: 'property', action: 'read',     description: 'View property details' },
  { resource: 'property', action: 'update',   description: 'Update property information' },
  // listing
  { resource: 'listing', action: 'create',    description: 'Create new listings' },
  { resource: 'listing', action: 'read',      description: 'View listing details' },
  { resource: 'listing', action: 'update',    description: 'Update listing information' },
  // metric_definition
  { resource: 'metric_definition', action: 'create',  description: 'Create metric definitions and versions' },
  { resource: 'metric_definition', action: 'read',    description: 'View metric definitions and versions' },
  { resource: 'metric_definition', action: 'update',  description: 'Update unlocked metric definition versions' },
  // metric_calc
  { resource: 'metric_calc', action: 'trigger',  description: 'Trigger metric recalculation jobs' },
  { resource: 'metric_calc', action: 'read',     description: 'View metric calculation results and job history' },
  // test_site
  { resource: 'test_site', action: 'create',  description: 'Create test sites and rooms' },
  { resource: 'test_site', action: 'read',    description: 'View test site details' },
  { resource: 'test_site', action: 'update',  description: 'Update test site information' },
  // test_session
  { resource: 'test_session', action: 'create',   description: 'Create test sessions' },
  { resource: 'test_session', action: 'read',     description: 'View test session details' },
  { resource: 'test_session', action: 'update',   description: 'Update test sessions' },
  { resource: 'test_session', action: 'cancel',   description: 'Cancel test sessions' },
  { resource: 'test_session', action: 'register', description: 'Register for a test session' },
  // seat_allocation
  { resource: 'seat_allocation', action: 'create',  description: 'Create seat allocations' },
  { resource: 'seat_allocation', action: 'read',    description: 'View seat allocations' },
  { resource: 'seat_allocation', action: 'update',  description: 'Reassign or update seat allocations' },
  { resource: 'seat_allocation', action: 'release_ada', description: 'Release ADA seats for general use' },
  // report
  { resource: 'report', action: 'create',  description: 'Create and generate reports' },
  { resource: 'report', action: 'read',    description: 'View reports (own or shared)' },
  { resource: 'report', action: 'share',   description: 'Share reports with other users' },
  { resource: 'report', action: 'export',  description: 'Export reports to CSV / Excel / PDF' },
  { resource: 'report', action: 'archive', description: 'Archive reports' },
  // notification
  { resource: 'notification', action: 'read',             description: 'View own notifications' },
  { resource: 'notification', action: 'manage_templates', description: 'Create and update notification templates' },
  // message
  { resource: 'message', action: 'read',          description: 'View outbound message queue' },
  { resource: 'message', action: 'view_failures', description: 'View message delivery failures' },
  // blacklist
  { resource: 'blacklist', action: 'create', description: 'Add addresses to the message blacklist' },
  { resource: 'blacklist', action: 'read',   description: 'View the message blacklist' },
  { resource: 'blacklist', action: 'delete', description: 'Remove addresses from the blacklist' },
  // audit_log
  { resource: 'audit_log', action: 'read',  description: 'View audit logs' },
];

const p = (resource: string, action: string) => `${resource}:${action}`;

const ROLE_PERMISSIONS: Record<RoleName, string[]> = {
  SYSTEM_ADMIN: PERMISSIONS.map((perm) => p(perm.resource, perm.action)), // ALL

  LEASING_OPS_MANAGER: [
    p('property', 'create'),  p('property', 'read'),  p('property', 'update'),
    p('listing', 'create'),   p('listing', 'read'),   p('listing', 'update'),
    p('metric_definition', 'create'), p('metric_definition', 'read'), p('metric_definition', 'update'),
    p('metric_calc', 'trigger'), p('metric_calc', 'read'),
    p('report', 'create'),  p('report', 'read'),  p('report', 'share'),
    p('report', 'export'),  p('report', 'archive'),
    p('notification', 'read'),
  ],

  TEST_PROCTOR: [
    p('test_site', 'create'),    p('test_site', 'read'),    p('test_site', 'update'),
    p('test_session', 'create'), p('test_session', 'read'), p('test_session', 'update'),
    p('test_session', 'cancel'), p('test_session', 'register'),
    p('seat_allocation', 'create'), p('seat_allocation', 'read'),
    p('seat_allocation', 'update'), p('seat_allocation', 'release_ada'),
    p('notification', 'read'),
  ],

  ANALYST: [
    p('property', 'read'),
    p('listing', 'read'),
    p('metric_definition', 'read'),
    p('metric_calc', 'trigger'), p('metric_calc', 'read'),
    p('report', 'create'), p('report', 'read'), p('report', 'export'),
    p('notification', 'read'),
  ],

  STANDARD_USER: [
    p('property', 'read'),
    p('listing', 'create'), p('listing', 'read'), p('listing', 'update'),
    p('test_session', 'read'), p('test_session', 'register'),
    p('seat_allocation', 'read'),
    p('report', 'read'),
    p('notification', 'read'),
  ],
};

// ══════════════════════════════════════════════════════════════════════════════
// DEFAULT USERS (password: Password123!)
// ══════════════════════════════════════════════════════════════════════════════

const DEFAULT_USERS: {
  username: string;
  email: string;
  displayName: string;
  role: RoleName;
}[] = [
  { username: 'admin',   email: 'admin@leaseops.local',   displayName: 'System Administrator', role: 'SYSTEM_ADMIN' },
  { username: 'manager', email: 'manager@leaseops.local', displayName: 'Operations Manager',   role: 'LEASING_OPS_MANAGER' },
  { username: 'proctor', email: 'proctor@leaseops.local', displayName: 'Test Proctor',          role: 'TEST_PROCTOR' },
  { username: 'analyst', email: 'analyst@leaseops.local', displayName: 'Data Analyst',          role: 'ANALYST' },
  { username: 'agent',   email: 'agent@leaseops.local',   displayName: 'Leasing Agent',         role: 'STANDARD_USER' },
];

// ══════════════════════════════════════════════════════════════════════════════
// PROPERTY DATA
// ══════════════════════════════════════════════════════════════════════════════

const REGIONS = [
  { name: 'Pacific Northwest' },
  { name: 'Southeast' },
  { name: 'Southwest' },
];

const COMMUNITIES: { name: string; regionName: string }[] = [
  { name: 'Emerald Heights',    regionName: 'Pacific Northwest' },
  { name: 'Cedar Ridge',        regionName: 'Pacific Northwest' },
  { name: 'Magnolia Park',      regionName: 'Southeast' },
  { name: 'Palmetto Crossing',  regionName: 'Southeast' },
  { name: 'Desert Bloom',       regionName: 'Southwest' },
];

interface PropertySeed {
  name: string; community: string;
  address: string; city: string; state: string; postalCode: string;
  lat: number; lng: number; units: number;
}

const PROPERTIES: PropertySeed[] = [
  { name: 'Emerald Tower A',  community: 'Emerald Heights',   address: '100 Pine St',        city: 'Seattle',     state: 'WA', postalCode: '98101', lat: 47.6062, lng: -122.3321, units: 120 },
  { name: 'Emerald Tower B',  community: 'Emerald Heights',   address: '110 Pine St',        city: 'Seattle',     state: 'WA', postalCode: '98101', lat: 47.6065, lng: -122.3325, units: 95  },
  { name: 'Cedar Lodge',      community: 'Cedar Ridge',       address: '250 Elm Ave',        city: 'Portland',    state: 'OR', postalCode: '97201', lat: 45.5152, lng: -122.6784, units: 80  },
  { name: 'Magnolia Suites',  community: 'Magnolia Park',     address: '500 Peachtree Rd',   city: 'Atlanta',     state: 'GA', postalCode: '30301', lat: 33.7490, lng:  -84.3880, units: 200 },
  { name: 'Palmetto Villas',  community: 'Palmetto Crossing', address: '800 Bay Dr',         city: 'Charleston',  state: 'SC', postalCode: '29401', lat: 32.7765, lng:  -79.9311, units: 64  },
  { name: 'Palmetto Gardens', community: 'Palmetto Crossing', address: '820 Bay Dr',         city: 'Charleston',  state: 'SC', postalCode: '29401', lat: 32.7770, lng:  -79.9305, units: 48  },
  { name: 'Saguaro Flats',    community: 'Desert Bloom',      address: '3200 Cactus Blvd',   city: 'Phoenix',     state: 'AZ', postalCode: '85001', lat: 33.4484, lng: -112.0740, units: 150 },
];

interface ListingSeed {
  unitNumber: string; bedrooms: number; bathrooms: number; sqft: number; rent: number;
}

const LISTING_TEMPLATES: ListingSeed[] = [
  { unitNumber: '101', bedrooms: 1, bathrooms: 1.0, sqft: 650,  rent: 1450 },
  { unitNumber: '205', bedrooms: 2, bathrooms: 1.0, sqft: 900,  rent: 1950 },
  { unitNumber: '310', bedrooms: 2, bathrooms: 2.0, sqft: 1100, rent: 2350 },
  { unitNumber: '402', bedrooms: 3, bathrooms: 2.0, sqft: 1400, rent: 2900 },
  { unitNumber: '501', bedrooms: 1, bathrooms: 1.0, sqft: 700,  rent: 1550 },
  { unitNumber: '603', bedrooms: 2, bathrooms: 1.5, sqft: 950,  rent: 2050 },
];

// ══════════════════════════════════════════════════════════════════════════════
// METRIC DEFINITIONS
// ══════════════════════════════════════════════════════════════════════════════

interface MetricDefSeed {
  type: MetricType;
  name: string;
  description: string;
  formula: object;
  notes: string;
}

const METRIC_DEFINITIONS: MetricDefSeed[] = [
  {
    type: 'UNIT_RENT',
    name: 'Unit Rent',
    description: 'Current monthly rent for a unit at the latest listed price.',
    formula: { method: 'latest_value', field: 'rent_price' },
    notes: 'v1 — baseline implementation',
  },
  {
    type: 'PRICE_CHANGE_PCT',
    name: 'Price Change %',
    description: 'Percentage change in rent_price over the trailing 30 days.',
    formula: { method: 'percentage_change', field: 'rent_price', periodDays: 30 },
    notes: 'v1 — baseline implementation',
  },
  {
    type: 'VOLATILITY_30D',
    name: '30-Day Price Volatility',
    description: 'Annualised standard deviation of daily rent changes over 30 days.',
    formula: { method: 'std_deviation', field: 'rent_price', windowDays: 30, annualise: true },
    notes: 'v1 — baseline implementation',
  },
  {
    type: 'VACANCY_DAYS_ON_MARKET',
    name: 'Vacancy Days on Market',
    description: 'Average calendar days a vacant unit remains on market before being leased.',
    formula: { method: 'avg_days', startField: 'listed_at', endField: 'leased_at', nullStrategy: 'use_now' },
    notes: 'v1 — uses current date for unleasedunits',
  },
  {
    type: 'LISTING_DURATION_DOM',
    name: 'Listing Duration (DOM)',
    description: 'Days on market for currently active listings.',
    formula: { method: 'days_since', field: 'listed_at', filterActive: true },
    notes: 'v1 — point-in-time snapshot',
  },
  {
    type: 'SUPPLY_DEMAND_RATIO',
    name: 'Supply / Demand Ratio',
    description: 'Ratio of currently active listings to qualified applications in the trailing 30 days.',
    formula: { method: 'ratio', numerator: 'active_listings_count', denominator: 'applications_30d', defaultDenominator: 1 },
    notes: 'v1 — denominator defaults to 1 when no application data available',
  },
];

// ══════════════════════════════════════════════════════════════════════════════
// TEST CENTER
// ══════════════════════════════════════════════════════════════════════════════

interface RoomSeed {
  siteName: string; name: string; capacity: number; hasAda: boolean;
}

const TEST_SITES = [
  { name: 'Downtown Assessment Centre', address: '1200 Main St Suite 300, Seattle, WA 98101',    timezone: 'America/Los_Angeles' },
  { name: 'Midtown Testing Facility',   address: '350 Peachtree Center Ave NE, Atlanta, GA 30303', timezone: 'America/New_York'    },
  { name: 'Desert Tech Centre',         address: '100 N Central Ave Floor 5, Phoenix, AZ 85004',  timezone: 'America/Phoenix'     },
];

const TEST_ROOMS: RoomSeed[] = [
  { siteName: 'Downtown Assessment Centre', name: 'Room A',  capacity: 30, hasAda: true  },
  { siteName: 'Downtown Assessment Centre', name: 'Room B',  capacity: 20, hasAda: false },
  { siteName: 'Midtown Testing Facility',   name: 'Lab 1',   capacity: 25, hasAda: true  },
  { siteName: 'Midtown Testing Facility',   name: 'Lab 2',   capacity: 15, hasAda: false },
  { siteName: 'Desert Tech Centre',         name: 'Suite 1', capacity: 20, hasAda: true  },
];

// ══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION TEMPLATES
// ══════════════════════════════════════════════════════════════════════════════

interface TemplateSeed {
  slug: string; name: string; channel: NotificationChannel;
  subjectTpl: string; bodyTpl: string;
}

const NOTIFICATION_TEMPLATES: TemplateSeed[] = [
  {
    slug: 'session_reminder',
    name: 'Test Session Reminder',
    channel: 'EMAIL',
    subjectTpl: 'Reminder: Your session "{{sessionName}}" is in {{hoursUntil}} hours',
    bodyTpl:
      'Hello {{displayName}},\n\n' +
      'This is a reminder that your test session "{{sessionName}}" is scheduled for {{scheduledStart}}.\n\n' +
      'Location: {{siteName}} — {{roomName}}\nSeat: {{seatLabel}}\n\n' +
      'Please arrive at least {{setupBufferMin}} minutes early.\n\n' +
      'LeaseOps Team',
  },
  {
    slug: 'report_ready',
    name: 'Report Ready',
    channel: 'IN_APP',
    subjectTpl: 'Your report "{{reportName}}" is ready',
    bodyTpl:
      'Hello {{displayName}},\n\n' +
      'Your report "{{reportName}}" covering {{periodStart}} to {{periodEnd}} has been generated.\n\n' +
      'Open the Reports section to view or export it.\n\n' +
      'LeaseOps Team',
  },
  {
    slug: 'report_shared',
    name: 'Report Shared With You',
    channel: 'IN_APP',
    subjectTpl: '{{sharerName}} shared a report with you',
    bodyTpl:
      'Hello {{displayName}},\n\n' +
      '{{sharerName}} has shared the report "{{reportName}}" with you.\n\n' +
      'You can find it in your Reports section.\n\n' +
      'LeaseOps Team',
  },
  {
    slug: 'task_overdue',
    name: 'Task Overdue Alert',
    channel: 'IN_APP',
    subjectTpl: 'Overdue: {{taskDescription}}',
    bodyTpl:
      'Hello {{displayName}},\n\n' +
      'The following task is now overdue:\n{{taskDescription}}\nDue: {{dueDate}}\n\n' +
      'Please take action as soon as possible.\n\nLeaseOps Team',
  },
  {
    slug: 'metric_calc_failed',
    name: 'Metric Calculation Failed',
    channel: 'EMAIL',
    subjectTpl: 'ALERT: Metric calculation job {{jobId}} failed',
    bodyTpl:
      'Hello {{displayName}},\n\n' +
      'Metric calculation job {{jobId}} triggered by {{triggeredBy}} has failed.\n\n' +
      'Error: {{errorMessage}}\n\nPlease review the job logs.\n\nLeaseOps Team',
  },
  {
    slug: 'session_capacity_full',
    name: 'Session At Capacity',
    channel: 'IN_APP',
    subjectTpl: 'Session "{{sessionName}}" is now full',
    bodyTpl:
      'Hello {{displayName}},\n\n' +
      'The test session "{{sessionName}}" scheduled for {{scheduledStart}} has reached maximum capacity.\n\n' +
      'LeaseOps Team',
  },
  {
    slug: 'message_delivery_failure',
    name: 'Message Delivery Failure Alert',
    channel: 'IN_APP',
    subjectTpl: 'Message delivery failed after 3 retries',
    bodyTpl:
      'Hello {{displayName}},\n\n' +
      'Outbound message {{messageId}} to {{recipientAddr}} via {{channel}} has permanently failed after 3 retries.\n\n' +
      'Last error: {{failureReason}}\n\nLeaseOps Team',
  },
];

// ══════════════════════════════════════════════════════════════════════════════
// SAMPLE REPORT DEFINITIONS
// ══════════════════════════════════════════════════════════════════════════════

interface ReportDefSeed {
  name: string; description: string; frequency: ReportFrequency; filterJson: object;
}

const REPORT_DEFINITIONS: ReportDefSeed[] = [
  {
    name: 'Daily Market Pulse',
    description: 'Daily snapshot of unit rents, vacancy, and price changes across all active properties.',
    frequency: 'DAILY',
    filterJson: { propertyStatus: 'active', metrics: ['UNIT_RENT', 'PRICE_CHANGE_PCT', 'VACANCY_DAYS_ON_MARKET'] },
  },
  {
    name: 'Weekly Portfolio Overview',
    description: 'Weekly summary of portfolio performance including supply/demand ratios.',
    frequency: 'WEEKLY',
    filterJson: { metrics: ['UNIT_RENT', 'SUPPLY_DEMAND_RATIO', 'LISTING_DURATION_DOM'] },
  },
  {
    name: 'Monthly Volatility Report',
    description: 'Monthly deep-dive into rent price volatility across regions.',
    frequency: 'MONTHLY',
    filterJson: { metrics: ['VOLATILITY_30D', 'PRICE_CHANGE_PCT'], groupBy: 'region' },
  },
];

// ══════════════════════════════════════════════════════════════════════════════
// SEED FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════

async function seedRBAC(): Promise<{ roleMap: Map<RoleName, string>; permMap: Map<string, string> }> {
  console.log('  Seeding roles...');
  const roleMap = new Map<RoleName, string>();
  for (const r of ROLES) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description },
      create: { name: r.name, description: r.description },
    });
    roleMap.set(r.name, role.id);
  }

  console.log('  Seeding permissions...');
  const permMap = new Map<string, string>();
  for (const perm of PERMISSIONS) {
    const record = await prisma.permission.upsert({
      where: { resource_action: { resource: perm.resource, action: perm.action } },
      update: { description: perm.description },
      create: { resource: perm.resource, action: perm.action, description: perm.description },
    });
    permMap.set(p(perm.resource, perm.action), record.id);
  }

  console.log('  Seeding role-permission assignments...');
  for (const [roleName, permKeys] of Object.entries(ROLE_PERMISSIONS) as [RoleName, string[]][]) {
    const roleId = roleMap.get(roleName)!;
    for (const key of permKeys) {
      const permissionId = permMap.get(key);
      if (!permissionId) {
        console.warn(`    WARN: permission "${key}" not found for role "${roleName}"`);
        continue;
      }
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId, permissionId } },
        update: {},
        create: { roleId, permissionId },
      });
    }
  }

  return { roleMap, permMap };
}

async function seedUsers(roleMap: Map<RoleName, string>): Promise<Map<string, string>> {
  console.log('  Seeding default users...');
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, BCRYPT_ROUNDS);
  const userMap = new Map<string, string>(); // username → id

  for (const u of DEFAULT_USERS) {
    const user = await prisma.user.upsert({
      where: { username: u.username },
      update: { displayName: u.displayName, email: u.email },
      create: {
        username: u.username,
        passwordHash,
        displayName: u.displayName,
        email: u.email,
        isActive: true,
      },
    });
    userMap.set(u.username, user.id);

    // Assign role (idempotent)
    const roleId = roleMap.get(u.role)!;
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId } },
      update: {},
      create: { userId: user.id, roleId, grantedBy: user.id },
    });
  }

  return userMap;
}

async function seedPropertyData(): Promise<{
  regionMap: Map<string, string>;
  communityMap: Map<string, string>;
  propertyMap: Map<string, string>;
}> {
  console.log('  Seeding regions...');
  const regionMap = new Map<string, string>();
  for (const r of REGIONS) {
    const region = await prisma.region.upsert({
      where: { name: r.name },
      update: {},
      create: { name: r.name },
    });
    regionMap.set(r.name, region.id);
  }

  console.log('  Seeding communities...');
  const communityMap = new Map<string, string>();
  for (const c of COMMUNITIES) {
    const regionId = regionMap.get(c.regionName)!;
    const existing = await prisma.community.findFirst({ where: { regionId, name: c.name } });
    let communityId: string;
    if (existing) {
      communityId = existing.id;
    } else {
      const created = await prisma.community.create({ data: { name: c.name, regionId } });
      communityId = created.id;
    }
    communityMap.set(c.name, communityId);
  }

  console.log('  Seeding properties...');
  const propertyMap = new Map<string, string>();
  for (const prop of PROPERTIES) {
    const communityId = communityMap.get(prop.community)!;
    const existing = await prisma.property.findFirst({ where: { communityId, name: prop.name } });
    let propertyId: string;
    if (existing) {
      propertyId = existing.id;
    } else {
      const created = await prisma.property.create({
        data: {
          communityId,
          name: prop.name,
          addressLine1: prop.address,
          city: prop.city,
          state: prop.state,
          postalCode: prop.postalCode,
          latitude: prop.lat,
          longitude: prop.lng,
          totalUnits: prop.units,
        },
      });
      propertyId = created.id;
    }
    propertyMap.set(prop.name, propertyId);

    // Seed sample listings for each property (skip if any exist)
    const existingListings = await prisma.listing.count({ where: { propertyId } });
    if (existingListings === 0) {
      const listedAt = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      for (const tpl of LISTING_TEMPLATES) {
        await prisma.listing.create({
          data: {
            propertyId,
            unitNumber: tpl.unitNumber,
            bedrooms: tpl.bedrooms,
            bathrooms: tpl.bathrooms,
            sqft: tpl.sqft,
            rentPrice: tpl.rent,
            listedAt,
            isActive: true,
          },
        });
      }
    }
  }

  return { regionMap, communityMap, propertyMap };
}

async function seedMetricDefinitions(adminUserId: string): Promise<Map<MetricType, string>> {
  console.log('  Seeding metric definitions...');
  const defMap = new Map<MetricType, string>();

  for (const def of METRIC_DEFINITIONS) {
    const existing = await prisma.metricDefinition.findFirst({ where: { metricType: def.type } });
    let defId: string;
    if (existing) {
      defId = existing.id;
    } else {
      const created = await prisma.metricDefinition.create({
        data: { metricType: def.type, name: def.name, description: def.description },
      });
      defId = created.id;
    }
    defMap.set(def.type, defId);

    // Create version 1 if it doesn't exist
    const existingVersion = await prisma.metricDefinitionVersion.findFirst({
      where: { metricDefinitionId: defId, versionNumber: 1 },
    });
    if (!existingVersion) {
      await prisma.metricDefinitionVersion.create({
        data: {
          metricDefinitionId: defId,
          versionNumber: 1,
          formulaJson: def.formula,
          effectiveFrom: new Date('2024-01-01T00:00:00.000Z'),
          isLocked: false,
          notes: def.notes,
          createdBy: adminUserId,
        },
      });
    }
  }

  return defMap;
}

async function seedTestCentre(): Promise<void> {
  console.log('  Seeding test sites...');
  const siteMap = new Map<string, string>();
  for (const site of TEST_SITES) {
    const existing = await prisma.testSite.findFirst({ where: { name: site.name } });
    let siteId: string;
    if (existing) {
      siteId = existing.id;
    } else {
      const created = await prisma.testSite.create({
        data: { name: site.name, address: site.address, timezone: site.timezone },
      });
      siteId = created.id;
    }
    siteMap.set(site.name, siteId);
  }

  console.log('  Seeding test rooms and seats...');
  for (const room of TEST_ROOMS) {
    const siteId = siteMap.get(room.siteName)!;

    const existing = await prisma.testRoom.findFirst({ where: { siteId, name: room.name } });
    let roomId: string;
    if (existing) {
      roomId = existing.id;
    } else {
      const created = await prisma.testRoom.create({
        data: { siteId, name: room.name, capacity: room.capacity, hasAda: room.hasAda },
      });
      roomId = created.id;
    }

    // Generate seats: rows A, B, C — positions up to ceil(capacity / 3)
    const rows = ['A', 'B', 'C'];
    const seatsPerRow = Math.ceil(room.capacity / rows.length);

    for (const row of rows) {
      for (let pos = 1; pos <= seatsPerRow; pos++) {
        const seatLabel = `${row}${pos}`;
        // Row A seat 1 is the ADA/accessible seat
        const isAccessible = row === 'A' && pos === 1 && room.hasAda;

        await prisma.testSeat.upsert({
          where: { roomId_seatLabel: { roomId, seatLabel } },
          update: {},
          create: {
            roomId,
            seatLabel,
            rowIdentifier: row,
            positionInRow: pos,
            isAccessible,
            isServiceable: true,
          },
        });
      }
    }

    // Seed equipment for each seat in the first room of Downtown Assessment Centre
    if (room.siteName === 'Downtown Assessment Centre' && room.name === 'Room A') {
      const seats = await prisma.testSeat.findMany({ where: { roomId } });
      for (const seat of seats) {
        const existingEquip = await prisma.equipmentLedgerEntry.findFirst({ where: { seatId: seat.id } });
        if (!existingEquip) {
          await prisma.equipmentLedgerEntry.create({
            data: {
              seatId: seat.id,
              equipmentType: 'Desktop Computer',
              serialNumber: `DC-${seat.seatLabel}-001`,
              status: 'OPERATIONAL',
              installedAt: new Date('2024-01-01T09:00:00.000Z'),
            },
          });
        }
      }
    }
  }
}

async function seedNotificationsConfig(): Promise<void> {
  console.log('  Seeding quiet hours config...');
  await prisma.quietHoursConfig.upsert({
    where: { timezone_isGlobal: { timezone: 'America/New_York', isGlobal: true } },
    update: { quietStartHr: 21, quietEndHr: 7 },
    create: {
      timezone: 'America/New_York',
      quietStartHr: 21,
      quietEndHr: 7,
      isGlobal: true,
    },
  });

  console.log('  Seeding notification templates...');
  for (const tpl of NOTIFICATION_TEMPLATES) {
    await prisma.notificationTemplate.upsert({
      where: { slug: tpl.slug },
      update: {
        name: tpl.name,
        channel: tpl.channel,
        subjectTpl: tpl.subjectTpl,
        bodyTpl: tpl.bodyTpl,
        isActive: true,
      },
      create: {
        slug: tpl.slug,
        name: tpl.name,
        channel: tpl.channel,
        subjectTpl: tpl.subjectTpl,
        bodyTpl: tpl.bodyTpl,
      },
    });
  }
}

async function seedReportDefinitions(adminUserId: string): Promise<void> {
  console.log('  Seeding report definitions...');
  for (const def of REPORT_DEFINITIONS) {
    const existing = await prisma.reportDefinition.findFirst({ where: { name: def.name } });
    if (!existing) {
      await prisma.reportDefinition.create({
        data: {
          name: def.name,
          description: def.description,
          frequency: def.frequency,
          filterJson: def.filterJson,
          isActive: true,
          createdBy: adminUserId,
        },
      });
    }
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════════════════

async function main(): Promise<void> {
  console.log('\n╔════════════════════════════════════╗');
  console.log('║   LeaseOps DB Seed Starting...     ║');
  console.log('╚════════════════════════════════════╝\n');

  console.log('1/7  RBAC (roles, permissions, assignments)');
  const { roleMap } = await seedRBAC();

  console.log('2/7  Users');
  const userMap = await seedUsers(roleMap);
  const adminId = userMap.get('admin')!;

  console.log('3/7  Property data (regions, communities, properties, listings)');
  await seedPropertyData();

  console.log('4/7  Metric definitions and initial versions');
  await seedMetricDefinitions(adminId);

  console.log('5/7  Test centre (sites, rooms, seats, equipment)');
  await seedTestCentre();

  console.log('6/7  Notifications (quiet hours, templates)');
  await seedNotificationsConfig();

  console.log('7/7  Report definitions');
  await seedReportDefinitions(adminId);

  console.log('\n╔════════════════════════════════════╗');
  console.log('║   Seed completed successfully ✓    ║');
  console.log('╚════════════════════════════════════╝\n');
  console.log('Default credentials (all users): Password123!');
  console.log('Roles: admin | manager | proctor | analyst | agent\n');
}

main()
  .catch((err) => {
    console.error('\nSeed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
