import type { ChatMessage, ChatResponse } from '../types/chat'

const MAX_MESSAGES = 20
const MAX_MESSAGE_LENGTH = 2000
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')

export async function sendChatMessage(
  messages: ChatMessage[],
  signal?: AbortSignal,
): Promise<ChatResponse> {
  const boundedMessages = messages.slice(-MAX_MESSAGES).map((message) => ({
    role: message.role,
    content: message.content.slice(0, MAX_MESSAGE_LENGTH),
  }))

  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: boundedMessages }),
    signal,
  })

  if (!response.ok) throw new Error('Chat request failed')

  const result: unknown = await response.json()
  if (
    typeof result !== 'object' ||
    result === null ||
    !('message' in result) ||
    typeof result.message !== 'string'
  ) {
    throw new Error('Invalid chat response')
  }

  return { message: result.message }
}
