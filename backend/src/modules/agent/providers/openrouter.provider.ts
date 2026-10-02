import {
  BadGatewayException,
  Injectable,
} from '@nestjs/common';
import OpenAI from 'openai';

import {
  LLMMessage,
  LLMProvider,
  LLMResponse,
  LLMToolDefinition,
} from '../interfaces/llm-provider.interface';

@Injectable()
export class OpenRouterProvider implements LLMProvider {
  private readonly client: OpenAI;

  constructor() {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      throw new Error(
        'OPENROUTER_API_KEY is not configured',
      );
    }

    this.client = new OpenAI({
      apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
    });
  }

  async generateResponse(params: {
    messages: LLMMessage[];
    tools: LLMToolDefinition[];
  }): Promise<LLMResponse> {
    try {
      const messages = params.messages.map((message) =>
        this.toProviderMessage(message),
      );

      const tools = params.tools.map((tool) => ({
        type: 'function' as const,

        function: {
          name: tool.function.name,
          description: tool.function.description,
          parameters: tool.function.parameters,
        },
      }));

      const response =
        await this.client.chat.completions.create({
          model: 'openrouter/free',
          messages,
          tools,
          tool_choice: 'auto',
        });

      const message = response.choices[0]?.message;

      if (!message) {
        throw new BadGatewayException(
          'LLM returned an empty response',
        );
      }

      const toolCalls = message.tool_calls
        ?.filter(
          (toolCall) => toolCall.type === 'function',
        )
        .map((toolCall) => {
          let arguments_: unknown;

          try {
            arguments_ = JSON.parse(
              toolCall.function.arguments,
            );
          } catch {
            throw new BadGatewayException(
              `Invalid tool arguments returned by LLM for tool: ${toolCall.function.name}`,
            );
          }

          return {
            id: toolCall.id,
            name: toolCall.function.name,
            arguments: arguments_,
          };
        });

      return {
        content: message.content ?? undefined,
        toolCalls,
      };
    } catch (error) {
      if (error instanceof BadGatewayException) {
        throw error;
      }

      throw new BadGatewayException(
        'Failed to communicate with the LLM provider',
      );
    }
  }

  private toProviderMessage(
    message: LLMMessage,
  ): OpenAI.Chat.Completions.ChatCompletionMessageParam {
    switch (message.role) {
      case 'system':
        return {
          role: 'system',
          content: message.content ?? '',
        };

      case 'user':
        return {
          role: 'user',
          content: message.content ?? '',
        };

      case 'assistant':
        return {
          role: 'assistant',
          content: message.content ?? null,

          ...(message.toolCalls?.length
            ? {
                tool_calls: message.toolCalls.map(
                  (toolCall) => ({
                    id: toolCall.id,
                    type: 'function' as const,
                    function: {
                      name: toolCall.name,
                      arguments: JSON.stringify(
                        toolCall.arguments,
                      ),
                    },
                  }),
                ),
              }
            : {}),
        };

      case 'tool':
        if (!message.toolCallId) {
          throw new BadGatewayException(
            'Tool message is missing toolCallId',
          );
        }

        return {
          role: 'tool',
          tool_call_id: message.toolCallId,
          content: message.content ?? '',
        };
    }
  }
}