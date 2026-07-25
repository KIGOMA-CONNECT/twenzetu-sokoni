import { Inject, Injectable } from '@nestjs/common';
import { Menu, IMenuRepository } from '@afri-market/marketplace-domain';
import { MENU_REPOSITORY } from '../../tokens';

@Injectable()
export class ListMenusUseCase {
  constructor(
    @Inject(MENU_REPOSITORY) private readonly menuRepo: IMenuRepository,
  ) {}

  public async execute(vendorId: string): Promise<Menu[]> {
    return this.menuRepo.findActive(vendorId);
  }
}
