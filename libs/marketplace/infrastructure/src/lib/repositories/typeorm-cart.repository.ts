import { EntityId, Money, TenantId } from '@afri-market/kernel';
import { TypeOrmRepository } from '@afri-market/database';
import { Injectable } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import {
  Cart,
  CartItem,
  CartStatus,
  ICartRepository,
} from '@afri-market/marketplace-domain';
import { CartOrmEntity } from '../entities/cart-orm.entity';
import { CartItemOrmEntity } from '../entities/cart-item-orm.entity';

@Injectable()
export class TypeOrmCartRepository extends TypeOrmRepository<Cart, CartOrmEntity, EntityId> implements ICartRepository {
  private readonly cartItemRepo: Repository<CartItemOrmEntity>;

  constructor(manager: EntityManager) {
    super(manager, CartOrmEntity);
    this.cartItemRepo = manager.getRepository(CartItemOrmEntity);
  }

  public async findById(id: EntityId): Promise<Cart | null> {
    const entity = await this.repository.findOne({ where: { id: id.value } });
    return entity ? this.toDomain(entity) : null;
  }

  public async findActiveByUserAndVendor(tenantId: string, userId: string, vendorId: string): Promise<Cart | null> {
    const entity = await this.repository.findOne({
      where: { tenantId, userId, vendorId, status: 'ACTIVE' },
    });
    return entity ? this.toDomain(entity) : null;
  }

  public async findByIdAndUser(id: string, userId: string, tenantId: string): Promise<Cart | null> {
    const entity = await this.repository.findOne({ where: { id, userId, tenantId } });
    return entity ? this.toDomain(entity) : null;
  }

  public async save(entity: Cart): Promise<void> {
    const orm = this.toOrm(entity);
    const existing = await this.repository.findOne({ where: { id: entity.id.value } });
    if (existing) {
      await this.repository.save({ ...existing, ...orm });
    } else {
      await this.repository.save(orm as unknown as CartOrmEntity);
    }

    await this.cartItemRepo.delete({ cartId: entity.id.value });
    for (const item of entity.items) {
      await this.cartItemRepo.save(this.toItemOrm(entity, item));
    }
  }

  public async clear(id: string): Promise<void> {
    await this.cartItemRepo.delete({ cartId: id });
  }

  public async delete(id: EntityId): Promise<void> {
    await this.repository.delete(id.value);
  }

  public async exists(id: EntityId): Promise<boolean> {
    const count = await this.repository.count({ where: { id: id.value } });
    return count > 0;
  }

  private async loadItems(cartId: string): Promise<CartItem[]> {
    const rows = await this.cartItemRepo.find({ where: { cartId } });
    return rows.map((r) =>
      CartItem.create(
        { id: r.productId, name: r.productName, price: Money.create(Number(r.unitPrice), r.currency), stockQuantity: r.quantity },
        r.quantity,
        r.id,
      ),
    );
  }

  private async toDomain(e: CartOrmEntity): Promise<Cart> {
    const items = await this.loadItems(e.id);
    return Cart.reconstitute({
      id: EntityId.from(e.id),
      tenantId: TenantId.create(e.tenantId),
      userId: EntityId.from(e.userId),
      vendorId: EntityId.from(e.vendorId),
      currency: e.currency,
      status: e.status as CartStatus,
      items,
      createdAt: e.createdAt ?? new Date(),
    });
  }

  private toOrm(entity: Cart): Partial<CartOrmEntity> {
    return {
      id: entity.id.value,
      tenantId: entity.tenantId.value,
      userId: entity.userId.value,
      vendorId: entity.vendorId.value,
      currency: entity.currency,
      status: entity.status,
      version: 1,
    };
  }

  private toItemOrm(entity: Cart, item: CartItem): CartItemOrmEntity {
    return {
      id: item.id,
      tenantId: entity.tenantId.value,
      cartId: entity.id.value,
      productId: item.productId.value,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice.amount,
      totalPrice: item.totalPrice.amount,
      currency: item.unitPrice.currency,
    } as CartItemOrmEntity;
  }
}
