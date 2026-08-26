import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from '@nestjs/passport';
import {
  CreateSupplierUseCase,
  ListSuppliersUseCase,
  UpdateSupplierUseCase,
  DeleteSupplierUseCase,
  VendorAccessService,
} from '@afri-market/marketplace-application';
import { VendorSuppliersController } from './vendor-suppliers.controller';

describe('VendorSuppliersController', () => {
  let controller: VendorSuppliersController;
  let createSupplier: jest.Mocked<CreateSupplierUseCase>;
  let listSuppliers: jest.Mocked<ListSuppliersUseCase>;
  let updateSupplier: jest.Mocked<UpdateSupplierUseCase>;
  let deleteSupplier: jest.Mocked<DeleteSupplierUseCase>;

  const user = { sub: 'operator-1', tenantId: 'tenant-1' } as never;
  const supplierId = '22222222-2222-2222-2222-222222222222';

  beforeEach(async () => {
    jest.clearAllMocks();
    createSupplier = { execute: jest.fn().mockResolvedValue({ supplier: { id: supplierId } }) } as unknown as jest.Mocked<CreateSupplierUseCase>;
    listSuppliers = { execute: jest.fn().mockResolvedValue([]) } as unknown as jest.Mocked<ListSuppliersUseCase>;
    updateSupplier = { execute: jest.fn().mockResolvedValue({ supplier: { id: supplierId } }) } as unknown as jest.Mocked<UpdateSupplierUseCase>;
    deleteSupplier = { execute: jest.fn().mockResolvedValue({ deleted: true }) } as unknown as jest.Mocked<DeleteSupplierUseCase>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VendorSuppliersController],
      providers: [
        { provide: CreateSupplierUseCase, useValue: createSupplier },
        { provide: ListSuppliersUseCase, useValue: listSuppliers },
        { provide: UpdateSupplierUseCase, useValue: updateSupplier },
        { provide: DeleteSupplierUseCase, useValue: deleteSupplier },
        {
          provide: VendorAccessService,
          useValue: { assertPermission: jest.fn().mockResolvedValue({ vendorId: 'vendor-1' }) },
        },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<VendorSuppliersController>(VendorSuppliersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should list suppliers', async () => {
    const result = await controller.list(user);
    expect(result).toEqual({ data: [] });
    expect(listSuppliers.execute).toHaveBeenCalledWith('vendor-1');
  });

  it('should create a supplier', async () => {
    const dto = { name: 'Central Millers', phone: '+255700000000', contactPerson: 'Jane', notes: 'wheat', linkedVendorId: supplierId };
    const result = await controller.create(dto as never, user);
    expect(result).toEqual({ supplier: { id: supplierId } });
    expect(createSupplier.execute).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      vendorId: 'vendor-1',
      name: 'Central Millers',
      phone: '+255700000000',
      contactPerson: 'Jane',
      notes: 'wheat',
      linkedVendorId: supplierId,
    });
  });

  it('should delete a supplier', async () => {
    const result = await controller.remove(supplierId, user);
    expect(result).toEqual({ data: { deleted: true } });
    expect(deleteSupplier.execute).toHaveBeenCalledWith({ vendorId: 'vendor-1', supplierId });
  });

  it('should forbid when the vendor has no manage_products permission', async () => {
    jest
      .spyOn(controller as never, 'resolveContext' as never)
      .mockRejectedValue(new ForbiddenException('You do not have permission to manage inventory') as never);
    await expect(controller.list(user)).rejects.toThrow('You do not have permission to manage inventory');
  });
});