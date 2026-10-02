export function TypingIndicator() {
  return (
    <div className="message-row message-row-assistant" role="status" aria-label="HealTrip AI is thinking">
      <span className="assistant-avatar" aria-hidden="true">H</span>
      <div className="typing-bubble">
        <span>Thinking</span>
        <span className="typing-dots" aria-hidden="true"><i /><i /><i /></span>
      </div>
    </div>
  )
}
