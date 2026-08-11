import { AggregateRoot, EntityId, Guard, Money, TenantId } from '@afri-market/kernel';
import { ProductStatus } from './product-status';
import { ProductType } from './product-type';

export interface CreateProductProps {
  readonly tenantId: TenantId;
  readonly vendorId: EntityId;
  readonly name: string;
  readonly description: string;
  readonly price: Money;
  readonly type: ProductType;
  readonly categoryId: EntityId;
  readonly imageUrl?: string;
  readonly stockQuantity?: number;
  readonly unit?: string;
  readonly sku?: string;
  readonly barcode?: string;
}

export interface ReconstituteProductProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly vendorId: EntityId;
  readonly name: string;
  readonly description: string;
  readonly price: Money;
  readonly type: ProductType;
  readonly categoryId: EntityId | undefined;
  readonly imageUrl: string | undefined;
  readonly stockQuantity: number;
  readonly unit: string;
  readonly sku: string | undefined;
  readonly barcode: string | undefined;
  readonly status: ProductStatus;
  readonly version: number;
}

export class Product extends AggregateRoot<EntityId> {
  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private readonly _vendorId: EntityId,
    private _name: string,
    private _description: string,
    private _price: Money,
    private _type: ProductType,
    private readonly _categoryId: EntityId | undefined,
    private _imageUrl: string | undefined,
    private _stockQuantity: number,
    private _unit: string,
    private _sku: string | undefined,
    private _barcode: string | undefined,
    private _status: ProductStatus,
    private readonly _version: number,
  ) {
    super(id);
  }

  public static create(props: CreateProductProps): Product {
    Guard.assert(Guard.againstEmptyString(props.name, 'name'));
    return new Product(
      EntityId.create(), props.tenantId, props.vendorId, props.name,
      props.description, props.price, props.type, props.categoryId,
      props.imageUrl, props.stockQuantity ?? 0, props.unit ?? 'piece',
      props.sku, props.barcode, 'ACTIVE', 1,
    );
  }

  public static reconstitute(props: ReconstituteProductProps): Product {
    return new Product(
      props.id, props.tenantId, props.vendorId, props.name,
      props.description, props.price, props.type, props.categoryId,
      props.imageUrl, props.stockQuantity, props.unit, props.sku, props.barcode,
      props.status, props.version,
    );
  }

  public get tenantId(): TenantId { return this._tenantId; }
  public get vendorId(): EntityId { return this._vendorId; }
  public get name(): string { return this._name; }
  public get description(): string { return this._description; }
  public get price(): Money { return this._price; }
  public get type(): ProductType { return this._type; }
  public get categoryId(): EntityId | undefined { return this._categoryId; }
  public get imageUrl(): string | undefined { return this._imageUrl; }
  public get stockQuantity(): number { return this._stockQuantity; }
  public get unit(): string { return this._unit; }
  public get sku(): string | undefined { return this._sku; }
  public get barcode(): string | undefined { return this._barcode; }
  public get status(): ProductStatus { return this._status; }
  public get version(): number { return this._version; }

  public updatePrice(newPrice: Money): void { this._price = newPrice; }
  public reduceStock(quantity: number): void {
    if (this._stockQuantity < quantity) throw new Error('Insufficient stock');
    this._stockQuantity -= quantity;
  }
  public markOutOfStock(): void { this._status = 'OUT_OF_STOCK'; }
  public activate(): void { this._status = 'ACTIVE'; }
  public deactivate(): void { this._status = 'INACTIVE'; }

  public toDto() {
    return {
      id: this.id.value,
      vendorId: this._vendorId.value,
      name: this._name,
      description: this._description,
      price: this._price.amount,
      currency: this._price.currency,
      type: this._type,
      categoryId: this._categoryId?.value ?? null,
      imageUrl: this._imageUrl,
      stockQuantity: this._stockQuantity,
      unit: this._unit,
      sku: this._sku ?? null,
      barcode: this._barcode ?? null,
      status: this._status,
    };
  }
}
