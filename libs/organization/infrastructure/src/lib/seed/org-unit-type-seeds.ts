export interface OrgUnitTypeSeed {
  readonly code: string;
  readonly name: string;
  readonly description: string;
  readonly allowedParentCodes: readonly string[];
}

// A reasonable default enterprise hierarchy, shipped as DATA (not a hardcoded
// TypeScript enum), matching the "dynamic, metadata-driven" requirement — a tenant
// is free to define its own additional types later via CreateOrgUnitTypeCommand.
export const ORG_UNIT_TYPE_SEEDS: readonly OrgUnitTypeSeed[] = [
  {
    code: 'ORGANIZATION',
    name: 'Organization',
    description: 'The top-level legal or operating entity.',
    allowedParentCodes: [],
  },
  {
    code: 'COMPANY',
    name: 'Company',
    description: 'A company within the organization.',
    allowedParentCodes: ['ORGANIZATION'],
  },
  {
    code: 'DIVISION',
    name: 'Division',
    description: 'A major division within a company.',
    allowedParentCodes: ['COMPANY'],
  },
  {
    code: 'BUSINESS_UNIT',
    name: 'Business Unit',
    description: 'A business unit within a division or company.',
    allowedParentCodes: ['DIVISION', 'COMPANY'],
  },
  {
    code: 'DEPARTMENT',
    name: 'Department',
    description: 'A functional department.',
    allowedParentCodes: ['BUSINESS_UNIT', 'DIVISION', 'COMPANY'],
  },
  {
    code: 'SECTION',
    name: 'Section',
    description: 'A section within a department.',
    allowedParentCodes: ['DEPARTMENT'],
  },
  {
    code: 'TEAM',
    name: 'Team',
    description: 'A working team.',
    allowedParentCodes: ['SECTION', 'DEPARTMENT'],
  },
  {
    code: 'BRANCH',
    name: 'Branch',
    description: 'A physical or regional branch office.',
    allowedParentCodes: ['COMPANY', 'ORGANIZATION'],
  },
  {
    code: 'WAREHOUSE',
    name: 'Warehouse',
    description: 'A storage or distribution facility.',
    allowedParentCodes: ['BRANCH', 'COMPANY'],
  },
  {
    code: 'PROJECT',
    name: 'Project',
    description: 'A time-bound initiative.',
    allowedParentCodes: ['DIVISION', 'DEPARTMENT', 'BUSINESS_UNIT', 'COMPANY'],
  },
  {
    code: 'REGION',
    name: 'Region',
    description: 'A geographic region.',
    allowedParentCodes: ['ORGANIZATION'],
  },
  {
    code: 'ZONE',
    name: 'Zone',
    description: 'A geographic zone within a region.',
    allowedParentCodes: ['REGION'],
  },
  {
    code: 'COST_CENTER',
    name: 'Cost Center',
    description: 'A unit tracked for cost accounting.',
    allowedParentCodes: ['DEPARTMENT', 'DIVISION', 'BUSINESS_UNIT', 'COMPANY'],
  },
  {
    code: 'PROFIT_CENTER',
    name: 'Profit Center',
    description: 'A unit tracked for profit accounting.',
    allowedParentCodes: ['DIVISION', 'BUSINESS_UNIT', 'COMPANY'],
  },
];
