export interface DepartmentProfileReadModel {
  readonly id: string;
  readonly orgUnitId: string;
  readonly costCenterOrgUnitId: string | null;
  readonly managerReference: string | null;
  readonly version: number;
}
