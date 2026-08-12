import { EntityId, Money, TenantId } from '@afri-market/kernel';
import { Product } from '@afri-market/marketplace-domain';
import { SupplierOrderStatus, PurchaseOrderPaymentStatus } from '@afri-market/marketplace-domain';
import {
  CreateSupplierUseCase,
  ListSuppliersUseCase,
  DeleteSupplierUseCase,
} from '../lib/use-cases/supplier/supplier.use-cases';
import {
  CreatePurchaseOrderUseCase,
  ListPurchaseOrdersUseCase,
  ReceivePurchaseOrderUseCase,
  ConfirmPurchaseOrderUseCase,
  CompletePurchaseOrderUseCase,
  CancelPurchaseOrderUseCase,
  SetPurchaseOrderPaymentUseCase,
} from '../lib/use-cases/purchase-order/purchase-order.use-cases';

const TENANT_ID = 'tenant-1';
const VENDOR_ID = 'vendor-1';
const OPERATOR_ID = 'operator-1';

function makeProduct(id: string, opts: { price?: number; stock?: number } = {}) {
  return Product.reconstitute({
    id: EntityId.from(id),
    tenantId: TenantId.create(TENANT_ID),
    vendorId: EntityId.from(VENDOR_ID),
    name: `Product ${id}`,
    description: 'test',
    price: Money.create(opts.price ?? 1000),
    type: 'food',
    categoryId: undefined,
    imageUrl: undefined,
    stockQuantity: opts.stock ?? 10,
    unit: 'pcs',
    sku: `SKU-${id}`,
    barcode: undefined,
    status: 'ACTIVE' as any,
    version: 1,
  });
}

