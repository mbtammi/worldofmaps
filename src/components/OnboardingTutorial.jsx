import { useState } from 'react'
import './OnboardingTutorial.css'

// 4-step welcome flow shown to first-time visitors only (no stored stats + no onboarding flag).
// Skippable — but each step lands one concept so even a quick scroll-through grounds them in the
// puzzle mechanic before they meet the actual game.
const STEPS = [
  {
    icon: '🌍',
    title: 'Welcome to World of Maps',
    body: 'Every day, a new map. Your job: figure out what the world data behind it actually is.',
  },
  {
    icon: '🔎',
    title: 'Read the patterns',
    body: "Each country is colored by a value. Where are the highs? The lows? Continents act like clues — wealth concentrates, languages cluster, climate shows.",
  },
  {
    icon: '🎯',
    title: 'Pick from 10 options',
    body: 'Choose what you think the map is showing. Wrong guesses get removed — narrow it down. Solve in as few tries as possible.',
  },
  {
    icon: '🔥',
    title: 'Come back tomorrow',
    body: "Win today to start a streak. Compare your guess count to the global average. Share your spoiler-safe result — your friends won't see the answer.",
  },
]

export default function OnboardingTutorial({ onComplete }) {
  const [step, setStep] = useState(0)
  const isLast = step === STEPS.length - 1
  const s = STEPS[step]

  const advance = () => {
    if (isLast) onComplete()
    else setStep(step + 1)
  }

  return (
    <div className="onboarding-overlay" role="dialog" aria-modal="true" aria-label="Welcome to World of Maps">
      <div className="onboarding-card">
        <div className="onboarding-icon" aria-hidden="true">{s.icon}</div>
        <h2 className="onboarding-title">{s.title}</h2>
        <p className="onboarding-body">{s.body}</p>

        <div className="onboarding-dots" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
          {STEPS.map((_, i) => (
            <span key={i} className={`onboarding-dot${i === step ? ' onboarding-dot-active' : ''}`} />
          ))}
        </div>

        <div className="onboarding-actions">
          <button type="button" className="onboarding-skip" onClick={onComplete}>
            Skip
          </button>
          <button type="button" className="onboarding-next" onClick={advance}>
            {isLast ? "Play today's map" : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
