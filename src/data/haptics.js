// Haptic feedback for game moments.
//
// Deliberately sparse: a tick on a wrong guess, a soft double-tap on a win, a slightly
// richer pattern for a streak milestone. Nothing fires on ordinary taps — constant buzzing
// is the fastest way to get a player to silence a game.
//
// navigator.vibrate is Android/Chrome only; iOS Safari has never shipped it, so this is a
// silent no-op there rather than a broken experience.

const PATTERNS = {
  // One short tick. Reads as "no" without being a jolt.
  wrong: 35,
  // Two soft taps, the second slightly longer — an upward, resolved feel.
  win: [0, 18, 55, 32],
  // Three rising taps. Reserved for streak milestones so it stays a rare reward.
  milestone: [0, 22, 45, 22, 45, 55],
}

let enabled = null

function isEnabled() {
  if (enabled !== null) return enabled
  try {
    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
      enabled = false
    } else {
      // Players who ask the OS for reduced motion generally don't want buzzing either.
      enabled = !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    }
  } catch {
    enabled = false
  }
  return enabled
}

export function haptic(kind) {
  if (!isEnabled()) return
  const pattern = PATTERNS[kind]
  if (pattern === undefined) return
  try {
    navigator.vibrate(pattern)
  } catch {
    /* a failed buzz must never break a guess */
  }
}

export default { haptic }
