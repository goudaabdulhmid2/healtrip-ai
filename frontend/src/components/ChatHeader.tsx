interface ChatHeaderProps {
  onNewChat: () => void
  disabled: boolean
}

export function ChatHeader({ onNewChat, disabled }: ChatHeaderProps) {
  return (
    <header className="topbar">
      <a className="brand" href="/" aria-label="HealTrip AI home">
        <span className="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 40 40" fill="none">
            <path d="M20 7v26M7 20h26" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
            <circle cx="20" cy="20" r="17" stroke="currentColor" strokeOpacity=".18" strokeWidth="2" />
          </svg>
        </span>
        <span className="brand-copy">
          <strong>HealTrip <span>AI</span></strong>
          <small>Patient Decision Assistant</small>
        </span>
      </a>
      <button className="new-chat-button" type="button" onClick={onNewChat} disabled={disabled}>
        <svg viewBox="0 0 20 20" aria-hidden="true" fill="none">
          <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <span>New Chat</span>
      </button>
    </header>
  )
}
