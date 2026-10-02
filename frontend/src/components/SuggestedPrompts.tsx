const SUGGESTIONS = [
  'I need a cardiologist in Madinah',
  'Which hospitals in Madinah have cardiology?',
  'I need a female dermatologist who speaks Arabic in Madinah',
]

interface SuggestedPromptsProps {
  onSelect: (prompt: string) => void
}

export function SuggestedPrompts({ onSelect }: SuggestedPromptsProps) {
  return (
    <div className="suggestions" aria-label="Suggested questions">
      {SUGGESTIONS.map((suggestion) => (
        <button className="suggestion-button" key={suggestion} type="button" onClick={() => onSelect(suggestion)}>
          <span>{suggestion}</span>
          <svg viewBox="0 0 20 20" aria-hidden="true" fill="none">
            <path d="M4 10h12M10 4l6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      ))}
    </div>
  )
}
