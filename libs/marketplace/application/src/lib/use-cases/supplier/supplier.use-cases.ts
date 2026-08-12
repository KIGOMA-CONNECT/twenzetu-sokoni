import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EntityId, TenantId } from '@afri-market/kernel';
import { Supplier, ISupplierRepository } from '@afri-market/marketplace-domain';
import { SUPPLIER_REPOSITORY } from '../../tokens';

export interface CreateSupplierInput {
  readonly tenantId: string;
  readonly vendorId: string;
  readonly name: string;
  readonly phone?: string;
  readonly contactPerson?: string;
  readonly notes?: string;
  readonly linkedVendorId?: string;
}

@Injectable()
export class CreateSupplierUseCase {
  constructor(@Inject(SUPPLIER_REPOSITORY) private readonly repo: ISupplierRepository) {}

  public async execute(input: CreateSupplierInput) {
    const supplier = Supplier.create({
      tenantId: TenantId.create(input.tenantId),
      vendorId: EntityId.from(input.vendorId),
      name: input.name.trim(),
      phone: input.phone?.trim() || undefined,
      contactPerson: input.contactPerson?.trim() || undefined,
      notes: input.notes?.trim() || undefined,
      linkedVendorId: input.linkedVendorId?.trim() || undefined,
    });
    await this.repo.save(supplier);
    return { supplier: supplier.toDto() };
  }
}

@Injectable()
export class ListSuppliersUseCase {
  constructor(@Inject(SUPPLIER_REPOSITORY) private readonly repo: ISupplierRepository) {}

  public async execute(vendorId: string) {
    const suppliers = await this.repo.findByVendorId(vendorId);
    return suppliers.map((s) => s.toDto());
  }
}

@Injectable()
export class DeleteSupplierUseCase {
  constructor(@Inject(SUPPLIER_REPOSITORY) private readonly repo: ISupplierRepository) {}

  public async execute(input: { vendorId: string; supplierId: string }) {
    const supplier = await this.repo.findById(EntityId.from(input.supplierId));
    if (!supplier || supplier.vendorId.value !== input.vendorId) {
      throw new NotFoundException('Supplier not found');
    }
    supplier.deactivate();
    await this.repo.save(supplier);
    return { deleted: true };
  }
}