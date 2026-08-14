import { UssdSessionService } from './ussd-session.service';
import { UssdSessionEntity } from './entities/ussd-session.entity';
import { USSD_SESSION_TTL } from './ussd.constants';

function makeEntity(overrides: Partial<UssdSessionEntity> = {}): UssdSessionEntity {
  return {
    sessionId: 'sess-1',
    phoneNumber: '+255754100003',
    tenantId: 'a0000000-0000-0000-0000-000000000002',
    currentMenu: 'shop:cart',
    data: { selectedCategory: 'Electronics' },
    cart: [{ productId: 'p1' }],
    createdAt: new Date(Date.now() - 1000),
    lastAccessedAt: new Date(),
    ...overrides,
  } as UssdSessionEntity;
}

describe('UssdSessionService', () => {
  let service: UssdSessionService;
  const repo = {
    findOne: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UssdSessionService(repo as never);
  });

  it('creates a new session when none exists', async () => {
    repo.findOne.mockResolvedValue(null);

    const session = await service.getOrCreateSession('+255754100003', 'tenant-1', 'sess-1');

    expect(session.currentMenu).toBe('main');
    expect(session.cart).toEqual([]);
    expect(repo.save).toHaveBeenCalledTimes(1);
  });

  it('returns an existing non-expired session', async () => {
    repo.findOne.mockResolvedValue(makeEntity());

    const session = await service.getOrCreateSession('+255754100003', 'tenant-1', 'sess-1');

    expect(session.currentMenu).toBe('shop:cart');
    expect(session.data.selectedCategory).toBe('Electronics');
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('removes and recreates an expired session', async () => {
    repo.findOne.mockResolvedValue(
      makeEntity({ lastAccessedAt: new Date(Date.now() - (USSD_SESSION_TTL + 60) * 1000) }),
    );

    const session = await service.getOrCreateSession('+255754100003', 'tenant-1', 'sess-1');

    expect(repo.remove).toHaveBeenCalledTimes(1);
    expect(session.currentMenu).toBe('main');
  });

  it('updates an existing session on save', async () => {
    repo.findOne.mockResolvedValue(makeEntity());
    repo.save.mockImplementation(async (entity) => entity);

    await service.saveSession({
      sessionId: 'sess-1',
      phoneNumber: '+255754100003',
      tenantId: 'tenant-1',
      currentMenu: 'main',
      data: { fresh: true },
      cart: [],
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
    });

    expect(repo.save).toHaveBeenCalledTimes(1);
    expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ currentMenu: 'main' }));
  });

  it('ends a session by deleting it', async () => {
    await service.endSession('sess-1', '+255754100003');

    expect(repo.delete).toHaveBeenCalledWith({ sessionId: 'sess-1', phoneNumber: '+255754100003' });
  });

  it('deletes expired sessions on cleanup', async () => {
    repo.createQueryBuilder.mockReturnValue({
      delete: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ affected: 5 }),
    });

    const deleted = await service.cleanupExpired();

    expect(deleted).toBe(5);
    expect(repo.createQueryBuilder().where).toHaveBeenCalledWith(
      'last_accessed_at < :cutoff',
      expect.any(Object),
    );
  });
});
