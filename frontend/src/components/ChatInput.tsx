import { useRef, type FormEvent, type KeyboardEvent } from 'react'

interface ChatInputProps {
  value: string
  isLoading: boolean
  onChange: (value: string) => void
  onSubmit: () => void
}

export function ChatInput({ value, isLoading, onChange, onSubmit }: ChatInputProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const canSend = value.trim().length > 0 && !isLoading

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (canSend) onSubmit()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      if (canSend) onSubmit()
    }
  }

  return (
    <form className="composer" onSubmit={handleSubmit}>
      <label className="sr-only" htmlFor="chat-input">Message HealTrip AI</label>
      <textarea
        ref={inputRef}
        id="chat-input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask about doctors or hospitals..."
        rows={1}
        maxLength={2000}
        disabled={isLoading}
        dir="auto"
        aria-describedby="composer-hint"
      />
      <button className="send-button" type="submit" disabled={!canSend} aria-label="Send message">
        <svg viewBox="0 0 20 20" aria-hidden="true" fill="none">
          <path d="M3 10h13M10 4l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <span className="sr-only" id="composer-hint">Press Enter to send. Press Shift and Enter for a new line.</span>
    </form>
  )
}
