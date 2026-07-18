import { TypeOrmRepository } from '@abms/database';
import { CurrencyCode, EntityId, TenantId } from '@abms/kernel';
import { IPayslipRepository, Payslip, PayslipStatus } from '@abms/hr-payroll-domain';
import { EntityManager } from 'typeorm';
import { PayslipOrmEntity } from '../entities/payslip-orm.entity';
import { toAllowanceLineJson, toAllowanceLines, toMoney } from './money-json.mapper';

export class TypeOrmPayslipRepository
  extends TypeOrmRepository<Payslip, PayslipOrmEntity, EntityId>
  implements IPayslipRepository
{
  public constructor(manager: EntityManager) {
    super(manager, PayslipOrmEntity);
  }

  public async findById(id: EntityId): Promise<Payslip | null> {
    const row = await this.repository.findOne({ where: { id: id.toValue() } });
    return row ? this.toDomain(row) : null;
  }

  public async findByEmployeeAndPeriod(
    tenantId: TenantId,
    employeeId: EntityId,
    payrollPeriodId: EntityId,
  ): Promise<Payslip | null> {
    const row = await this.repository.findOne({
      where: {
        tenantId: tenantId.value,
        employeeId: employeeId.toValue(),
        payrollPeriodId: payrollPeriodId.toValue(),
      },
    });
    return row ? this.toDomain(row) : null;
  }

  public async findAllByPeriod(tenantId: TenantId, payrollPeriodId: EntityId): Promise<Payslip[]> {
    const rows = await this.repository.find({
      where: { tenantId: tenantId.value, payrollPeriodId: payrollPeriodId.toValue() },
    });
    return rows.map((row) => this.toDomain(row));
  }

  public async findAllByEmployee(tenantId: TenantId, employeeId: EntityId): Promise<Payslip[]> {
    const rows = await this.repository.find({
      where: { tenantId: tenantId.value, employeeId: employeeId.toValue() },
    });
    return rows.map((row) => this.toDomain(row));
  }

  public async exists(id: EntityId): Promise<boolean> {
    const count = await this.repository.count({ where: { id: id.toValue() } });
    return count > 0;
  }

  public async save(entity: Payslip): Promise<void> {
    await this.repository.save({
      id: entity.id.toValue(),
      tenantId: entity.tenantId.value,
      employeeId: entity.employeeId.toValue(),
      payrollPeriodId: entity.payrollPeriodId.toValue(),
      basicSalary: entity.basicSalary.amount,
      currency: entity.basicSalary.currency.value,
      allowances: toAllowanceLineJson(entity.allowances),
      grossPay: entity.grossPay.amount,
      payeAmount: entity.payeAmount.amount,
      nssfEmployeeAmount: entity.nssfEmployeeAmount.amount,
      nssfEmployerAmount: entity.nssfEmployerAmount.amount,
      wcfEmployerAmount: entity.wcfEmployerAmount.amount,
      sdlEmployerAmount: entity.sdlEmployerAmount.amount,
      netPay: entity.netPay.amount,
      status: entity.status,
      approvedByUserId: entity.approvedByUserId,
      approvedAt: entity.approvedAt,
      paidByUserId: entity.paidByUserId,
      paidAt: entity.paidAt,
    });
  }

  public async delete(id: EntityId): Promise<void> {
    await this.repository.delete({ id: id.toValue() });
  }

  private toDomain(row: PayslipOrmEntity): Payslip {
    const currency = CurrencyCode.create(row.currency).getValue();
    return Payslip.reconstitute({
      id: EntityId.create(row.id),
      tenantId: TenantId.create(row.tenantId).getValue(),
      employeeId: EntityId.create(row.employeeId),
      payrollPeriodId: EntityId.create(row.payrollPeriodId),
      basicSalary: toMoney(row.basicSalary, currency),
      allowances: toAllowanceLines(row.allowances, currency),
      grossPay: toMoney(row.grossPay, currency),
      payeAmount: toMoney(row.payeAmount, currency),
      nssfEmployeeAmount: toMoney(row.nssfEmployeeAmount, currency),
      nssfEmployerAmount: toMoney(row.nssfEmployerAmount, currency),
      wcfEmployerAmount: toMoney(row.wcfEmployerAmount, currency),
      sdlEmployerAmount: toMoney(row.sdlEmployerAmount, currency),
      netPay: toMoney(row.netPay, currency),
      status: row.status as PayslipStatus,
      approvedByUserId: row.approvedByUserId,
      approvedAt: row.approvedAt,
      paidByUserId: row.paidByUserId,
      paidAt: row.paidAt,
    });
  }
}
