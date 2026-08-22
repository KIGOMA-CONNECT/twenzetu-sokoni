import { TenantId } from '@afri-market/kernel';
import { MarketingCampaign } from '@afri-market/marketplace-domain';
import { CreateMarketingCampaignUseCase } from '../lib/use-cases/marketing/create-marketing-campaign.use-case';
import { ListMarketingCampaignsUseCase } from '../lib/use-cases/marketing/list-marketing-campaigns.use-case';
import { LaunchMarketingCampaignUseCase } from '../lib/use-cases/marketing/launch-marketing-campaign.use-case';

describe('marketing campaigns', () => {
  let mockRepo: Record<string, jest.Mock>;
  let mockSms: Record<string, jest.Mock>;

  const campaign = () =>
    MarketingCampaign.create({
      tenantId: TenantId.create('t-1'),
      name: 'Mango Sale',
      message: 'Mangoes 30% off this weekend!',
      channel: 'sms',
    });

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo = {
      save: jest.fn().mockResolvedValue(undefined),
      findByIdAndTenant: jest.fn(),
      findByTenant: jest.fn(),
      findAudiencePhoneNumbers: jest.fn(),
      findDueScheduled: jest.fn(),
      saveRecipients: jest.fn().mockResolvedValue(undefined),
      getRecipientStats: jest.fn().mockResolvedValue([]),
    };
    mockSms = {
      send: jest.fn().mockResolvedValue({ success: true, provider: 'mock' }),
    };
  });

  describe('CreateMarketingCampaignUseCase', () => {
    it('should create a DRAFT sms campaign', async () => {
      const useCase = new CreateMarketingCampaignUseCase(mockRepo);
      const result = await useCase.execute('t-1', {
        name: 'Mango Sale',
        message: 'Mangoes 30% off this weekend!',
        channel: 'sms',
      });
      expect(result.campaignId).toBeDefined();
      expect(mockRepo.save).toHaveBeenCalledTimes(1);
      const saved = mockRepo.save.mock.calls[0][0] as MarketingCampaign;
      expect(saved.status).toBe('DRAFT');
      expect(saved.channel).toBe('sms');
      expect(saved.message).toBe('Mangoes 30% off this weekend!');
    });

    it('should reject whatsapp campaigns', async () => {
      const useCase = new CreateMarketingCampaignUseCase(mockRepo);
      await expect(useCase.execute('t-1', { name: 'WA', message: 'Hello', channel: 'whatsapp' }))
        .rejects.toThrow('not yet supported');
      expect(mockRepo.save).not.toHaveBeenCalled();
    });

    it('should reject empty message', async () => {
      const useCase = new CreateMarketingCampaignUseCase(mockRepo);
      await expect(useCase.execute('t-1', { name: 'Bad', message: '   ', channel: 'sms' }))
        .rejects.toThrow('message must not be empty');
    });

    it('should store scheduling and segmentation on the campaign', async () => {
      const useCase = new CreateMarketingCampaignUseCase(mockRepo);
      await useCase.execute('t-1', {
        name: 'Loyalty Blast',
        message: 'Thanks for your orders!',
        channel: 'sms',
        scheduledAt: '2026-12-01T08:00:00.000Z',
        segment: { minOrders: 3, lastOrderWithinDays: 30 },
      });
      const saved = mockRepo.save.mock.calls[0][0] as MarketingCampaign;
      expect(saved.scheduledAt).toEqual(new Date('2026-12-01T08:00:00.000Z'));
      expect(saved.segment).toEqual({ minOrders: 3, lastOrderWithinDays: 30 });
      expect(saved.isScheduled()).toBe(true);
    });

    it('should reject A/B campaigns with fewer than two variants', async () => {
      const useCase = new CreateMarketingCampaignUseCase(mockRepo);
      await expect(
        useCase.execute('t-1', {
          name: 'AB Test',
          message: 'Control message',
          channel: 'sms',
          testEnabled: true,
          variants: [{ message: 'Only one variant' }],
        }),
      ).rejects.toThrow('at least two message variants');
      expect(mockRepo.save).not.toHaveBeenCalled();
    });

    it('should store normalized variants on an A/B campaign', async () => {
      const useCase = new CreateMarketingCampaignUseCase(mockRepo);
      await useCase.execute('t-1', {
        name: 'AB Test',
        message: 'Control message',
        channel: 'sms',
        testEnabled: true,
        variants: [
          { label: 'Discount', message: '20% off today!' },
          { message: 'Free delivery today!' },
        ],
      });
      const saved = mockRepo.save.mock.calls[0][0] as MarketingCampaign;
      expect(saved.testEnabled).toBe(true);
      expect(saved.variants).toHaveLength(2);
      expect(saved.variants[0]).toMatchObject({ index: 0, label: 'Discount', message: '20% off today!' });
      expect(saved.variants[1].label).toBe('Variant B');
    });
  });

  describe('ListMarketingCampaignsUseCase', () => {
    it('should return paginated campaigns', async () => {
      mockRepo.findByTenant.mockResolvedValue({ data: [campaign()], total: 1 });
      const useCase = new ListMarketingCampaignsUseCase(mockRepo);
      const result = await useCase.execute('t-1', { limit: 10, offset: 0 });
      expect(mockRepo.findByTenant).toHaveBeenCalledWith('t-1', { limit: 10, offset: 0 });
      expect(result.total).toBe(1);
      expect(result.data[0].name).toBe('Mango Sale');
    });
  });

  describe('LaunchMarketingCampaignUseCase', () => {
    it('should send SMS to the audience and complete the campaign', async () => {
      const c = campaign();
      mockRepo.findByIdAndTenant.mockResolvedValue(c);
      mockRepo.findAudiencePhoneNumbers.mockResolvedValue(['+255712000001', '+255712000002']);
      mockSms.send.mockResolvedValue({ success: true, provider: 'mock' });

      const useCase = new LaunchMarketingCampaignUseCase(mockRepo, mockSms);
      const result = await useCase.execute('t-1', c.id.value);

      expect(mockSms.send).toHaveBeenCalledTimes(2);
      expect(mockSms.send).toHaveBeenCalledWith({
        to: '+255712000001',
        message: 'Mangoes 30% off this weekend!',
        tenantId: 't-1',
      });
      expect(result.status).toBe('COMPLETED');
      expect(result.totalAudience).toBe(2);
      expect(result.sentCount).toBe(2);
      expect(result.failedCount).toBe(0);
      expect(mockRepo.save).toHaveBeenCalledTimes(2);
    });

    it('should record failed sends', async () => {
      const c = campaign();
      mockRepo.findByIdAndTenant.mockResolvedValue(c);
      mockRepo.findAudiencePhoneNumbers.mockResolvedValue(['+255712000001', '+255712000002']);
      mockSms.send.mockResolvedValueOnce({ success: false, provider: 'mock' });
      mockSms.send.mockResolvedValueOnce({ success: true, provider: 'mock' });

      const useCase = new LaunchMarketingCampaignUseCase(mockRepo, mockSms);
      const result = await useCase.execute('t-1', c.id.value);

      expect(result.sentCount).toBe(1);
      expect(result.failedCount).toBe(1);
    });

    it('should complete with zero audience', async () => {
      const c = campaign();
      mockRepo.findByIdAndTenant.mockResolvedValue(c);
      mockRepo.findAudiencePhoneNumbers.mockResolvedValue([]);

      const useCase = new LaunchMarketingCampaignUseCase(mockRepo, mockSms);
      const result = await useCase.execute('t-1', c.id.value);

      expect(mockSms.send).not.toHaveBeenCalled();
      expect(result.totalAudience).toBe(0);
      expect(result.status).toBe('COMPLETED');
    });

    it('should throw for non-draft campaigns', async () => {
      const c = campaign();
      c.launch(5);
      mockRepo.findByIdAndTenant.mockResolvedValue(c);

      const useCase = new LaunchMarketingCampaignUseCase(mockRepo, mockSms);
      await expect(useCase.execute('t-1', c.id.value)).rejects.toThrow('Only draft campaigns');
    });

    it('should throw when campaign not found', async () => {
      mockRepo.findByIdAndTenant.mockResolvedValue(null);
      const useCase = new LaunchMarketingCampaignUseCase(mockRepo, mockSms);
      await expect(useCase.execute('t-1', 'missing')).rejects.toThrow('Campaign not found');
    });

    it('should pass segment criteria to the audience query', async () => {
      const c = MarketingCampaign.create({
        tenantId: TenantId.create('t-1'),
        name: 'Repeat Buyers',
        message: 'Come back for more!',
        channel: 'sms',
        segment: { minOrders: 2, lastOrderWithinDays: 60 },
      });
      mockRepo.findByIdAndTenant.mockResolvedValue(c);
      mockRepo.findAudiencePhoneNumbers.mockResolvedValue(['+255712000001']);

      const useCase = new LaunchMarketingCampaignUseCase(mockRepo, mockSms);
      await useCase.execute('t-1', c.id.value);

      expect(mockRepo.findAudiencePhoneNumbers).toHaveBeenCalledWith('t-1', {
        limit: 500,
        segment: { minOrders: 2, lastOrderWithinDays: 60 },
      });
    });

    it('should reject launching a campaign scheduled in the future', async () => {
      const future = new Date(Date.now() + 60 * 60 * 1000);
      const c = MarketingCampaign.create({
        tenantId: TenantId.create('t-1'),
        name: 'Tomorrow Sale',
        message: 'Tomorrow only!',
        channel: 'sms',
        scheduledAt: future,
      });
      mockRepo.findByIdAndTenant.mockResolvedValue(c);

      const useCase = new LaunchMarketingCampaignUseCase(mockRepo, mockSms);
      await expect(useCase.execute('t-1', c.id.value)).rejects.toThrow('scheduled for');
      expect(mockSms.send).not.toHaveBeenCalled();
    });

    it('should reject launching a whatsapp campaign', async () => {
      const c = MarketingCampaign.create({
        tenantId: TenantId.create('t-1'),
        name: 'WA Blast',
        message: 'Hello WhatsApp',
        channel: 'whatsapp',
      });
      mockRepo.findByIdAndTenant.mockResolvedValue(c);

      const useCase = new LaunchMarketingCampaignUseCase(mockRepo, mockSms);
      await expect(useCase.execute('t-1', c.id.value)).rejects.toThrow('not configured');
      expect(mockSms.send).not.toHaveBeenCalled();
    });

    it('should bucket A/B recipients deterministically and track per-variant results', async () => {
      const c = MarketingCampaign.create({
        tenantId: TenantId.create('t-1'),
        name: 'AB Launch',
        message: 'Control',
        channel: 'sms',
        testEnabled: true,
        variants: [
          { index: 0, label: 'A', message: 'Variant A body' },
          { index: 1, label: 'B', message: 'Variant B body' },
        ],
      });
      mockRepo.findByIdAndTenant.mockResolvedValue(c);
      mockRepo.findAudiencePhoneNumbers.mockResolvedValue([
        '+255712000001', '+255712000002', '+255712000003', '+255712000004',
      ]);
      mockSms.send.mockResolvedValue({ success: true, provider: 'mock' });

      const useCase = new LaunchMarketingCampaignUseCase(mockRepo, mockSms);
      const result = await useCase.execute('t-1', c.id.value);

      // Every recipient receives one of the two variant bodies.
      const bodies = mockSms.send.mock.calls.map((call) => call[0].message);
      for (const body of bodies) {
        expect(['Variant A body', 'Variant B body']).toContain(body);
      }

      // Bucketing is deterministic: same phone always maps to the same variant.
      const firstRun = mockSms.send.mock.calls.map((call) => [call[0].to, call[0].message]);

      const recipients = mockRepo.saveRecipients.mock.calls[0][2] as Array<{ phoneNumber: string; variantIndex: number }>;
      expect(recipients).toHaveLength(4);
      for (const [phone, message] of firstRun) {
        const recipient = recipients.find((r) => r.phoneNumber === phone);
        const expectedIndex = message === 'Variant A body' ? 0 : 1;
        expect(recipient!.variantIndex).toBe(expectedIndex);
      }

      expect(result.deliveredCount).toBe(4);
      expect(result.variants).toHaveLength(2);
      const totalPerVariant = result.variants!.reduce((sum, v) => sum + v.sent + v.failed, 0);
      expect(totalPerVariant).toBe(4);
    });

    it('should record delivered count on successful sends', async () => {
      const c = campaign();
      mockRepo.findByIdAndTenant.mockResolvedValue(c);
      mockRepo.findAudiencePhoneNumbers.mockResolvedValue(['+255712000001', '+255712000002']);
      mockSms.send.mockResolvedValueOnce({ success: true, provider: 'mock' });
      mockSms.send.mockResolvedValueOnce({ success: false, provider: 'mock' });

      const useCase = new LaunchMarketingCampaignUseCase(mockRepo, mockSms);
      const result = await useCase.execute('t-1', c.id.value);

      expect(result.deliveredCount).toBe(1);
      expect(mockRepo.saveRecipients).toHaveBeenCalledWith(
        't-1',
        c.id.value,
        [
          { phoneNumber: '+255712000001', variantIndex: 0, status: 'SENT' },
          { phoneNumber: '+255712000002', variantIndex: 0, status: 'FAILED' },
        ],
      );
    });
  });
});
