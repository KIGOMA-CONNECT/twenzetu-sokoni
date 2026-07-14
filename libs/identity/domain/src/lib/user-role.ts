// Fixed set, not a data-driven taxonomy like OrgUnitType — RBAC roles are tied
// to actual permission-check code (RolesGuard/@Roles()), not free-form taxonomy.
export type UserRole = 'CEO' | 'PROJECT_MANAGER' | 'FINANCIAL_OFFICER' | 'TEAM_MEMBER';

export const USER_ROLES: ReadonlyArray<UserRole> = [
  'CEO',
  'PROJECT_MANAGER',
  'FINANCIAL_OFFICER',
  'TEAM_MEMBER',
];
