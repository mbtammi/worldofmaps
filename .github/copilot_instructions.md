<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit:
https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# World of Maps - Copilot Instructions

This project is a fun, game-first geography/data puzzle app. It must feel simple and addictive like Wordle, but visually engaging with maps.

## Core Development Principles
- **Don’t give me full solutions immediately.**
  - Guide me step by step.
  - Explain why code is written the way it is.
  - Help me understand map libraries, state management, and guessing logic before showing final code.

- **Focus on gameplay, not complexity.**
  - One daily map challenge (no user accounts needed at first).
  - Basic guess/check system.
  - Shareable results grid.

- **Data handling must be modular.**
  - Keep datasets separate from game logic.
  - Allow easy swapping of map data sources.

- **No hardcoding of answers in the core logic.**
  - The game engine should compare guesses against dataset metadata.
  - Hints and fun facts must come from data definitions, not inline strings.

## Tech Stack Rules
- **Language**: JavaScript (not TypeScript for MVP).
- **Framework**: React + Vite.
- **Styling**: Traditional CSS only (no Tailwind, no styled-components).
- **Maps**: Globe.GL, Leaflet.js or Mapbox GL JS for choropleth rendering.
- **State**: Start with React hooks; Zustand can be added later if needed.

## Project Structure
- `/src/components` → Reusable UI (MapView, GuessInput, ResultModal)
- `/src/data` → Dataset definitions + sample maps
- `/src/hooks` → Custom React hooks
- `/src/utils` → Helper functions (string matching, hint system)

## Development Goals
1. Ship a playable MVP with:
   - One hardcoded dataset
   - Guessing input
   - Win/lose reveal
2. Expand to multiple datasets
3. Add streaks + share results
4. Polish map styling for a clean, shareable experience

## Style & Best Practices
- Keep code **readable and modular**.
- Use **functional components** with hooks.
- Write **clear comments** for key logic (map rendering, answer checking).
- Don’t over-engineer — simplicity is key.
- Ensure the app is responsive and mobile-friendly.

