import type { ChatMessage as ChatMessageType } from '../types/chat'
import { getTextDirection } from '../types/chat'

interface ChatMessageProps {
  message: ChatMessageType
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <article className={`message-row ${isUser ? 'message-row-user' : 'message-row-assistant'}`}>
      {!isUser && <span className="assistant-avatar" aria-hidden="true">H</span>}
      <div
        className={`message-bubble ${isUser ? 'message-bubble-user' : 'message-bubble-assistant'}`}
        dir={getTextDirection(message.content)}
        lang={getTextDirection(message.content) === 'rtl' ? 'ar' : 'en'}
      >
        {message.content}
      </div>
    </article>
  )
}
