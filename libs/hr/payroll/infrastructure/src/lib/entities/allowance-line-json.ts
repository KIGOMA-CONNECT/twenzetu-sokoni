// Shape stored in the `allowances` jsonb column on both salary_structure and
// payslip — matches Workflow's precedent (ADR-0007) of storing a small
// embedded list as jsonb rather than a child table, since allowance lines
// are not independently queried or referenced.
export interface AllowanceLineJson {
  readonly name: string;
  readonly amount: string;
}
