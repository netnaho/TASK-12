export enum Role {
  Admin = 'SYSTEM_ADMIN',
  Manager = 'LEASING_OPS_MANAGER',
  Proctor = 'TEST_PROCTOR',
  Analyst = 'ANALYST',
  User = 'STANDARD_USER',
}

export const roleLabels: Record<Role, string> = {
  [Role.Admin]: 'System Admin',
  [Role.Manager]: 'Leasing Ops Manager',
  [Role.Proctor]: 'Test Proctor',
  [Role.Analyst]: 'Analyst',
  [Role.User]: 'Standard User',
};

export const roleColors: Record<Role, string> = {
  [Role.Admin]: 'bg-red-100 text-red-800',
  [Role.Manager]: 'bg-blue-100 text-blue-800',
  [Role.Proctor]: 'bg-purple-100 text-purple-800',
  [Role.Analyst]: 'bg-green-100 text-green-800',
  [Role.User]: 'bg-gray-100 text-gray-800',
};
