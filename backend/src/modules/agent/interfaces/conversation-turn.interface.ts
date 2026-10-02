export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
}
