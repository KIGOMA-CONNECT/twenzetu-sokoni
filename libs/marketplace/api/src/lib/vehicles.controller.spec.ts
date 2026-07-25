import { Test, TestingModule } from '@nestjs/testing';
import { VehiclesController } from './vehicles.controller';
import {
  RegisterVehicleUseCase,
  UpdateVehicleLocationUseCase,
  ListDriverVehiclesUseCase,
} from '@afri-market/marketplace-application';

describe('VehiclesController', () => {
  let controller: VehiclesController;
  let registerVehicle: jest.Mocked<RegisterVehicleUseCase>;
  let updateLocation: jest.Mocked<UpdateVehicleLocationUseCase>;
  let listDriverVehicles: jest.Mocked<ListDriverVehiclesUseCase>;

  beforeEach(async () => {
    jest.clearAllMocks();
    registerVehicle = {
      execute: jest.fn().mockResolvedValue({ id: 'v-1', vehicleType: 'boda', plateNumber: 'RA 123 A' }),
    } as unknown as jest.Mocked<RegisterVehicleUseCase>;
    updateLocation = {
      execute: jest.fn().mockResolvedValue({ id: 'v-1', latitude: -1.9403, longitude: 29.8739 }),
    } as unknown as jest.Mocked<UpdateVehicleLocationUseCase>;
    listDriverVehicles = {
      execute: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<ListDriverVehiclesUseCase>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VehiclesController],
      providers: [
        { provide: RegisterVehicleUseCase, useValue: registerVehicle },
        { provide: UpdateVehicleLocationUseCase, useValue: updateLocation },
        { provide: ListDriverVehiclesUseCase, useValue: listDriverVehicles },
      ],
    }).compile();

    controller = module.get<VehiclesController>(VehiclesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register a vehicle and return data', async () => {
      const result = await controller.register(
        { sub: 'driver-1', tenantId: 't-1', role: 'DRIVER', phoneNumber: '+250' },
        { vehicleType: 'boda', plateNumber: 'RA 123 A', capacityKg: 20 },
      );
      expect(result).toEqual({ data: { id: 'v-1', vehicleType: 'boda', plateNumber: 'RA 123 A' } });
      expect(registerVehicle.execute).toHaveBeenCalledWith('t-1', {
        driverId: 'driver-1',
        vehicleType: 'boda',
        plateNumber: 'RA 123 A',
        capacityKg: 20,
      });
    });
  });

  describe('updateVehicleLocation', () => {
    it('should update location and return data', async () => {
      const result = await controller.updateVehicleLocation('v-1', {
        latitude: -1.9403,
        longitude: 29.8739,
      });
      expect(result).toEqual({ data: { id: 'v-1', latitude: -1.9403, longitude: 29.8739 } });
      expect(updateLocation.execute).toHaveBeenCalledWith('v-1', -1.9403, 29.8739);
    });
  });

  describe('getMyVehicles', () => {
    it('should return the drivers vehicles', async () => {
      const result = await controller.getMyVehicles({
        sub: 'driver-1',
        tenantId: 't-1',
        role: 'DRIVER',
        phoneNumber: '+250',
      });
      expect(result).toEqual({ data: [] });
      expect(listDriverVehicles.execute).toHaveBeenCalledWith('driver-1');
    });
  });
});
