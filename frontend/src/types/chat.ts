export type ChatRole = 'user' | 'assistant'

export interface ChatMessage {
  role: ChatRole
  content: string
}

export interface ChatResponse {
  message: string
}

export function getTextDirection(text: string): 'rtl' | 'ltr' {
  const arabicWords = text.match(/[\u0600-\u06FF]+/g)?.length ?? 0
  const latinWords = text.match(/[A-Za-z]+/g)?.length ?? 0

  if (arabicWords > latinWords) return 'rtl'
  if (latinWords > arabicWords) return 'ltr'

  const lastStrongScript = [...text].reverse().find((character) =>
    /[\u0600-\u06FF]|[A-Za-z]/.test(character),
  )

  return lastStrongScript && /[\u0600-\u06FF]/.test(lastStrongScript) ? 'rtl' : 'ltr'
}
