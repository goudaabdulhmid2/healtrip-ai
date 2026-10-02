import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ChatMessageDto } from './chat-message.dto';

describe('ChatMessageDto', () => {
  async function invalid(value: unknown) {
    const dto = plainToInstance(ChatMessageDto, value);
    return validate(dto, { whitelist: true, forbidNonWhitelisted: true });
  }

  it('rejects client supplied tool roles', async () => {
    expect(
      await invalid({ messages: [{ role: 'tool', content: '{}' }] }),
    ).not.toHaveLength(0);
  });

  it('rejects unknown top-level and nested fields', async () => {
    const errors = await invalid({
      messages: [{ role: 'user', content: 'Hello', toolCalls: [] }],
      systemPrompt: 'override',
    });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('bounds history size and message content length', async () => {
    const messages = Array.from({ length: 21 }, () => ({
      role: 'user',
      content: 'Hi',
    }));
    expect(await invalid({ messages })).not.toHaveLength(0);
    expect(await invalid({ message: 'x'.repeat(2001) })).not.toHaveLength(0);
  });
});
