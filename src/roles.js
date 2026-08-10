export const ROLES = {
  ADMIN: "Admin",
  STUDENT: "Student",
  WARDEN: "Warden",
  PARENT: "Parent",
  SECURITY: "Security",
};

export const ROLE_LIST = [ROLES.ADMIN, ROLES.STUDENT, ROLES.WARDEN, ROLES.PARENT, ROLES.SECURITY];

export const ROLE_DASHBOARD_PATH = {
  [ROLES.ADMIN]: "/dashboard/admin",
  [ROLES.STUDENT]: "/dashboard/student",
  [ROLES.WARDEN]: "/dashboard/warden",
  [ROLES.PARENT]: "/dashboard/parent",
  [ROLES.SECURITY]: "/dashboard/security",
};

export function dashboardPathForRole(role) {
  return ROLE_DASHBOARD_PATH[role] ?? "/login";
}
