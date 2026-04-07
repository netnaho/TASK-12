export var Role;
(function (Role) {
    Role["Admin"] = "SYSTEM_ADMIN";
    Role["Manager"] = "LEASING_OPS_MANAGER";
    Role["Proctor"] = "TEST_PROCTOR";
    Role["Analyst"] = "ANALYST";
    Role["User"] = "STANDARD_USER";
})(Role || (Role = {}));
export const roleLabels = {
    [Role.Admin]: 'System Admin',
    [Role.Manager]: 'Leasing Ops Manager',
    [Role.Proctor]: 'Test Proctor',
    [Role.Analyst]: 'Analyst',
    [Role.User]: 'Standard User',
};
export const roleColors = {
    [Role.Admin]: 'bg-red-100 text-red-800',
    [Role.Manager]: 'bg-blue-100 text-blue-800',
    [Role.Proctor]: 'bg-purple-100 text-purple-800',
    [Role.Analyst]: 'bg-green-100 text-green-800',
    [Role.User]: 'bg-gray-100 text-gray-800',
};
