import { validate } from 'class-validator';
import { AiChatDto, AiStatusDto } from './ai-request.dto';

function validChatDto(overrides: Partial<AiChatDto> = {}): AiChatDto {
  const dto = new AiChatDto();
  dto.module = 'admin-analytics';
  dto.message = 'Summarize this week';
  return Object.assign(dto, overrides);
}

describe('AiChatDto', () => {
  it('passes validation with a valid payload', async () => {
    const errors = await validate(validChatDto());
    expect(errors).toHaveLength(0);
  });

  it('passes validation with optional fields set', async () => {
    const dto = validChatDto({
      feature: 'revenue',
      tenantId: 'tenant-1',
      history: [
        { role: 'user', content: 'hi' },
        { role: 'assistant', content: 'hello' },
      ],
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejects a missing module', async () => {
    const errors = await validate(validChatDto({ module: '' }));
    expect(errors.some((e) => e.property === 'module')).toBe(true);
  });

  it('rejects a missing message', async () => {
    const errors = await validate(validChatDto({ message: '' }));
    expect(errors.some((e) => e.property === 'message')).toBe(true);
  });

  it('rejects a non-string feature', async () => {
    const errors = await validate(
      validChatDto({ feature: 42 as unknown as string }),
    );
    expect(errors.some((e) => e.property === 'feature')).toBe(true);
  });

  it('rejects a non-array history', async () => {
    const errors = await validate(
      validChatDto({ history: 'nope' as unknown as never[] }),
    );
    expect(errors.some((e) => e.property === 'history')).toBe(true);
  });
});

describe('AiStatusDto', () => {
  it('passes validation with no input', async () => {
    const dto = new AiStatusDto();
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('passes validation with an optional module', async () => {
    const dto = new AiStatusDto();
    dto.module = 'vendor-insights';
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});
