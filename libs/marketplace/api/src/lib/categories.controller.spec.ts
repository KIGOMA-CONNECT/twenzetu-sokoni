import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller';
import { CreateCategoryUseCase, ListCategoriesUseCase } from '@afri-market/marketplace-application';
import { AuthGuard } from '@nestjs/passport';

describe('CategoriesController', () => {
  let controller: CategoriesController;
  let createCategory: jest.Mocked<CreateCategoryUseCase>;
  let listCategories: jest.Mocked<ListCategoriesUseCase>;

  beforeEach(async () => {
    jest.clearAllMocks();
    createCategory = {
      execute: jest.fn().mockResolvedValue({ categoryId: 'cat-1' }),
    } as unknown as jest.Mocked<CreateCategoryUseCase>;
    listCategories = {
      execute: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<ListCategoriesUseCase>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [
        { provide: CreateCategoryUseCase, useValue: createCategory },
        { provide: ListCategoriesUseCase, useValue: listCategories },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<CategoriesController>(CategoriesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return categories for tenant', async () => {
      const result = await controller.findAll({ tenantId: 't1' } as never);
      expect(result).toEqual({ data: [] });
      expect(listCategories.execute).toHaveBeenCalledWith('t1');
    });
  });

  describe('create', () => {
    it('should create a category', async () => {
      const result = await controller.create({ name: 'Food', type: 'food' }, { tenantId: 't1' } as never);
      expect(result).toEqual({ categoryId: 'cat-1' });
      expect(createCategory.execute).toHaveBeenCalledWith('t1', { name: 'Food', type: 'food' });
    });
  });
});
