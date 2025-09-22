// Game Manager - handles daily dataset selection and game state
import { getDailyDataset, getDatasetByType, validateDataset } from './datasets.js'
import { updateStatsAfterGame } from './gameStats.js'
import { trackGameStart, trackGameComplete, trackGuess, trackHintUsed } from './globalAnalytics.js'

// Get today's dataset using the new dynamic system
export const getTodaysDataset = async () => {
  try {
    console.log('Game Manager: Fetching today\'s dataset...')
    const dataset = await getDailyDataset()
    
    // Validate the dataset before returning it
    if (!validateDataset(dataset)) {
      throw new Error('Dataset failed validation')
    }
    
    console.log(`Game Manager: Successfully loaded dataset: ${dataset.title}`)
    return dataset
  } catch (error) {
    console.error('Game Manager: Error fetching daily dataset:', error)
    console.log('Game Manager: Attempting fallback to population density...')
    
    // Fallback to a default dataset
    try {
      const fallbackDataset = await getDatasetByType('population-density')
      if (validateDataset(fallbackDataset)) {
        console.log('Game Manager: Successfully loaded fallback dataset')
        return fallbackDataset
      }
    } catch (fallbackError) {
      console.error('Game Manager: Fallback also failed:', fallbackError)
    }
    
    // Last resort: throw error
    throw new Error('No valid dataset available')
  }
}

// Game state management
export const createGameState = (dataset) => {
  // Track game start analytics
  trackGameStart(dataset.id, dataset.title)
  
  // Create a fresh shuffle of options to ensure randomization
  const shuffledOptions = [...dataset.options]
  // Fisher-Yates shuffle algorithm for true randomization
  for (let i = shuffledOptions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]]
  }
  
  return {
    dataset,
    guesses: [],
    incorrectOptions: [], // Track removed wrong options
    availableOptions: shuffledOptions, // Use freshly shuffled options
    hintsRevealed: 0,
    hintsEnabled: false, // New: hints are disabled by default
    isComplete: false,
    isWon: false,
    currentHint: null,
    startTime: Date.now() // Track timing for analytics
  }
}

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
  const guessNumber = newGuesses.length
  
  // Track guess analytics
  trackGuess(selectedOption, isCorrect, guessNumber, gameState.dataset.id)
  
  if (isCorrect) {
    return {
      ...gameState,
      guesses: newGuesses,
      isComplete: true,
      isWon: true
    }
  } else {
    // Wrong guess - remove wrong options and reveal next hint (if hints are enabled)
    const newAvailableOptions = removeWrongOptions(
      gameState.availableOptions, 
      selectedOption, 
      gameState.dataset.correctAnswers
    )
    
    let newHint = null
    let newHintsRevealed = gameState.hintsRevealed
    
    // Only reveal hints if they're enabled
    if (gameState.hintsEnabled) {
      const hintData = getNextHint(gameState.hintsRevealed, gameState.dataset)
      if (hintData) {
        newHint = hintData.hint
        newHintsRevealed = gameState.hintsRevealed + 1
        // Track hint usage
        trackHintUsed(newHintsRevealed, gameState.dataset.id)
      }
    }
    
    return {
      ...gameState,
      guesses: newGuesses,
      availableOptions: newAvailableOptions,
      incorrectOptions: [...gameState.incorrectOptions, selectedOption],
      hintsRevealed: newHintsRevealed,
      currentHint: newHint,
      // Check if we've run out of options (only 1 left means correct answer remains)
      // Don't end game based on hints unless hints are enabled and all hints used
      isComplete: newAvailableOptions.length <= 1,
      isWon: false
    }
  }
}

// Toggle hints on/off
export const toggleHints = (gameState) => {
  const newHintsEnabled = !gameState.hintsEnabled
  
  // If enabling hints and user has made wrong guesses, show appropriate hint
  let newHint = gameState.currentHint
  if (newHintsEnabled && gameState.guesses.some(g => !g.isCorrect) && !gameState.currentHint) {
    const wrongGuesses = gameState.guesses.filter(g => !g.isCorrect).length
    const hintIndex = Math.min(wrongGuesses - 1, gameState.dataset.hints.length - 1)
    if (hintIndex >= 0) {
      newHint = gameState.dataset.hints[hintIndex]
    }
  } else if (!newHintsEnabled) {
    // If disabling hints, hide current hint
    newHint = null
  }
  
  return {
    ...gameState,
    hintsEnabled: newHintsEnabled,
    currentHint: newHint
  }
}

// Finalize game and update statistics
export const finalizeGame = (gameState) => {
  if (!gameState.isComplete) {
    console.warn('Attempting to finalize incomplete game')
    return gameState
  }

  // Calculate game duration
  const gameDuration = Date.now() - gameState.startTime

  // Track game completion analytics
  trackGameComplete(
    gameState.dataset.id,
    gameState.isWon,
    gameState.guesses.length,
    gameDuration,
    gameState.hintsRevealed
  )

  // Update local stats
  const gameResult = {
    isWon: gameState.isWon,
    guessCount: gameState.guesses.length,
    datasetType: gameState.dataset.id.split('-')[0], // Extract type from ID
    datasetTitle: gameState.dataset.title,
    datasetId: gameState.dataset.id
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
  toggleHints,
  finalizeGame
}