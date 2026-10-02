export type LLMRole =
  | 'system'
  | 'user'
  | 'assistant'
  | 'tool';

export interface LLMToolCall {
  id: string;
  name: string;
  arguments: unknown;
}

export interface LLMToolDefinition {
  type: 'function';

  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, unknown>;
      required?: string[];
      additionalProperties?: boolean;
    };
  };
}

export interface LLMMessage {
  role: LLMRole;
  content?: string;
  toolCalls?: LLMToolCall[];
  toolCallId?: string;
}

export interface LLMResponse {
  content?: string;
  toolCalls?: LLMToolCall[];
}

export interface LLMProvider {
  generateResponse(params: {
    messages: LLMMessage[];
    tools: LLMToolDefinition[];
  }): Promise<LLMResponse>;
}