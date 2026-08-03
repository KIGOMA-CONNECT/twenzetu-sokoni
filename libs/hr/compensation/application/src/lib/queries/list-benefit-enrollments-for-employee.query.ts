import { IQuery } from '@abms/kernel';
import { BenefitEnrollmentReadModel } from '../read-models/benefit-enrollment-read-model';

export class ListBenefitEnrollmentsForEmployeeQuery implements IQuery<BenefitEnrollmentReadModel[]> {
  public readonly _resultType?: BenefitEnrollmentReadModel[];

  public constructor(public readonly employeeId: string) {}
}
