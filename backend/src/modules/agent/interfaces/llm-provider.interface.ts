export interface LLMMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
}

export interface LLMToolCall {
  id: string;
  name: string;
  arguments: unknown;
}

export interface LLMResponse {
  content?: string;
  toolCalls?: LLMToolCall[];
}

export interface LLMProvider {
  generateResponse(params: {
    messages: LLMMessage[];
    tools: unknown[];
  }): Promise<LLMResponse>;
}