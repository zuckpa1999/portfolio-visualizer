import { formatTHB } from '@/core/format'
import { useCountUp } from './useCountUp'

export interface ApertureSlice {
  id: string
  color: string
  /** 0..1 share of the ring. */
  share: number
}

/** Donut segments swing open from the centre like a camera shutter while the total counts up. */
export function Aperture({ slices, total }: { slices: ApertureSlice[]; total: number }) {
  const value = useCountUp(total, 1300, 600)
  const gap = slices.length > 1 ? 1.2 : 0
  const starts = slices.map((_, i) => slices.slice(0, i).reduce((sum, s) => sum + s.share, 0))

  return (
    <div className="relative size-56">
      <svg viewBox="0 0 200 200" className="size-full">
        {slices.map((s, i) => (
          <path
            key={s.id}
            d={annularSector(100, 100, 94, 66, starts[i] * 360, (starts[i] + s.share) * 360, gap)}
            fill={s.color}
            className="anim-aperture"
            style={{ animationDelay: `${100 + i * 55}ms` }}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="anim-fade text-xl font-semibold tracking-tight tabular-nums" style={{ animationDelay: '500ms' }}>
          {formatTHB(value)}
        </span>
      </div>
    </div>
  )
}

/** Ring segment from angle a0 to a1 (degrees, clockwise from 12 o'clock) with a small gap on each side. */
function annularSector(cx: number, cy: number, ro: number, ri: number, a0: number, a1: number, gap: number): string {
  if (a1 - a0 >= 359.9) {
    return `M ${cx} ${cy - ro} A ${ro} ${ro} 0 1 1 ${cx - 0.01} ${cy - ro} Z M ${cx} ${cy - ri} A ${ri} ${ri} 0 1 0 ${cx - 0.01} ${cy - ri} Z`
  }
  const s = a0 + gap / 2
  const e = Math.max(s + 0.1, a1 - gap / 2)
  const pt = (r: number, a: number) => {
    const rad = ((a - 90) * Math.PI) / 180
    return `${cx + r * Math.cos(rad)} ${cy + r * Math.sin(rad)}`
  }
  const large = e - s > 180 ? 1 : 0
  return `M ${pt(ro, s)} A ${ro} ${ro} 0 ${large} 1 ${pt(ro, e)} L ${pt(ri, e)} A ${ri} ${ri} 0 ${large} 0 ${pt(ri, s)} Z`
}
