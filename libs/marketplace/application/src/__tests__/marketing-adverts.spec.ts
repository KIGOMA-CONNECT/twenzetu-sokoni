import { TenantId } from '@afri-market/kernel';
import { Advert, ProductCategory } from '@afri-market/marketplace-domain';
import { ListActiveAdsUseCase } from '../lib/use-cases/marketing/list-active-ads.use-case';
import { ListAdvertsUseCase } from '../lib/use-cases/marketing/list-adverts.use-case';
import { CreateAdvertUseCase } from '../lib/use-cases/marketing/create-advert.use-case';

describe('marketing adverts', () => {
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo = {
      findActive: jest.fn(),
      findByTenant: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
    };
  });

  describe('ListActiveAdsUseCase', () => {
    it('should return empty when there are no adverts', async () => {
      mockRepo.findActive.mockResolvedValue([]);
      const useCase = new ListActiveAdsUseCase(mockRepo);
      const result = await useCase.execute('t-1');
      expect(result).toEqual([]);
      expect(mockRepo.findActive).toHaveBeenCalledWith('t-1');
    });

    it('should return active adverts', async () => {
      const ad = Advert.create({
        tenantId: TenantId.create('t-1'),
        title: 'Tuma Mizigo',
        body: 'Express Delivery',
        emoji: '🚚',
        ctaLabel: 'Anza Sasa',
        ctaUrl: '/cargo',
        sortOrder: 10,
      });
      mockRepo.findActive.mockResolvedValue([ad]);
      const useCase = new ListActiveAdsUseCase(mockRepo);
      const result = await useCase.execute('t-1');
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Tuma Mizigo');
      expect(result[0].emoji).toBe('🚚');
    });
  });

  describe('ListAdvertsUseCase', () => {
    it('should pass pagination options to the repository', async () => {
      mockRepo.findByTenant.mockResolvedValue({ data: [], total: 0 });
      const useCase = new ListAdvertsUseCase(mockRepo);
      const result = await useCase.execute('t-1', { limit: 10, offset: 5 });
      expect(mockRepo.findByTenant).toHaveBeenCalledWith('t-1', { limit: 10, offset: 5 });
      expect(result.total).toBe(0);
    });
  });

  describe('CreateAdvertUseCase', () => {
    it('should create and save an advert', async () => {
      const useCase = new CreateAdvertUseCase(mockRepo);
      const result = await useCase.execute('t-1', {
        title: 'Chakula Kitamu',
        emoji: '🍲',
        ctaUrl: '/vendors?category=food',
        sortOrder: 20,
      });
      expect(result.advertId).toBeDefined();
      expect(mockRepo.save).toHaveBeenCalledTimes(1);
      const saved = mockRepo.save.mock.calls[0][0] as Advert;
      expect(saved.title).toBe('Chakula Kitamu');
      expect(saved.sortOrder).toBe(20);
    });

    it('should throw when title is empty', async () => {
      const useCase = new CreateAdvertUseCase(mockRepo);
      await expect(useCase.execute('t-1', { title: '   ' })).rejects.toThrow('title must not be empty');
    });
  });

  describe('Advert aggregate', () => {
    it('should be currently active only within its date window', () => {
      const now = new Date('2026-08-11T10:00:00Z');
      const active = Advert.create({
        tenantId: TenantId.create('t-1'),
        title: 'Offer',
        startsAt: new Date('2026-08-01T00:00:00Z'),
        endsAt: new Date('2026-09-01T00:00:00Z'),
      });
      expect(active.isCurrentlyActive(now)).toBe(true);

      const notYet = Advert.create({
        tenantId: TenantId.create('t-1'),
        title: 'Future',
        startsAt: new Date('2026-09-01T00:00:00Z'),
      });
      expect(notYet.isCurrentlyActive(now)).toBe(false);

      const ended = Advert.create({
        tenantId: TenantId.create('t-1'),
        title: 'Ended',
        endsAt: new Date('2026-01-01T00:00:00Z'),
      });
      expect(ended.isCurrentlyActive(now)).toBe(false);

      const disabled = Advert.create({ tenantId: TenantId.create('t-1'), title: 'Off' });
      disabled.deactivate();
      expect(disabled.isCurrentlyActive(now)).toBe(false);
    });
  });
});

describe('ProductCategory marketing fields', () => {
  it('should create a category with marketing data', () => {
    const category = ProductCategory.create({
      tenantId: TenantId.create('t-1'),
      name: 'Cargo',
      type: 'cargo',
      tagline: 'Tuma mizigo haraka na usalama',
      benefits: ['Express delivery', 'Kukodisha lori'],
      emoji: '🚚',
    });

    const dto = category.toDto();
    expect(dto.tagline).toBe('Tuma mizigo haraka na usalama');
    expect(dto.benefits).toEqual(['Express delivery', 'Kukodisha lori']);
    expect(dto.emoji).toBe('🚚');
  });

  it('should default marketing fields to empty values', () => {
    const category = ProductCategory.create({
      tenantId: TenantId.create('t-1'),
      name: 'Mboga',
      type: 'grocery',
    });

    const dto = category.toDto();
    expect(dto.tagline).toBeNull();
    expect(dto.benefits).toEqual([]);
    expect(dto.emoji).toBeNull();
  });

  it('should allow updating marketing data', () => {
    const category = ProductCategory.create({
      tenantId: TenantId.create('t-1'),
      name: 'Mboga',
      type: 'grocery',
    });

    category.updateMarketing({ tagline: 'Fresh kila siku', benefits: ['Kinafikishwa mlangoni'], emoji: '🥬' });
    expect(category.tagline).toBe('Fresh kila siku');
    expect(category.benefits).toEqual(['Kinafikishwa mlangoni']);
    expect(category.emoji).toBe('🥬');
  });
});
