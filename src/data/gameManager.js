// Game Manager - handles daily dataset selection and game state
import { getDailyDataset, getDatasetByType, validateDataset } from './datasets.js'
import { updateStatsAfterGame } from './gameStats.js'
import { trackGameStart, trackGameComplete, trackGuess } from './globalAnalytics.js'

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
  
  // Double-check: Ensure correct answer is NEVER first (safety check)
  const correctAnswer = dataset.correctAnswers[0]
  if (shuffledOptions[0] === correctAnswer || 
      dataset.correctAnswers.some(ans => shuffledOptions[0].toLowerCase() === ans.toLowerCase())) {
    const randomPos = Math.floor(Math.random() * 9) + 1
    const temp = shuffledOptions[0]
    shuffledOptions[0] = shuffledOptions[randomPos]
    shuffledOptions[randomPos] = temp
  }
  
  return {
    dataset,
    guesses: [],
    incorrectOptions: [], // Track removed wrong options
    availableOptions: shuffledOptions, // Use freshly shuffled options
    // Hints removed
    isComplete: false,
    isWon: false,
    // currentHint removed
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

// Hints feature removed

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
  // Wrong guess - remove wrong options
    const newAvailableOptions = removeWrongOptions(
      gameState.availableOptions, 
      selectedOption, 
      gameState.dataset.correctAnswers
    )
    
    return {
      ...gameState,
      guesses: newGuesses,
      availableOptions: newAvailableOptions,
      incorrectOptions: [...gameState.incorrectOptions, selectedOption],
      // Check if we've run out of options (only 1 left means correct answer remains)
      isComplete: newAvailableOptions.length <= 1,
      isWon: false
    }
  }
}

// toggleHints removed

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
    0 // hints removed
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
  processGuess,
  finalizeGame
}