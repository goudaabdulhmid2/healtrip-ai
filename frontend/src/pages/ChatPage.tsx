import { useEffect, useRef, useState } from 'react'
import { sendChatMessage } from '../api/chat'
import { ChatHeader } from '../components/ChatHeader'
import { ChatInput } from '../components/ChatInput'
import { ChatMessage } from '../components/ChatMessage'
import { SuggestedPrompts } from '../components/SuggestedPrompts'
import { TypingIndicator } from '../components/TypingIndicator'
import type { ChatMessage as ChatMessageType } from '../types/chat'
import { getTextDirection } from '../types/chat'

const ERROR_MESSAGE = "Sorry, I couldn't process that request right now. Please try again."

export function ChatPage() {
  const [messages, setMessages] = useState<ChatMessageType[]>([])
  const [draft, setDraft] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [retryTranscript, setRetryTranscript] = useState<ChatMessageType[] | null>(null)
  const conversationRef = useRef<HTMLDivElement>(null)
  const requestRef = useRef<AbortController | null>(null)
  const isLoadingRef = useRef(false)

  useEffect(() => {
    conversationRef.current?.scrollTo({ top: conversationRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, isLoading, hasError])

  async function requestReply(transcript: ChatMessageType[]) {
    if (isLoadingRef.current) return

    const controller = new AbortController()
    requestRef.current = controller
    isLoadingRef.current = true
    setIsLoading(true)
    setHasError(false)

    try {
      const response = await sendChatMessage(transcript, controller.signal)
      if (controller.signal.aborted) return
      setMessages((current) => [...current, { role: 'assistant', content: response.message }])
      setRetryTranscript(null)
    } catch {
      if (controller.signal.aborted) return
      setHasError(true)
      setRetryTranscript(transcript)
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null
        isLoadingRef.current = false
        setIsLoading(false)
      }
    }
  }

  function submitMessage(rawMessage: string) {
    if (isLoadingRef.current) return
    const content = rawMessage.trim()
    if (!content) return

    const nextMessages = [...messages, { role: 'user' as const, content }]
    setMessages(nextMessages)
    setDraft('')
    setHasError(false)
    setRetryTranscript(null)
    void requestReply(nextMessages)
  }

  function retry() {
    if (retryTranscript) void requestReply(retryTranscript)
  }

  function startNewChat() {
    requestRef.current?.abort()
    requestRef.current = null
    isLoadingRef.current = false
    setMessages([])
    setDraft('')
    setIsLoading(false)
    setHasError(false)
    setRetryTranscript(null)
  }

  const latestUserMessage = [...messages].reverse().find((message) => message.role === 'user')
  const pageDirection = getTextDirection(latestUserMessage?.content ?? '')

  return (
    <div className="app-shell" dir={pageDirection}>
      <ChatHeader onNewChat={startNewChat} disabled={false} />

      <main className={`chat-main ${messages.length === 0 ? 'chat-main-empty' : ''}`}>
        {messages.length === 0 ? (
          <section className="empty-state" aria-labelledby="welcome-title">
            <div className="welcome-icon" aria-hidden="true">
              <svg viewBox="0 0 52 52" fill="none">
                <path d="M26 13v26M13 26h26" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
                <circle cx="26" cy="26" r="24" stroke="currentColor" strokeOpacity=".2" strokeWidth="2" />
              </svg>
            </div>
            <p className="eyebrow">YOUR CARE, MADE CLEARER</p>
            <h1 id="welcome-title">How can I help you<br className="desktop-break" /> find the right care?</h1>
            <p className="welcome-copy">I can help you navigate doctors and hospitals based on your needs and available information.</p>
            <SuggestedPrompts onSelect={submitMessage} />
            <p className="disclaimer">Care-navigation guidance only. Not medical diagnosis or emergency care.</p>
          </section>
        ) : (
          <div className="conversation" ref={conversationRef} role="log" aria-label="Conversation" aria-live="polite" aria-relevant="additions text">
            <div className="conversation-inner">
              {messages.map((message, index) => <ChatMessage key={`${index}-${message.role}`} message={message} />)}
              {isLoading && <TypingIndicator />}
              {hasError && (
                <div className="message-row message-row-assistant" role="alert">
                  <span className="assistant-avatar" aria-hidden="true">H</span>
                  <div className="error-bubble">
                    <p>{ERROR_MESSAGE}</p>
                    <button type="button" onClick={retry} disabled={isLoading || !retryTranscript}>Try again</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="composer-area">
        <div className="composer-wrap">
          <ChatInput value={draft} isLoading={isLoading} onChange={setDraft} onSubmit={() => submitMessage(draft)} />
          <p className="composer-caption">HealTrip AI can make mistakes. Confirm important information with a qualified professional.</p>
        </div>
      </footer>
    </div>
  )
}
