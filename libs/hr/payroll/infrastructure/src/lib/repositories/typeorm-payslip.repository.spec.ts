import { CurrencyCode, EntityId, Money, TenantId } from '@abms/kernel';
import { createTanzaniaStatutoryRatesV1, Payslip } from '@abms/hr-payroll-domain';
import type { EntityManager, Repository } from 'typeorm';
import { PayslipOrmEntity } from '../entities/payslip-orm.entity';
import { TypeOrmPayslipRepository } from './typeorm-payslip.repository';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();
const TZS = CurrencyCode.create('TZS').getValue();

function tzs(amount: string): Money {
  return Money.create(amount, TZS).getValue();
}

function fakeOrmRepository(): jest.Mocked<
  Pick<Repository<PayslipOrmEntity>, 'findOne' | 'find' | 'count' | 'save' | 'delete'>
> {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<
    Pick<Repository<PayslipOrmEntity>, 'findOne' | 'find' | 'count' | 'save' | 'delete'>
  >;
}

function fakeManager(repository: unknown): jest.Mocked<Pick<EntityManager, 'getRepository'>> {
  return {
    getRepository: jest.fn().mockReturnValue(repository),
  } as unknown as jest.Mocked<Pick<EntityManager, 'getRepository'>>;
}

describe('TypeOrmPayslipRepository', () => {
  it('findById reconstitutes all Money-typed fields', async () => {
    const id = EntityId.create();
    const employeeId = EntityId.create();
    const periodId = EntityId.create();
    const ormRepository = fakeOrmRepository();
    ormRepository.findOne.mockResolvedValue({
      id: id.toValue(),
      tenantId: TENANT_ID.value,
      employeeId: employeeId.toValue(),
      payrollPeriodId: periodId.toValue(),
      basicSalary: '500000.0000',
      currency: 'TZS',
      allowances: [],
      grossPay: '500000.0000',
      payeAmount: '18400.0000',
      nssfEmployeeAmount: '50000.0000',
      nssfEmployerAmount: '50000.0000',
      wcfEmployerAmount: '3000.0000',
      sdlEmployerAmount: '17500.0000',
      netPay: '431600.0000',
      status: 'DRAFT',
      approvedByUserId: null,
      approvedAt: null,
      paidByUserId: null,
      paidAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as PayslipOrmEntity);
    const manager = fakeManager(ormRepository);

    const result = await new TypeOrmPayslipRepository(manager as unknown as EntityManager).findById(id);

    expect(result?.netPay.amount).toBe('431600.0000');
    expect(result?.status).toBe('DRAFT');
  });

  it('save() upserts the row with every Money field as a decimal string', async () => {
    const ormRepository = fakeOrmRepository();
    const manager = fakeManager(ormRepository);
    const payslip = Payslip.generate({
      tenantId: TENANT_ID,
      employeeId: EntityId.create(),
      payrollPeriodId: EntityId.create(),
      basicSalary: tzs('500000'),
      allowances: [],
      statutoryRates: createTanzaniaStatutoryRatesV1(),
    });

    await new TypeOrmPayslipRepository(manager as unknown as EntityManager).save(payslip);

    expect(ormRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: payslip.id.toValue(),
        netPay: '431600.0000',
        status: 'DRAFT',
      }),
    );
  });
});
