import { useEffect, useRef } from 'react'

// Shared modal behaviour: Escape closes, focus moves in on open and back to whatever had it
// before on close, and Tab is kept inside the dialog.
//
// Before this, no modal in the app handled a key at all — a grep for Escape/keydown across
// src/ returned nothing. StatsModal declared role="dialog" aria-modal="true" while leaving
// the page behind fully tabbable, and the already-played dialog opens by itself on load for
// returning players, so a keyboard user arrived inside an overlay with no way out.
//
// Returns a ref to put on the dialog element.
export function useModalA11y(open, onClose) {
  const ref = useRef(null)
  const previouslyFocused = useRef(null)

  useEffect(() => {
    if (!open) return
    previouslyFocused.current = document.activeElement

    const node = ref.current
    const focusable = () =>
      node
        ? [
            ...node.querySelectorAll(
              'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
            ),
          ].filter((el) => el.offsetParent !== null || el === document.activeElement)
        : []

    // Focus the dialog itself rather than its first control, so a screen reader announces
    // the dialog's label before its buttons.
    if (node) {
      if (!node.hasAttribute('tabindex')) node.setAttribute('tabindex', '-1')
      node.focus({ preventScroll: true })
    }

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose?.()
        return
      }
      if (e.key !== 'Tab') return
      const items = focusable()
      if (!items.length) {
        e.preventDefault()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement
      if (e.shiftKey && (active === first || active === node)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      // Give focus back to whatever opened the dialog; without this it falls to <body> and
      // the next Tab restarts at the top of the document.
      const prev = previouslyFocused.current
      if (prev && typeof prev.focus === 'function' && document.contains(prev)) {
        prev.focus({ preventScroll: true })
      }
    }
  }, [open, onClose])

  return ref
}

export default useModalA11y
