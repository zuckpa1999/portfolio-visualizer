import { useEffect, useState } from 'react'

const reduceMotion = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t))

/** Animates 0 -> target over `duration` ms after `delay` ms. */
export function useCountUp(target: number, duration = 1400, delay = 0): number {
  const [value, setValue] = useState(() => (reduceMotion() ? target : 0))

  useEffect(() => {
    if (reduceMotion()) return
    let frame = 0
    const start = performance.now() + delay
    const tick = (now: number) => {
      const t = Math.max(0, (now - start) / duration)
      setValue(target * easeOutExpo(Math.min(1, t)))
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, duration, delay])

  return value
}
