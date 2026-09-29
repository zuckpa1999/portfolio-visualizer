import { useEffect, useState } from 'react'
import './splash.css'
import { usePortfolio } from '@/core/state/PortfolioProvider'
import { useOverview, useSelectedGrouping } from '@/core/state/views'
import { Aperture } from './Aperture'

const HOLD_MS = 2300
const EXIT_MS = 450
const reduceMotion = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Plays once the portfolio has loaded, holds, then fades out. Tapping skips ahead.
 * Loading time counts towards the hold, so a slow backend never makes it longer.
 */
export function Splash({ onDone }: { onDone(): void }) {
  const { status } = usePortfolio()
  const [groupingId] = useSelectedGrouping()
  const { total, slices } = useOverview(groupingId)
  const ready = status !== 'loading'
  const [mountedAt] = useState(() => performance.now())
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    if (!ready || leaving) return
    const hold = reduceMotion() ? 500 : HOLD_MS
    const id = setTimeout(() => setLeaving(true), Math.max(0, hold - (performance.now() - mountedAt)))
    return () => clearTimeout(id)
  }, [ready, leaving, mountedAt])

  useEffect(() => {
    if (!leaving) return
    const id = setTimeout(onDone, EXIT_MS)
    return () => clearTimeout(id)
  }, [leaving, onDone])

  return (
    <div
      className="splash fixed inset-0 z-50 flex items-center justify-center"
      data-leaving={leaving || undefined}
      onClick={() => ready && setLeaving(true)}
      aria-hidden
    >
      <div className="splash-stage">
        {ready && (
          <Aperture total={total} slices={slices.map((s) => ({ id: s.category.id, color: s.category.color, share: s.share }))} />
        )}
      </div>
    </div>
  )
}
