import { EntityId, Money, TenantId } from '@afri-market/kernel';
import { Product } from '@afri-market/marketplace-domain';
import { CreatePosSaleUseCase } from '../lib/use-cases/pos/create-pos-sale.use-case';
import { GetPosDayReportUseCase } from '../lib/use-cases/pos/get-pos-day-report.use-case';

const TENANT_ID = 'tenant-1';
const VENDOR_ID = 'vendor-1';
const OPERATOR_ID = 'operator-1';

function makeProduct(id: string, opts: { stock?: number; status?: string; price?: number } = {}) {
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
    status: (opts.status ?? 'ACTIVE') as any,
    version: 1,
  });
}

const productRepo = { findByIds: jest.fn() } as any;
const saleRepo = { countByVendorAndDay: jest.fn(), save: jest.fn(), findByIds: jest.fn() } as any;
const shiftRepo = { findOpenByVendor: jest.fn(), save: jest.fn() } as any;

describe('CreatePosSaleUseCase', () => {
  let useCase: CreatePosSaleUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    saleRepo.countByVendorAndDay.mockResolvedValue(3);
    saleRepo.save.mockResolvedValue(undefined);
    useCase = new CreatePosSaleUseCase(productRepo, saleRepo, shiftRepo);
  });

  it('should ring up a sale and compute totals', async () => {
    const p1 = makeProduct('p1', { price: 1000 });
    const p2 = makeProduct('p2', { price: 2500 });
    productRepo.findByIds.mockResolvedValue([p1, p2]);

    const result = await useCase.execute({
      tenantId: TENANT_ID,
      vendorId: VENDOR_ID,
      operatorId: OPERATOR_ID,
      shopName: 'Kiosk A',
      items: [
        { productId: 'p1', quantity: 2 },
        { productId: 'p2', quantity: 1 },
      ],
      paymentMethod: 'cash',
      amountTendered: 5000,
    });

    expect(result.sale.subtotal).toBe(4500);
    expect(result.sale.total).toBe(4500);
    expect(result.sale.paymentMethod).toBe('cash');
    expect(result.sale.saleNumber).toMatch(/^POS-\d{8}-\d{4}$/);
    expect(result.sale.items).toHaveLength(2);
    expect(result.change).toBe(500);
    expect(result.receiptText).toContain('Kiosk A');
    expect(saleRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should reject an empty sale', async () => {
    productRepo.findByIds.mockResolvedValue([]);
    await expect(
      useCase.execute({
        tenantId: TENANT_ID,
        vendorId: VENDOR_ID,
        operatorId: OPERATOR_ID,
        items: [],
        paymentMethod: 'cash',
      }),
    ).rejects.toThrow('at least one item');
  });

  it('should reject unsupported payment methods', async () => {
    const p1 = makeProduct('p1');
    productRepo.findByIds.mockResolvedValue([p1]);
    await expect(
      useCase.execute({
        tenantId: TENANT_ID,
        vendorId: VENDOR_ID,
        operatorId: OPERATOR_ID,
        items: [{ productId: 'p1', quantity: 1 }],
        paymentMethod: 'bitcoin',
      }),
    ).rejects.toThrow('Unsupported payment method');
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
      useCase.execute({
        tenantId: TENANT_ID,
        vendorId: VENDOR_ID,
        operatorId: OPERATOR_ID,
        items: [{ productId: 'p9', quantity: 1 }],
        paymentMethod: 'cash',
      }),
    ).rejects.toThrow('does not belong to this vendor');
  });

  it('should reject when stock is insufficient', async () => {
    const p1 = makeProduct('p1', { stock: 1 });
    productRepo.findByIds.mockResolvedValue([p1]);
    await expect(
      useCase.execute({
        tenantId: TENANT_ID,
        vendorId: VENDOR_ID,
        operatorId: OPERATOR_ID,
        items: [{ productId: 'p1', quantity: 5 }],
        paymentMethod: 'cash',
      }),
    ).rejects.toThrow('Insufficient stock');
  });

  it('should reject inactive products', async () => {
    const p1 = makeProduct('p1', { status: 'INACTIVE' });
    productRepo.findByIds.mockResolvedValue([p1]);
    await expect(
      useCase.execute({
        tenantId: TENANT_ID,
        vendorId: VENDOR_ID,
        operatorId: OPERATOR_ID,
        items: [{ productId: 'p1', quantity: 1 }],
        paymentMethod: 'cash',
      }),
    ).rejects.toThrow('not available for sale');
  });
});

describe('GetPosDayReportUseCase', () => {
  it('should aggregate sales totals and payment breakdown', async () => {
    const p1 = makeProduct('p1', { price: 1000 });
    const p2 = makeProduct('p2', { price: 500 });
    productRepo.findByIds.mockResolvedValue([p1, p2]);

    const saved: any[] = [];
    saleRepo.save.mockImplementation((sale: any) => { saved.push(sale); return Promise.resolve(); });

    const pos = new CreatePosSaleUseCase(productRepo, saleRepo, shiftRepo);
    await pos.execute({
      tenantId: TENANT_ID,
      vendorId: VENDOR_ID,
      operatorId: OPERATOR_ID,
      items: [{ productId: 'p1', quantity: 2 }],
      paymentMethod: 'cash',
    });
    await pos.execute({
      tenantId: TENANT_ID,
      vendorId: VENDOR_ID,
      operatorId: OPERATOR_ID,
      items: [{ productId: 'p2', quantity: 1 }],
      paymentMethod: 'mpesa',
    });

    const dayRepo = { findByVendorBetween: jest.fn().mockResolvedValue(saved) } as any;
    const reportUseCase = new GetPosDayReportUseCase(dayRepo);

    const report = await reportUseCase.execute({ tenantId: TENANT_ID, vendorId: VENDOR_ID });

    expect(report.transactionCount).toBe(2);
    expect(report.totalRevenue).toBe(2500);
    expect(report.itemCount).toBe(3);
    expect(report.paymentBreakdown).toHaveLength(2);
    const cash = report.paymentBreakdown.find((r) => r.method === 'cash');
    const mpesa = report.paymentBreakdown.find((r) => r.method === 'mpesa');
    expect(cash?.amount).toBe(2000);
    expect(mpesa?.amount).toBe(500);
    expect(report.averageSale).toBe(1250);
  });

  it('should return empty report when no sales exist', async () => {
    const dayRepo = { findByVendorBetween: jest.fn().mockResolvedValue([]) } as any;
    const reportUseCase = new GetPosDayReportUseCase(dayRepo);
    const report = await reportUseCase.execute({ tenantId: TENANT_ID, vendorId: VENDOR_ID });
    expect(report.transactionCount).toBe(0);
    expect(report.totalRevenue).toBe(0);
    expect(report.sales).toHaveLength(0);
  });
});