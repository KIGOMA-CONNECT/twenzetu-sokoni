export interface OrgUnitTypeReadModel {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly description: string | null;
  readonly isSystemDefined: boolean;
  readonly isActive: boolean;
  readonly sortOrder: number;
  readonly allowedParentTypeIds: string[];
}
