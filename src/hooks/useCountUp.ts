import { useEffect, useRef, useState } from 'react'

/**
 * Count-up com rAF (700ms, easeOutCubic), disparado no mount e quando `target` muda.
 * Respeita prefers-reduced-motion (mostra o valor final imediatamente).
 */
export function useCountUp(target: number, duration = 700, delay = 0): number {
  const [value, setValue] = useState(0)
  const fromRef = useRef(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setValue(target)
      fromRef.current = target
      return
    }
    const from = fromRef.current
    const start = performance.now() + delay
    const tick = (now: number) => {
      const t = Math.min(Math.max((now - start) / duration, 0), 1)
      const eased = 1 - Math.pow(1 - t, 3) // easeOutCubic
      const current = Math.round(from + (target - from) * eased)
      setValue(current)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        fromRef.current = target
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, duration, delay])

  return value
}
