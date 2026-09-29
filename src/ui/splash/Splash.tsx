import { useEffect, useState } from 'react'
import './splash.css'
import { cn } from '@/lib/utils'
import { SPLASH_VARIANTS } from './registry'
import { useSplashData } from './splashData'

const EXIT_MS = 450
const reduceMotion = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

interface Props {
  variantId: string
  onDone?(): void
  /** Fill the parent instead of the viewport (gallery). */
  contained?: boolean
}

/**
 * Plays once the portfolio has loaded, holds for the variant's duration, then fades out.
 * Tapping skips ahead. Loading time counts towards the duration, so a slow backend never adds to it.
 */
export function Splash({ variantId, onDone, contained }: Props) {
  const { ready, data } = useSplashData()
  const variant = SPLASH_VARIANTS.find((v) => v.id === variantId) ?? SPLASH_VARIANTS[0]
  const [mountedAt] = useState(() => performance.now())
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    if (!ready || leaving) return
    const hold = reduceMotion() ? 500 : variant.duration
    const remaining = Math.max(0, hold - (performance.now() - mountedAt))
    const id = setTimeout(() => setLeaving(true), remaining)
    return () => clearTimeout(id)
  }, [ready, leaving, variant.duration, mountedAt])

  useEffect(() => {
    if (!leaving || !onDone) return
    const id = setTimeout(onDone, EXIT_MS)
    return () => clearTimeout(id)
  }, [leaving, onDone])

  return (
    <div
      className={cn('splash z-50 flex items-center justify-center', contained ? 'absolute inset-0' : 'fixed inset-0')}
      data-leaving={leaving || undefined}
      onClick={() => ready && setLeaving(true)}
      aria-hidden
    >
      <div className="splash-stage">{ready && <variant.Component data={data} />}</div>
    </div>
  )
}
