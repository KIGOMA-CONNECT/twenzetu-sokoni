import { Test, TestingModule } from '@nestjs/testing';
import { AddressesController } from './addresses.controller';
import { CreateAddressUseCase, ListAddressesUseCase, DeleteAddressUseCase, SetDefaultAddressUseCase } from '@afri-market/marketplace-application';
import { AuthGuard } from '@nestjs/passport';

describe('AddressesController', () => {
  let controller: AddressesController;
  let createAddress: jest.Mocked<CreateAddressUseCase>;
  let listAddresses: jest.Mocked<ListAddressesUseCase>;
  let deleteAddress: jest.Mocked<DeleteAddressUseCase>;
  let setDefaultAddress: jest.Mocked<SetDefaultAddressUseCase>;

  beforeEach(async () => {
    jest.clearAllMocks();
    createAddress = {
      execute: jest.fn().mockResolvedValue({ addressId: 'addr-1' }),
    } as unknown as jest.Mocked<CreateAddressUseCase>;
    listAddresses = {
      execute: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<ListAddressesUseCase>;
    deleteAddress = {
      execute: jest.fn().mockResolvedValue({ deleted: true }),
    } as unknown as jest.Mocked<DeleteAddressUseCase>;
    setDefaultAddress = {
      execute: jest.fn().mockResolvedValue({ updated: true }),
    } as unknown as jest.Mocked<SetDefaultAddressUseCase>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AddressesController],
      providers: [
        { provide: CreateAddressUseCase, useValue: createAddress },
        { provide: ListAddressesUseCase, useValue: listAddresses },
        { provide: DeleteAddressUseCase, useValue: deleteAddress },
        { provide: SetDefaultAddressUseCase, useValue: setDefaultAddress },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AddressesController>(AddressesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findMyAddresses', () => {
    it('should return addresses for user', async () => {
      const result = await controller.findMyAddresses({ sub: 'user-1' } as never);
      expect(result).toEqual({ data: [] });
      expect(listAddresses.execute).toHaveBeenCalledWith('user-1');
    });
  });

  describe('create', () => {
    it('should create an address', async () => {
      const dto = { label: 'Home', fullAddress: '123 Main St', latitude: 1.0, longitude: 2.0 };
      const result = await controller.create(dto, { sub: 'user-1', tenantId: 't1' } as never);
      expect(result).toEqual({ addressId: 'addr-1' });
      expect(createAddress.execute).toHaveBeenCalledWith('t1', { userId: 'user-1', ...dto });
    });
  });

  describe('remove', () => {
    it('should delete an address', async () => {
      const result = await controller.remove('addr-1', { sub: 'user-1' } as never);
      expect(result).toEqual({ deleted: true });
      expect(deleteAddress.execute).toHaveBeenCalledWith('addr-1', 'user-1');
    });
  });

  describe('setDefault', () => {
    it('should set an address as default', async () => {
      const result = await controller.setDefault('addr-1', { sub: 'user-1' } as never);
      expect(result).toEqual({ updated: true });
      expect(setDefaultAddress.execute).toHaveBeenCalledWith('addr-1', 'user-1');
    });
  });
});
