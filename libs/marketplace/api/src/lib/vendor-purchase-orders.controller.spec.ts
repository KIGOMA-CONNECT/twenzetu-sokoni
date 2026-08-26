import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from '@nestjs/passport';
import { getDataSourceToken } from '@nestjs/typeorm';
import {
  CreatePurchaseOrderUseCase,
  ListPurchaseOrdersUseCase,
  ReceivePurchaseOrderUseCase,
  ConfirmPurchaseOrderUseCase,
  CompletePurchaseOrderUseCase,
  CancelPurchaseOrderUseCase,
  SetPurchaseOrderPaymentUseCase,
  VendorAccessService,
} from '@afri-market/marketplace-application';
import { MobileMoneyService } from '@afri-market/integrations';
import { VendorPurchaseOrdersController } from './vendor-purchase-orders.controller';

describe('VendorPurchaseOrdersController', () => {
  let controller: VendorPurchaseOrdersController;
  let createOrder: jest.Mocked<CreatePurchaseOrderUseCase>;
  let listOrders: jest.Mocked<ListPurchaseOrdersUseCase>;
  let receiveOrder: jest.Mocked<ReceivePurchaseOrderUseCase>;
  let confirmOrder: jest.Mocked<ConfirmPurchaseOrderUseCase>;
  let completeOrder: jest.Mocked<CompletePurchaseOrderUseCase>;
  let cancelOrder: jest.Mocked<CancelPurchaseOrderUseCase>;
  let setPayment: jest.Mocked<SetPurchaseOrderPaymentUseCase>;

  const user = { sub: 'operator-1', tenantId: 'tenant-1' } as never;
  const poId = '11111111-1111-1111-1111-111111111111';

  beforeEach(async () => {
    jest.clearAllMocks();
    createOrder = { execute: jest.fn().mockResolvedValue({ order: { id: poId } }) } as unknown as jest.Mocked<CreatePurchaseOrderUseCase>;
    listOrders = { execute: jest.fn().mockResolvedValue([]) } as unknown as jest.Mocked<ListPurchaseOrdersUseCase>;
    receiveOrder = { execute: jest.fn().mockResolvedValue({ order: { id: poId, status: 'RECEIVED' } }) } as unknown as jest.Mocked<ReceivePurchaseOrderUseCase>;
    confirmOrder = { execute: jest.fn().mockResolvedValue({ order: { id: poId, status: 'CONFIRMED' } }) } as unknown as jest.Mocked<ConfirmPurchaseOrderUseCase>;
    completeOrder = { execute: jest.fn().mockResolvedValue({ order: { id: poId, status: 'COMPLETED' } }) } as unknown as jest.Mocked<CompletePurchaseOrderUseCase>;
    cancelOrder = { execute: jest.fn().mockResolvedValue({ order: { id: poId, status: 'CANCELLED' } }) } as unknown as jest.Mocked<CancelPurchaseOrderUseCase>;
    setPayment = { execute: jest.fn().mockResolvedValue({ order: { id: poId, paymentStatus: 'PAID' } }) } as unknown as jest.Mocked<SetPurchaseOrderPaymentUseCase>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VendorPurchaseOrdersController],
      providers: [
        { provide: CreatePurchaseOrderUseCase, useValue: createOrder },
        { provide: ListPurchaseOrdersUseCase, useValue: listOrders },
        { provide: ReceivePurchaseOrderUseCase, useValue: receiveOrder },
        { provide: ConfirmPurchaseOrderUseCase, useValue: confirmOrder },
        { provide: CompletePurchaseOrderUseCase, useValue: completeOrder },
        { provide: CancelPurchaseOrderUseCase, useValue: cancelOrder },
        { provide: SetPurchaseOrderPaymentUseCase, useValue: setPayment },
        {
          provide: VendorAccessService,
          useValue: { assertPermission: jest.fn().mockResolvedValue({ vendorId: 'vendor-1' }) },
        },
        {
          provide: MobileMoneyService,
          useValue: { disburse: jest.fn().mockResolvedValue({ success: true, reference: 'ref-1' }) },
        },
        {
          provide: getDataSourceToken(),
          useValue: { query: jest.fn().mockResolvedValue([]) },
        },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<VendorPurchaseOrdersController>(VendorPurchaseOrdersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should list purchase orders', async () => {
    const result = await controller.list(user);
    expect(result).toEqual({ data: [] });
    expect(listOrders.execute).toHaveBeenCalledWith('vendor-1');
  });

  it('should create a purchase order', async () => {
    const dto = {
      supplierId: poId,
      notes: 'urgent',
      items: [{ productId: poId, quantity: 5, unitCost: 1000 }],
    };
    const result = await controller.create(dto as never, user);
    expect(result).toEqual({ order: { id: poId } });
    expect(createOrder.execute).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      vendorId: 'vendor-1',
      operatorId: 'operator-1',
      supplierId: poId,
      items: dto.items,
      notes: 'urgent',
    });
  });

  it('should receive a purchase order', async () => {
    const result = await controller.receive(poId, user);
    expect(result).toEqual({ data: { order: { id: poId, status: 'RECEIVED' } } });
    expect(receiveOrder.execute).toHaveBeenCalledWith({ vendorId: 'vendor-1', poId });
  });

  it('should confirm a purchase order', async () => {
    const result = await controller.confirm(poId, user);
    expect(result).toEqual({ data: { order: { id: poId, status: 'CONFIRMED' } } });
    expect(confirmOrder.execute).toHaveBeenCalledWith({ vendorId: 'vendor-1', poId });
  });

  it('should complete a purchase order', async () => {
    const result = await controller.complete(poId, user);
    expect(result).toEqual({ data: { order: { id: poId, status: 'COMPLETED' } } });
    expect(completeOrder.execute).toHaveBeenCalledWith({ vendorId: 'vendor-1', poId });
  });

  it('should cancel a purchase order', async () => {
    const result = await controller.cancel(poId, user);
    expect(result).toEqual({ data: { order: { id: poId, status: 'CANCELLED' } } });
    expect(cancelOrder.execute).toHaveBeenCalledWith({ vendorId: 'vendor-1', poId });
  });

  it('should mark a purchase order unpaid', async () => {
    const result = await controller.payment(poId, { paid: false } as never, user);
    expect(result).toEqual({ data: { order: { id: poId, paymentStatus: 'PAID' } } });
    expect(setPayment.execute).toHaveBeenCalledWith({ vendorId: 'vendor-1', poId, paid: false });
  });

  it('should reject marking a purchase order paid without real funds', async () => {
    await expect(controller.payment(poId, { paid: true } as never, user)).rejects.toThrow(
      'Use POST /vendor/purchase-orders/:id/pay to pay a supplier with real funds',
    );
    expect(setPayment.execute).not.toHaveBeenCalled();
  });

  it('should forbid when the vendor has no manage_products permission', async () => {
    jest
      .spyOn(controller as never, 'resolveContext' as never)
      .mockRejectedValue(new ForbiddenException('You do not have permission to manage inventory') as never);
    await expect(controller.list(user)).rejects.toThrow('You do not have permission to manage inventory');
  });
});