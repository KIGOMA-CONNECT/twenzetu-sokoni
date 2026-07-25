import { Inject, Injectable } from '@nestjs/common';
import { EntityId } from '@afri-market/kernel';
import { Order, IOrderRepository } from '@afri-market/marketplace-domain';
import { ORDER_REPOSITORY } from '../../tokens';

@Injectable()
export class FindOrdersUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orderRepo: IOrderRepository,
  ) {}

  public async findByCustomer(customerId: string): Promise<Order[]> {
    return this.orderRepo.findByCustomerId(customerId);
  }

  public async findByVendor(vendorId: string): Promise<Order[]> {
    return this.orderRepo.findByVendorId(vendorId);
  }

  public async findByDriver(driverId: string): Promise<Order[]> {
    return this.orderRepo.findByDriverId(driverId);
  }

  public async findPendingByVendor(vendorId: string): Promise<Order[]> {
    return this.orderRepo.findPendingByVendor(vendorId);
  }

  public async findById(orderId: string): Promise<Order | null> {
    return this.orderRepo.findById(EntityId.from(orderId));
  }
}
