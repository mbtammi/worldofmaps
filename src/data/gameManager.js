// Game Manager - handles daily dataset selection and game state
import { getDailyDataset, getDatasetByType } from './datasets.js'
import { updateStatsAfterGame } from './gameStats.js'

// Get today's dataset using the new dynamic system
export const getTodaysDataset = async () => {
  try {
    return await getDailyDataset()
  } catch (error) {
    console.error('Error fetching daily dataset:', error)
    // Fallback to a default dataset
    return await getDatasetByType('population-density')
  }
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

// Finalize game and update statistics
export const finalizeGame = (gameState) => {
  if (!gameState.isComplete) {
    console.warn('Attempting to finalize incomplete game')
    return gameState
  }

  // Update stats
  const gameResult = {
    isWon: gameState.isWon,
    guessCount: gameState.guesses.length,
    datasetType: gameState.dataset.id.split('-')[0], // Extract type from ID
    datasetTitle: gameState.dataset.title
  }

  updateStatsAfterGame(gameResult)
  return gameState
}

export default {
  getTodaysDataset,
  createGameState,
  checkGuess,
  getNextHint,
  processGuess,
  finalizeGame
}