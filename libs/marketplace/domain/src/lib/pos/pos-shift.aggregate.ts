import { AggregateRoot, EntityId, TenantId } from '@afri-market/kernel';
import type { PosShiftStatus } from './pos-shift-status';

export interface CreatePosShiftProps {
  readonly tenantId: TenantId;
  readonly vendorId: EntityId;
  readonly operatorId: EntityId;
  readonly shiftNumber: string;
  readonly openingFloat: number;
}

export interface ReconstitutePosShiftProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly vendorId: EntityId;
  readonly operatorId: EntityId;
  readonly shiftNumber: string;
  readonly openedAt: Date;
  readonly closedAt: Date | undefined;
  readonly openingFloat: number;
  readonly closingCash: number | undefined;
  readonly expectedCash: number | undefined;
  readonly cashVariance: number | undefined;
  readonly totalSales: number;
  readonly totalRefunds: number;
  readonly salesCount: number;
  readonly paymentBreakdown: Record<string, number>;
  readonly status: PosShiftStatus;
  readonly closedBy: EntityId | undefined;
  readonly notes: string | undefined;
  readonly version: number;
}

export interface PosShiftDto {
  id: string;
  vendorId: string;
  operatorId: string;
  shiftNumber: string;
  openedAt: string;
  closedAt: string | null;
  openingFloat: number;
  closingCash: number | null;
  expectedCash: number | null;
  cashVariance: number | null;
  totalSales: number;
  totalRefunds: number;
  salesCount: number;
  paymentBreakdown: Record<string, number>;
  status: PosShiftStatus;
  closedBy: string | null;
  notes: string | null;
}

export class PosShift extends AggregateRoot<EntityId> {
  constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private readonly _vendorId: EntityId,
    private readonly _operatorId: EntityId,
    private readonly _shiftNumber: string,
    private readonly _openedAt: Date,
    private _closedAt: Date | undefined,
    private readonly _openingFloat: number,
    private _closingCash: number | undefined,
    private _expectedCash: number | undefined,
    private _cashVariance: number | undefined,
    private _totalSales: number,
    private _totalRefunds: number,
    private _salesCount: number,
    private _paymentBreakdown: Record<string, number>,
    private _status: PosShiftStatus,
    private _closedBy: EntityId | undefined,
    private _notes: string | undefined,
    private readonly _version: number,
  ) {
    super(id);
  }

  public static create(props: CreatePosShiftProps): PosShift {
    return new PosShift(
      EntityId.create(), props.tenantId, props.vendorId, props.operatorId,
      props.shiftNumber, new Date(), undefined, props.openingFloat,
      undefined, undefined, undefined, 0, 0, 0, {}, 'OPEN', undefined, undefined, 1,
    );
  }

  public static reconstitute(props: ReconstitutePosShiftProps): PosShift {
    return new PosShift(
      props.id, props.tenantId, props.vendorId, props.operatorId,
      props.shiftNumber, props.openedAt, props.closedAt, props.openingFloat,
      props.closingCash, props.expectedCash, props.cashVariance,
      props.totalSales, props.totalRefunds, props.salesCount,
      props.paymentBreakdown, props.status, props.closedBy, props.notes, props.version,
    );
  }

  public get tenantId(): TenantId { return this._tenantId; }
  public get vendorId(): EntityId { return this._vendorId; }
  public get operatorId(): EntityId { return this._operatorId; }
  public get shiftNumber(): string { return this._shiftNumber; }
  public get openedAt(): Date { return this._openedAt; }
  public get closedAt(): Date | undefined { return this._closedAt; }
  public get openingFloat(): number { return this._openingFloat; }
  public get closingCash(): number | undefined { return this._closingCash; }
  public get expectedCash(): number | undefined { return this._expectedCash; }
  public get cashVariance(): number | undefined { return this._cashVariance; }
  public get totalSales(): number { return this._totalSales; }
  public get totalRefunds(): number { return this._totalRefunds; }
  public get salesCount(): number { return this._salesCount; }
  public get paymentBreakdown(): Record<string, number> { return this._paymentBreakdown; }
  public get status(): PosShiftStatus { return this._status; }
  public get closedBy(): EntityId | undefined { return this._closedBy; }
  public get notes(): string | undefined { return this._notes; }
  public get version(): number { return this._version; }

  public recordSale(amount: number, paymentMethod: string): void {
    this._totalSales += amount;
    this._salesCount += 1;
    this._paymentBreakdown[paymentMethod] = (this._paymentBreakdown[paymentMethod] || 0) + amount;
  }

  public recordRefund(amount: number): void {
    this._totalRefunds += amount;
  }

  public close(closingCash: number, closedBy: EntityId, notes?: string): void {
    this._closingCash = closingCash;
    this._closedBy = closedBy;
    this._notes = notes;
    this._closedAt = new Date();
    this._status = 'CLOSED';
    this._expectedCash = this._openingFloat + this._totalSales - this._totalRefunds - (this._paymentBreakdown['cash'] || 0) + (this._paymentBreakdown['cash'] || 0);
    // Expected cash = opening float + cash sales - cash refunds
    // Simplified: expected = openingFloat + totalCashIn - totalCashOut
    this._expectedCash = this._openingFloat + (this._paymentBreakdown['cash'] || 0);
    this._cashVariance = closingCash - this._expectedCash;
  }

  public toDto(): PosShiftDto {
    return {
      id: this.id.value,
      vendorId: this._vendorId.value,
      operatorId: this._operatorId.value,
      shiftNumber: this._shiftNumber,
      openedAt: this._openedAt.toISOString(),
      closedAt: this._closedAt?.toISOString() ?? null,
      openingFloat: this._openingFloat,
      closingCash: this._closingCash ?? null,
      expectedCash: this._expectedCash ?? null,
      cashVariance: this._cashVariance ?? null,
      totalSales: this._totalSales,
      totalRefunds: this._totalRefunds,
      salesCount: this._salesCount,
      paymentBreakdown: this._paymentBreakdown,
      status: this._status,
      closedBy: this._closedBy?.value ?? null,
      notes: this._notes ?? null,
    };
  }
}