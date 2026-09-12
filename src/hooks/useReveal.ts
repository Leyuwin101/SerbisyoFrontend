import { useEffect, useRef } from 'react'

/**
 * Scroll-reveal: adds `is-revealed` once the element enters the viewport.
 * Combined with the `.reveal` CSS class this gives a choreographed,
 * once-only entrance. Works without JS when the observer is unavailable
 * (the CSS default is the visible state, so content is never hidden).
 */
export function useReveal<T extends HTMLElement>(): React.RefObject<T | null> {
  const ref = useRef<T | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || !('IntersectionObserver' in window)) return

    el.classList.add('reveal')
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed')
            observer.unobserve(entry.target)
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return ref
}
