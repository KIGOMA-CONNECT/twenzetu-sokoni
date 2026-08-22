import { Inject, Injectable } from '@nestjs/common';
import { EntityId } from '@afri-market/kernel';
import { Order, IOrderRepository } from '@afri-market/marketplace-domain';
import { ORDER_REPOSITORY } from '../../tokens';

@Injectable()
export class FindOrdersUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orderRepo: IOrderRepository,
  ) {}

  public async findByCustomer(
    customerId: string,
    opts?: { status?: string; limit?: number; offset?: number },
  ): Promise<{ data: Order[]; total: number }> {
    return this.orderRepo.findByCustomerId(customerId, opts);
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
