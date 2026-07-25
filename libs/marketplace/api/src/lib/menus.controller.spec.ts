import { Test, TestingModule } from '@nestjs/testing';
import { MenusController } from './menus.controller';
import { CreateMenuUseCase, ListMenusUseCase } from '@afri-market/marketplace-application';
import { AuthGuard } from '@nestjs/passport';

describe('MenusController', () => {
  let controller: MenusController;
  let createMenu: jest.Mocked<CreateMenuUseCase>;
  let listMenus: jest.Mocked<ListMenusUseCase>;

  beforeEach(async () => {
    jest.clearAllMocks();
    createMenu = {
      execute: jest.fn().mockResolvedValue({ menuId: 'menu-1' }),
    } as unknown as jest.Mocked<CreateMenuUseCase>;
    listMenus = {
      execute: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<ListMenusUseCase>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MenusController],
      providers: [
        { provide: CreateMenuUseCase, useValue: createMenu },
        { provide: ListMenusUseCase, useValue: listMenus },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<MenusController>(MenusController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findByVendor', () => {
    it('should return menus for vendor', async () => {
      const result = await controller.findByVendor('vendor-1');
      expect(result).toEqual({ data: [] });
      expect(listMenus.execute).toHaveBeenCalledWith('vendor-1');
    });
  });

  describe('create', () => {
    it('should create a menu', async () => {
      const dto = { vendorId: 'vendor-1', name: 'Lunch Menu' };
      const result = await controller.create(dto, { tenantId: 't1' } as never);
      expect(result).toEqual({ menuId: 'menu-1' });
      expect(createMenu.execute).toHaveBeenCalledWith('t1', dto);
    });
  });
});