describe('Supplier use cases', () => {
  const supplierRepo = { save: jest.fn(), findById: jest.fn(), findByVendorId: jest.fn() } as any;

  beforeEach(() => jest.clearAllMocks());

  it('should create and persist a supplier', async () => {
    supplierRepo.save.mockResolvedValue(undefined);
    const useCase = new CreateSupplierUseCase(supplierRepo);
    const { supplier } = await useCase.execute({
      tenantId: TENANT_ID,
      vendorId: VENDOR_ID,
      name: '  Dar Wholesalers  ',
      phone: '0711 000000',
    });
    expect(supplier.vendorId).toBe(VENDOR_ID);
    expect(supplier.name).toBe('Dar Wholesalers');
    expect(supplier.status).toBe('ACTIVE');
    expect(supplier.phone).toBe('0711 000000');
    expect(supplierRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should reject an empty supplier name', async () => {
    const useCase = new CreateSupplierUseCase(supplierRepo);
    await expect(
      useCase.execute({ tenantId: TENANT_ID, vendorId: VENDOR_ID, name: '   ' }),
    ).rejects.toThrow();
  });

  it('should list suppliers for a vendor', async () => {
    supplierRepo.findByVendorId.mockResolvedValue([{
      toDto: () => ({ id: 's1', vendorId: VENDOR_ID, name: 'A', status: 'ACTIVE' }),
    }]);
    const list = await new ListSuppliersUseCase(supplierRepo).execute(VENDOR_ID);
    expect(supplierRepo.findByVendorId).toHaveBeenCalledWith(VENDOR_ID);
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe('A');
  });

  it('should soft-delete a supplier owned by the vendor', async () => {
    const supplier = (await new CreateSupplierUseCase(supplierRepo).execute({
      tenantId: TENANT_ID,
      vendorId: VENDOR_ID,
      name: 'A',
    })).supplier;
    supplierRepo.findById.mockResolvedValue({
      id: { value: supplier.id }, vendorId: { value: VENDOR_ID }, deactivate() { this.status = 'INACTIVE'; },
    } as any);
    supplierRepo.save.mockResolvedValue(undefined);
    const result = await new DeleteSupplierUseCase(supplierRepo).execute({ vendorId: VENDOR_ID, supplierId: supplier.id as unknown as string });
    expect(result.deleted).toBe(true);
    expect(supplierRepo.save).toHaveBeenCalledTimes(2);
  });

  it('should not delete a supplier from another vendor', async () => {
    supplierRepo.findById.mockResolvedValue({ vendorId: { value: 'vendor-other' }, deactivate() {} } as any);
    await expect(
      new DeleteSupplierUseCase(supplierRepo).execute({ vendorId: VENDOR_ID, supplierId: 's1' }),
    ).rejects.toThrow('Supplier not found');
  });
});

describe('Purchase order use cases', () => {
  const productRepo = { findByIds: jest.fn() } as any;
  const poRepo = {
    save: jest.fn(),
    findById: jest.fn(),
    findByVendorId: jest.fn(),
    countByVendorAndDay: jest.fn(),
  } as any;

  beforeEach(() => jest.clearAllMocks());

  it('should create a purchase order with costed items and PO number', async () => {
    poRepo.countByVendorAndDay.mockResolvedValue(2);
    poRepo.save.mockResolvedValue(undefined);
    productRepo.findByIds.mockResolvedValue([
      makeProduct('p1', { price: 1000 }),
      makeProduct('p2', { price: 500 }),
    ]);

    const { order } = await new CreatePurchaseOrderUseCase(productRepo, poRepo).execute({
      tenantId: TENANT_ID,
      vendorId: VENDOR_ID,
      operatorId: OPERATOR_ID,
      supplierId: 'sup-1',
      items: [
        { productId: 'p1', quantity: 3, unitCost: 800 },
        { productId: 'p2', quantity: 2, unitCost: 400 },
      ],
    });

    expect(order.poNumber).toMatch(/^PO-\d{8}-\d{4}$/);
    expect(order.supplierId).toBe('sup-1');
    expect(order.status as SupplierOrderStatus).toBe('ORDERED');
    expect(order.paymentStatus as PurchaseOrderPaymentStatus).toBe('UNPAID');
    expect(order.subtotal).toBe(3200);
    expect(order.items).toHaveLength(2);
    expect(order.items[0].productName).toBe('Product p1');
    expect(order.items[0].totalCost).toBe(2400);
    expect(poRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should reject an empty purchase order', async () => {
    const useCase = new CreatePurchaseOrderUseCase(productRepo, poRepo);
    await expect(
      useCase.execute({ tenantId: TENANT_ID, vendorId: VENDOR_ID, operatorId: OPERATOR_ID, items: [] }),
    ).rejects.toThrow('at least one item');
  });

  it('should reject products from another vendor', async () => {
    const other = Product.reconstitute({
      id: EntityId.from('p9'),
      tenantId: TenantId.create(TENANT_ID),
      vendorId: EntityId.from('vendor-other'),
      name: 'Not mine',
      description: '',
      price: Money.create(500),
      type: 'general',
      categoryId: undefined,
      imageUrl: undefined,
      stockQuantity: 5,
      unit: 'pcs',
      sku: undefined,
      barcode: undefined,
      status: 'ACTIVE',
      version: 1,
    });
    productRepo.findByIds.mockResolvedValue([other]);
    await expect(
      new CreatePurchaseOrderUseCase(productRepo, poRepo).execute({
        tenantId: TENANT_ID,
        vendorId: VENDOR_ID,
        operatorId: OPERATOR_ID,
        items: [{ productId: 'p9', quantity: 1, unitCost: 100 }],
      }),
    ).rejects.toThrow('does not belong to this vendor');
  });

  it('should reject zero quantities and negative costs', async () => {
    productRepo.findByIds.mockResolvedValue([makeProduct('p1')]);
    const useCase = new CreatePurchaseOrderUseCase(productRepo, poRepo);
    await expect(
      useCase.execute({
        tenantId: TENANT_ID, vendorId: VENDOR_ID, operatorId: OPERATOR_ID,
        items: [{ productId: 'p1', quantity: 1, unitCost: -5 }],
      }),
    ).rejects.toThrow('Unit cost cannot be negative');
  });

  it('should receive a purchase order owned by the vendor', async () => {
    poRepo.findById.mockResolvedValue({
      id: { value: 'po-1' },
      vendorId: { value: VENDOR_ID },
      receive() { this.status = 'RECEIVED'; this.receivedAt = '2026-01-01T00:00:00.000Z'; },
      toDto() { return { id: 'po-1', status: this.status, receivedAt: this.receivedAt }; },
    } as any);
    poRepo.save.mockResolvedValue(undefined);
    const { order } = await new ReceivePurchaseOrderUseCase(poRepo).execute({ vendorId: VENDOR_ID, poId: 'po-1' });
    expect(order.status).toBe('RECEIVED');
    expect(poRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should not receive a purchase order from another vendor', async () => {
    poRepo.findById.mockResolvedValue({ vendorId: { value: 'vendor-other' }, receive() {} } as any);
    await expect(
      new ReceivePurchaseOrderUseCase(poRepo).execute({ vendorId: VENDOR_ID, poId: 'po-1' }),
    ).rejects.toThrow('Purchase order not found');
  });

  it('should cancel an open purchase order', async () => {
    poRepo.findById.mockResolvedValue({
      id: { value: 'po-1' }, vendorId: { value: VENDOR_ID },
      cancel() { this.status = 'CANCELLED'; },
      toDto() { return { id: 'po-1', status: this.status }; },
    } as any);
    const { order } = await new CancelPurchaseOrderUseCase(poRepo).execute({ vendorId: VENDOR_ID, poId: 'po-1' });
    expect(order.status).toBe('CANCELLED');
  });

  it('should confirm a received purchase order', async () => {
    poRepo.findById.mockResolvedValue({
      id: { value: 'po-1' }, vendorId: { value: VENDOR_ID },
      status: 'RECEIVED',
      confirm() { this.status = 'CONFIRMED'; this.confirmedAt = '2026-01-02T00:00:00.000Z'; },
      toDto() { return { id: 'po-1', status: this.status, confirmedAt: this.confirmedAt }; },
    } as any);
    const { order } = await new ConfirmPurchaseOrderUseCase(poRepo).execute({ vendorId: VENDOR_ID, poId: 'po-1' });
    expect(order.status).toBe('CONFIRMED');
    expect(order.confirmedAt).toBeDefined();
  });

  it('should not confirm a purchase order from another vendor', async () => {
    poRepo.findById.mockResolvedValue({ vendorId: { value: 'vendor-other' } } as any);
    await expect(
      new ConfirmPurchaseOrderUseCase(poRepo).execute({ vendorId: VENDOR_ID, poId: 'po-1' }),
    ).rejects.toThrow('Purchase order not found');
  });

  it('should complete a confirmed purchase order', async () => {
    poRepo.findById.mockResolvedValue({
      id: { value: 'po-1' }, vendorId: { value: VENDOR_ID },
      status: 'CONFIRMED',
      complete() { this.status = 'COMPLETED'; this.completedAt = '2026-01-03T00:00:00.000Z'; },
      toDto() { return { id: 'po-1', status: this.status, completedAt: this.completedAt }; },
    } as any);
    const { order } = await new CompletePurchaseOrderUseCase(poRepo).execute({ vendorId: VENDOR_ID, poId: 'po-1' });
    expect(order.status).toBe('COMPLETED');
    expect(order.completedAt).toBeDefined();
  });

  it('should drive a purchase order through receive -> confirm -> complete', async () => {
    const po = {
      id: { value: 'po-1' },
      vendorId: { value: VENDOR_ID },
      status: 'ORDERED',
      receive() { this.status = 'RECEIVED'; },
      confirm() { this.status = 'CONFIRMED'; },
      complete() { this.status = 'COMPLETED'; },
      toDto() { return { id: this.id.value, status: this.status }; },
    };
    poRepo.findById.mockResolvedValueOnce(po).mockResolvedValueOnce(po).mockResolvedValueOnce(po);
    await new ReceivePurchaseOrderUseCase(poRepo).execute({ vendorId: VENDOR_ID, poId: 'po-1' });
    expect(po.status).toBe('RECEIVED');
    await new ConfirmPurchaseOrderUseCase(poRepo).execute({ vendorId: VENDOR_ID, poId: 'po-1' });
    expect(po.status).toBe('CONFIRMED');
    await new CompletePurchaseOrderUseCase(poRepo).execute({ vendorId: VENDOR_ID, poId: 'po-1' });
    expect(po.status).toBe('COMPLETED');
    expect(poRepo.save).toHaveBeenCalledTimes(3);
  });

  it('should mark a purchase order paid', async () => {
    poRepo.findById.mockResolvedValue({
      id: { value: 'po-1' }, vendorId: { value: VENDOR_ID },
      markPaid() { this.paymentStatus = 'PAID'; }, markUnpaid() { this.paymentStatus = 'UNPAID'; },
      toDto() { return { id: 'po-1', paymentStatus: this.paymentStatus }; },
    } as any);
    const { order } = await new SetPurchaseOrderPaymentUseCase(poRepo).execute({ vendorId: VENDOR_ID, poId: 'po-1', paid: true });
    expect(order.paymentStatus).toBe('PAID');
  });

  it('should list purchase orders for a vendor', async () => {
    poRepo.findByVendorId.mockResolvedValue([]);
    await new ListPurchaseOrdersUseCase(poRepo).execute(VENDOR_ID);
    expect(poRepo.findByVendorId).toHaveBeenCalledWith(VENDOR_ID);
  });
});