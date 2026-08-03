import { OrgUnitStatus } from '@abms/organization-domain';

export interface OrgUnitReadModel {
  readonly id: string;
  readonly orgUnitTypeId: string;
  readonly parentId: string | null;
  readonly code: string;
  readonly name: string;
  readonly status: OrgUnitStatus;
  readonly sortOrder: number;
  readonly version: number;
}
