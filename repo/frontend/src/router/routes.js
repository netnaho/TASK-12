import { Role } from '@/types/roles';
const allRoles = [Role.Admin, Role.Manager, Role.Proctor, Role.Analyst, Role.User];
export const routes = [
    {
        path: '/login',
        name: 'login',
        component: () => import('@/views/auth/LoginView.vue'),
        meta: { requiresAuth: false },
    },
    {
        path: '/',
        redirect: '/dashboard',
    },
    {
        path: '/dashboard',
        name: 'dashboard',
        component: () => import('@/views/dashboard/DashboardView.vue'),
        meta: { requiresAuth: true, roles: allRoles },
    },
    {
        path: '/notifications',
        name: 'notifications',
        component: () => import('@/views/notifications/NotificationsView.vue'),
        meta: { requiresAuth: true, roles: allRoles },
    },
    {
        path: '/test-center',
        name: 'test-center',
        component: () => import('@/views/test-center/TestCenterView.vue'),
        meta: { requiresAuth: true, roles: [Role.Admin, Role.Manager, Role.Proctor] },
        children: [
            { path: '', redirect: 'sites' },
            {
                path: 'sites',
                name: 'sites',
                component: () => import('@/views/test-center/SitesView.vue'),
            },
            {
                path: 'rooms',
                name: 'rooms',
                component: () => import('@/views/test-center/RoomsView.vue'),
            },
            {
                path: 'equipment',
                name: 'equipment',
                component: () => import('@/views/test-center/EquipmentView.vue'),
            },
            {
                path: 'sessions',
                name: 'sessions',
                component: () => import('@/views/test-center/SessionsView.vue'),
            },
            {
                path: 'utilization',
                name: 'utilization',
                component: () => import('@/views/test-center/UtilizationView.vue'),
            },
        ],
    },
    {
        path: '/listings',
        name: 'listings',
        component: () => import('@/views/listings/ListingsView.vue'),
        meta: { requiresAuth: true, roles: [Role.Admin, Role.Manager, Role.User] },
    },
    {
        path: '/lease-metrics',
        name: 'lease-metrics',
        component: () => import('@/views/lease-metrics/LeaseMetricsView.vue'),
        meta: { requiresAuth: true, roles: [Role.Admin, Role.Manager, Role.Analyst] },
    },
    {
        path: '/analytics',
        name: 'analytics',
        component: () => import('@/views/analytics/AnalyticsView.vue'),
        meta: { requiresAuth: true, roles: [Role.Admin, Role.Manager, Role.Analyst] },
        children: [
            { path: '', redirect: 'builder' },
            {
                path: 'builder',
                name: 'report-builder',
                component: () => import('@/views/analytics/reports/ReportBuilderView.vue'),
            },
            {
                path: 'saved',
                name: 'saved-reports',
                component: () => import('@/views/analytics/reports/SavedReportsView.vue'),
            },
            {
                path: 'schedules',
                name: 'scheduled-reports',
                component: () => import('@/views/analytics/schedules/ScheduledReportList.vue'),
            },
        ],
    },
    {
        path: '/users',
        name: 'users',
        component: () => import('@/views/users/UserManagementView.vue'),
        meta: { requiresAuth: true, roles: [Role.Admin] },
    },
    {
        path: '/settings',
        name: 'settings',
        component: () => import('@/views/settings/SettingsView.vue'),
        meta: { requiresAuth: true, roles: [Role.Admin] },
    },
    {
        path: '/audit-log',
        name: 'audit-log',
        component: () => import('@/views/audit/AuditLogView.vue'),
        meta: { requiresAuth: true, roles: [Role.Admin] },
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'not-found',
        component: () => import('@/views/NotFoundView.vue'),
    },
];
