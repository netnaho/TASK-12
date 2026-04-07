import { Role } from '@/types/roles';
import type { NavItem } from '@/types';

const allRoles = [Role.Admin, Role.Manager, Role.Proctor, Role.Analyst, Role.User];

export const NAV_ITEMS: (NavItem | { separator: true })[] = [
  {
    name: 'Dashboard',
    icon: 'LayoutDashboard',
    route: '/dashboard',
    roles: allRoles,
  },
  {
    name: 'Notifications',
    icon: 'Bell',
    route: '/notifications',
    roles: allRoles,
  },
  {
    name: 'Test Center',
    icon: 'ClipboardCheck',
    route: '/test-center',
    roles: [Role.Admin, Role.Manager, Role.Proctor],
  },
  {
    name: 'Listings',
    icon: 'Building2',
    route: '/listings',
    roles: [Role.Admin, Role.Manager, Role.User],
  },
  {
    name: 'Lease Metrics',
    icon: 'BarChart3',
    route: '/lease-metrics',
    roles: [Role.Admin, Role.Manager, Role.Analyst],
  },
  {
    name: 'Analytics',
    icon: 'TrendingUp',
    route: '/analytics',
    roles: [Role.Admin, Role.Manager, Role.Analyst],
  },
  { separator: true },
  {
    name: 'User Management',
    icon: 'Users',
    route: '/users',
    roles: [Role.Admin],
  },
  {
    name: 'Settings',
    icon: 'Settings',
    route: '/settings',
    roles: [Role.Admin],
  },
  {
    name: 'Audit Log',
    icon: 'ScrollText',
    route: '/audit-log',
    roles: [Role.Admin],
  },
];
