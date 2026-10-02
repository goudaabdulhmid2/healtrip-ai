import { BadRequestException } from '@nestjs/common';
import { ChatService } from './chat.service';
import { AgentService } from '../agent/agent.service';

describe('ChatService', () => {
  const run = jest.fn();
  let service: ChatService;

  beforeEach(() => {
    run.mockReset().mockResolvedValue({ message: 'ok' });
    service = new ChatService({ run } as unknown as AgentService);
  });

  it('splits the current user turn from a transcript exactly once', async () => {
    await service.sendMessage({
      messages: [
        { role: 'user', content: 'Need a doctor' },
        { role: 'assistant', content: 'Which city?' },
        { role: 'user', content: 'Madinah' },
      ],
    });
    expect(run).toHaveBeenCalledWith('Madinah', [
      { role: 'user', content: 'Need a doctor' },
      { role: 'assistant', content: 'Which city?' },
    ]);
  });

  it('removes a duplicated current user turn from history', async () => {
    await service.sendMessage({
      message: 'Madinah',
      history: [{ role: 'user', content: 'Madinah' }],
    });
    expect(run).toHaveBeenCalledWith('Madinah', []);
  });

  it('rejects transcripts that do not end with a user turn', async () => {
    await expect(
      service.sendMessage({
        messages: [{ role: 'assistant', content: 'Which city?' }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
