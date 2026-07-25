export interface IAdminUserRepository {
  countByTenant(tenantId: string): Promise<number>;
}
