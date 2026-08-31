// Game Manager - handles daily dataset selection and game state
import { getDailyDataset, getDatasetByType, validateDataset } from './datasets.js'
import { updateStatsAfterGame } from './gameStats.js'

// Get today's dataset using the new dynamic system
export const getTodaysDataset = async () => {
  try {
    console.log('Game Manager: Fetching today\'s dataset...')
    const dataset = await getDailyDataset()
    
    // Validate the dataset before returning it
    if (!validateDataset(dataset)) {
      throw new Error('Dataset failed validation')
    }
    
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

// Guess budget. Without one the game cannot be lost: every wrong guess removes an option,
// so a player who keeps tapping always arrives at the answer. Both caps leave a 50% floor
// for pure random play (5 of 10 options, 2 of 4 in hard mode).
// Free Play passes { limited: false } to keep its casual, unlimited feel.
const MAX_GUESSES_NORMAL = 5
const MAX_GUESSES_HARD = 2

export const guessBudgetFor = (optionCount) =>
  optionCount <= 4 ? MAX_GUESSES_HARD : MAX_GUESSES_NORMAL

// Game state management
export const createGameState = (dataset, { limited = true } = {}) => {
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
    // Must stay inside the array. The old `Math.random() * 9 + 1` was hardcoded for the
    // 10-option list, so in hard mode (4 options) it wrote past the end: the swap pulled in
    // `undefined`, left holes in the middle, and could move the correct answer out of the
    // list entirely — rendering blank buttons on an unwinnable puzzle.
    const randomPos = 1 + Math.floor(Math.random() * (shuffledOptions.length - 1))
    const temp = shuffledOptions[0]
    shuffledOptions[0] = shuffledOptions[randomPos]
    shuffledOptions[randomPos] = temp
  }
  
  return {
    dataset,
    guesses: [],
    incorrectOptions: [], // Track removed wrong options
    availableOptions: shuffledOptions, // Use freshly shuffled options
    maxGuesses: limited ? guessBudgetFor(shuffledOptions.length) : null,
    // Hints removed
    isComplete: false,
    isWon: false,
    // currentHint removed
    startTime: Date.now() // Used for the duration shown in stats and shares
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
    
    // Out of guesses, or out of options (one left means it must be the answer).
    const outOfGuesses = gameState.maxGuesses != null && newGuesses.length >= gameState.maxGuesses
    return {
      ...gameState,
      guesses: newGuesses,
      availableOptions: newAvailableOptions,
      incorrectOptions: [...gameState.incorrectOptions, selectedOption],
      isComplete: outOfGuesses || newAvailableOptions.length <= 1,
      isWon: false
    }
  }
}

// toggleHints removed

// Finalize game and update statistics.
// Pass { isDaily: false } from Free Play so it doesn't update the daily streak/histogram.
export const finalizeGame = (gameState, opts = {}) => {
  if (!gameState.isComplete) {
    console.warn('Attempting to finalize incomplete game')
    return gameState
  }

  // Calculate game duration
  const gameDuration = Date.now() - gameState.startTime

  // Update local stats
  const gameResult = {
    isWon: gameState.isWon,
    guessCount: gameState.guesses.length,
    durationMs: gameDuration,
    datasetType: gameState.dataset.id.split('-')[0], // Extract type from ID
    datasetTitle: gameState.dataset.title,
    datasetId: gameState.dataset.id
  }

  updateStatsAfterGame(gameResult, opts)
  return gameState
}

export default {
  getTodaysDataset,
  guessBudgetFor,
  createGameState,
  checkGuess,
  processGuess,
  finalizeGame
}