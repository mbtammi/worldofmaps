// Game Manager - handles daily dataset selection and game state
import populationDensityDataset from './populationDensity.js'

// Available datasets (we'll add more later)
const availableDatasets = [
  populationDensityDataset,
  // TODO: Add more datasets like coffee consumption, internet usage, etc.
]

// Get today's dataset (for now, just use the first one)
// Later we can use date-based selection for truly daily challenges
export const getTodaysDataset = () => {
  // Simple implementation for MVP - always return population density
  // In production, we'd use date math: 
  // const daysSinceEpoch = Math.floor(Date.now() / (1000 * 60 * 60 * 24))
  // return availableDatasets[daysSinceEpoch % availableDatasets.length]
  
  return availableDatasets[0]
}

// Game state management
export const createGameState = (dataset) => ({
  dataset,
  guesses: [],
  incorrectOptions: [], // Track removed wrong options
  availableOptions: [...dataset.options], // Copy of all options
  hintsRevealed: 0,
  isComplete: false,
  isWon: false,
  currentHint: null
})

// Check if a selected option matches the correct answer
export const checkGuess = (selectedOption, dataset) => {
  return dataset.correctAnswers.some(answer => 
    selectedOption.toLowerCase() === answer.toLowerCase()
  )
}

// Remove wrong options after incorrect guess
const removeWrongOptions = (availableOptions, selectedOption, correctAnswers) => {
  let optionsToRemove = [selectedOption] // Always remove the selected wrong option
  
  // Remove one additional random wrong option (but not the correct answer)
  const wrongOptions = availableOptions.filter(option => 
    option !== selectedOption && 
    !correctAnswers.some(answer => answer.toLowerCase() === option.toLowerCase())
  )
  
  if (wrongOptions.length > 0) {
    const randomWrongOption = wrongOptions[Math.floor(Math.random() * wrongOptions.length)]
    optionsToRemove.push(randomWrongOption)
  }
  
  return availableOptions.filter(option => !optionsToRemove.includes(option))
}

// Get the next hint for wrong guesses
export const getNextHint = (currentHintIndex, dataset) => {
  if (currentHintIndex < dataset.hints.length) {
    return {
      hint: dataset.hints[currentHintIndex],
      index: currentHintIndex + 1
    }
  }
  return null
}

// Update game state after a guess
export const processGuess = (gameState, selectedOption) => {
  const isCorrect = checkGuess(selectedOption, gameState.dataset)
  const newGuesses = [...gameState.guesses, { guess: selectedOption, isCorrect }]
  
  if (isCorrect) {
    return {
      ...gameState,
      guesses: newGuesses,
      isComplete: true,
      isWon: true
    }
  } else {
    // Wrong guess - remove wrong options and reveal next hint
    const newAvailableOptions = removeWrongOptions(
      gameState.availableOptions, 
      selectedOption, 
      gameState.dataset.correctAnswers
    )
    const hintData = getNextHint(gameState.hintsRevealed, gameState.dataset)
    
    return {
      ...gameState,
      guesses: newGuesses,
      availableOptions: newAvailableOptions,
      incorrectOptions: [...gameState.incorrectOptions, selectedOption],
      hintsRevealed: gameState.hintsRevealed + 1,
      currentHint: hintData?.hint || null,
      // Check if we've run out of options or hints (game over)
      isComplete: newAvailableOptions.length <= 1 || gameState.hintsRevealed >= gameState.dataset.hints.length - 1,
      isWon: false
    }
  }
}

export default {
  getTodaysDataset,
  createGameState,
  checkGuess,
  getNextHint,
  processGuess
}