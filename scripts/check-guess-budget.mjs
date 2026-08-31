// The guess budget is the game's only fail state, so it gets a real check.
// Before it existed, wrong guesses only removed options and the player always arrived
// at the answer — this asserts that a game can now actually be lost, and that the
// unlimited Free Play path still can't be.
import assert from 'node:assert'
import { createGameState, processGuess, guessBudgetFor } from '../src/data/gameManager.js'

const dataset = (n) => ({
  id: 'test-set',
  title: 'Test',
  options: Array.from({ length: n }, (_, i) => (i === 0 ? 'CORRECT' : `wrong-${i}`)),
  correctAnswers: ['CORRECT'],
  data: [],
})

const playWrong = (state, times) => {
  for (let i = 0; i < times && !state.isComplete; i++) {
    const wrong = state.availableOptions.find((o) => o !== 'CORRECT')
    state = processGuess(state, wrong)
  }
  return state
}

// Normal: 10 options, 5 guesses. Five wrong guesses must end the game as a loss with
// options still on the board — that's the whole point of the cap.
{
  let s = createGameState(dataset(10))
  assert.equal(s.maxGuesses, 5)
  s = playWrong(s, 4)
  assert.equal(s.isComplete, false, 'four wrong guesses should not end a five-guess game')
  s = playWrong(s, 1)
  assert.equal(s.isComplete, true, 'fifth wrong guess must end the game')
  assert.equal(s.isWon, false)
  assert.ok(s.availableOptions.length > 1, 'the game must be losable with options remaining')
}

// Hard: 4 options, 2 guesses.
{
  let s = createGameState(dataset(4))
  assert.equal(s.maxGuesses, 2)
  s = playWrong(s, 2)
  assert.equal(s.isComplete, true)
  assert.equal(s.isWon, false)
}

// A correct guess still wins, and the budget doesn't interfere.
{
  let s = createGameState(dataset(10))
  s = playWrong(s, 2)
  s = processGuess(s, 'CORRECT')
  assert.equal(s.isWon, true)
  assert.equal(s.guesses.length, 3, 'score should count the winning guess')
}

// Free Play stays unlimited: it can only end by elimination, never by running out of guesses.
{
  let s = createGameState(dataset(10), { limited: false })
  assert.equal(s.maxGuesses, null)
  s = playWrong(s, 8)
  assert.equal(s.isComplete, false, 'free play must survive eight wrong guesses')
  s = playWrong(s, 1)
  assert.equal(s.isComplete, true, 'free play still ends when one option remains')
}

assert.equal(guessBudgetFor(10), 5)
assert.equal(guessBudgetFor(4), 2)

console.log('guess budget OK (fail state reachable, free play unlimited)')

// The "correct answer is never first" swap must stay inside the array. It used to pick a
// position in 1..9 regardless of length, which corrupted every 4-option hard-mode game.
{
  for (const n of [4, 5, 10]) {
    for (let trial = 0; trial < 300; trial++) {
      const s = createGameState(dataset(n))
      assert.equal(s.availableOptions.length, n, `${n} options: list length changed`)
      assert.ok(
        s.availableOptions.every((o) => typeof o === 'string'),
        `${n} options: list contains a hole or undefined`,
      )
      assert.ok(s.availableOptions.includes('CORRECT'), `${n} options: correct answer lost`)
      assert.notEqual(s.availableOptions[0], 'CORRECT', `${n} options: answer left in first slot`)
    }
  }
}

console.log('option shuffle OK (in-bounds, answer preserved, never first)')
