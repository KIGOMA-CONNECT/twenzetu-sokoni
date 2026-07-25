import { Inject, Injectable } from '@nestjs/common';
import { EntityId, TenantId } from '@afri-market/kernel';
import { Menu, IMenuRepository } from '@afri-market/marketplace-domain';
import { MENU_REPOSITORY } from '../../tokens';

@Injectable()
export class CreateMenuUseCase {
  constructor(
    @Inject(MENU_REPOSITORY) private readonly menuRepo: IMenuRepository,
  ) {}

  public async execute(
    tenantId: string,
    dto: {
      vendorId: string;
      name: string;
      description?: string;
      availableFrom?: string;
      availableUntil?: string;
    },
  ): Promise<{ menuId: string }> {
    const menu = Menu.create({
      tenantId: TenantId.create(tenantId),
      vendorId: EntityId.from(dto.vendorId),
      name: dto.name,
      description: dto.description,
      availableFrom: dto.availableFrom,
      availableUntil: dto.availableUntil,
    });

    await this.menuRepo.save(menu);

    return { menuId: menu.id.value };
  }
}
