import { BadRequestException, BadGatewayException } from '@nestjs/common';
import { AgentService } from './agent.service';
import { SafetyGuard } from './safety/safety.guard';
import type { LLMProvider } from './interfaces/llm-provider.interface';
import type { AgentToolRegistry } from './tools/agent-tool.registry';

describe('AgentService', () => {
  let provider: jest.Mocked<LLMProvider>;
  let registry: jest.Mocked<AgentToolRegistry>;
  let agent: AgentService;

  beforeEach(() => {
    provider = { generateResponse: jest.fn() };
    registry = {
      getTool: jest.fn(),
      hasTool: jest.fn(),
    } as unknown as jest.Mocked<AgentToolRegistry>;
    agent = new AgentService(provider, registry, new SafetyGuard());
  });

  it('returns urgent guidance without calling the LLM or a tool', async () => {
    const result = await agent.run(
      'I have severe chest pain and difficulty breathing',
    );
    expect(result.message).toContain('immediate medical attention');
    expect(provider.generateResponse).not.toHaveBeenCalled();
    expect(registry.getTool).not.toHaveBeenCalled();
  });

  it('sends validated prior turns and the current user turn to the provider', async () => {
    provider.generateResponse.mockResolvedValue({ content: 'Which city?' });
    const result = await agent.run('Cardiology', [
      { role: 'user', content: 'I need a doctor' },
      { role: 'assistant', content: 'Which specialty?' },
    ]);
    expect(result.message).toBe('Which city?');
    expect(
      provider.generateResponse.mock.calls[0][0].messages.slice(1),
    ).toEqual([
      { role: 'user', content: 'I need a doctor' },
      { role: 'assistant', content: 'Which specialty?' },
      { role: 'user', content: 'Cardiology' },
    ]);
  });

  it('rejects unknown model tool names as an upstream failure', async () => {
    provider.generateResponse.mockResolvedValue({
      toolCalls: [{ id: 'call-1', name: 'run_sql', arguments: {} }],
    });
    await expect(agent.run('Find a cardiologist')).rejects.toBeInstanceOf(
      BadGatewayException,
    );
    expect(registry.getTool).toHaveBeenCalledWith('run_sql');
  });

  it('rejects an empty final provider response', async () => {
    provider.generateResponse.mockResolvedValue({ content: '  ' });
    await expect(agent.run('Hello')).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });

  it('returns a safe tool error for invalid tool arguments and continues', async () => {
    const execute = jest
      .fn()
      .mockRejectedValue(
        new BadRequestException('Unsupported specialty: SECRET'),
      );
    registry.getTool.mockReturnValue({ execute });
    provider.generateResponse
      .mockResolvedValueOnce({
        toolCalls: [
          {
            id: 'call-1',
            name: 'search_doctors',
            arguments: { specialty: 'SECRET' },
          },
        ],
      })
      .mockResolvedValueOnce({ content: 'Please clarify the specialty.' });

    const result = await agent.run('Find a doctor');
    expect(result.message).toBe('Please clarify the specialty.');
    const secondCall = provider.generateResponse.mock.calls[1][0].messages;
    expect(secondCall.at(-1)?.content).toContain(
      'invalid_or_unsupported_tool_arguments',
    );
    expect(secondCall.at(-1)?.content).not.toContain('SECRET');
  });

  it('returns a gateway error after exhausting the bounded tool loop', async () => {
    registry.getTool.mockReturnValue({
      execute: jest.fn().mockResolvedValue({ success: true }),
    });
    provider.generateResponse.mockResolvedValue({
      toolCalls: [
        {
          id: 'call-1',
          name: 'search_hospitals',
          arguments: { city: 'Madinah' },
        },
      ],
    });
    await expect(agent.run('Find a hospital')).rejects.toBeInstanceOf(
      BadGatewayException,
    );
    expect(provider.generateResponse).toHaveBeenCalledTimes(3);
  });
});
