import {
  BadRequestException,
  Inject,
  Injectable,
} from '@nestjs/common';

import  {
  LLMMessage,
  type   LLMProvider,
} from './interfaces/llm-provider.interface';



import { LLM_PROVIDER } from './interfaces/llm-provider.token';

import { AgentToolRegistry } from './tools/agent-tool.registry';
import { TOOL_DEFINITIONS } from './tools/tool-definitions';

const MAX_TOOL_ITERATIONS = 3;

@Injectable()
export class AgentService {
  constructor(
    @Inject(LLM_PROVIDER)
    private readonly llmProvider: LLMProvider,

    private readonly toolRegistry: AgentToolRegistry,
  ) {}

  async run(userMessage: string) {
    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: this.getSystemPrompt(),
      },
      {
        role: 'user',
        content: userMessage,
      },
    ];

    for (
      let iteration = 0;
      iteration < MAX_TOOL_ITERATIONS;
      iteration++
    ) {
      const response =
        await this.llmProvider.generateResponse({
          messages,
          tools: [...TOOL_DEFINITIONS],
        });

      if (!response.toolCalls?.length) {
        return {
          message: response.content ?? '',
        };
      }

      for (const toolCall of response.toolCalls) {
        const tool = this.toolRegistry.getTool(
          toolCall.name,
        );

        if (!tool) {
          throw new BadRequestException(
            `Unknown tool: ${toolCall.name}`,
          );
        }

        const result = await tool.execute(
          toolCall.arguments,
        );

        messages.push({
          role: 'assistant',
          content: JSON.stringify({
            toolCall,
          }),
        });

        messages.push({
          role: 'tool',
          content: JSON.stringify({
            toolCallId: toolCall.id,
            result,
          }),
        });
      }
    }

    throw new BadRequestException(
      'Maximum agent iterations exceeded',
    );
  }

  private getSystemPrompt(): string {
    return `
You are HealTrip AI, a healthcare navigation assistant.

Your role is to help users navigate available healthcare
providers and hospitals. You are NOT a diagnostic engine.

Rules:

1. Understand the user's situation before recommending providers.
2. Ask focused clarification questions when important information
   is missing.
3. Use registered tools when provider or hospital information
   is required.
4. Never invent doctors, hospitals, specialties, credentials,
   availability, prices, or other provider facts.
5. Provider facts must come from tool results.
6. Never access the database directly.
7. Never invent database IDs.
8. Use canonical specialty codes when calling tools.
9. If a tool returns no matching providers, clearly state that
   no matching provider was found in the available data.
10. Do not claim real-time availability.
11. For urgent safety-sensitive situations, do not perform a
    routine provider search.
12. Ask only the minimum useful clarification questions.
`;
  }
}