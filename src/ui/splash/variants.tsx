import { useEffect, useState, type CSSProperties } from 'react'
import type { Change } from '@/core/domain/portfolio'
import { formatChange, formatTHB, hasChange, trendOf } from '@/core/format'
import { cn } from '@/lib/utils'
import type { SplashData } from './types'
import { useCountUp } from './useCountUp'

type Vars = CSSProperties & Record<`--${string}`, string | number>
const ms = (n: number) => `${Math.round(n)}ms`

/** Each slice with the share of the ring that comes before it. */
function withStarts(slices: SplashData['slices']) {
  return slices.map((s, i) => ({ ...s, start: slices.slice(0, i).reduce((sum, x) => sum + x.share, 0) }))
}

function Total({ value, className, style }: { value: number; className?: string; style?: CSSProperties }) {
  return (
    <span className={cn('font-semibold tracking-tight tabular-nums', className)} style={style}>
      {formatTHB(value)}
    </span>
  )
}

function ChangeLine({ change, delay }: { change: Change | null; delay: number }) {
  if (!hasChange(change)) return null
  return (
    <span
      className={cn('anim-fade-up text-sm tabular-nums', trendOf(change) === 'up' ? 'text-emerald-600' : 'text-red-600')}
      style={{ animationDelay: ms(delay) }}
    >
      {formatChange(change)}
    </span>
  )
}

/* 1 — Ring: one continuous pen stroke draws the allocation donut, colour by colour. */
export function Ring({ data }: { data: SplashData }) {
  const draw = 1300
  const value = useCountUp(data.total, 1500, 250)
  return (
    <div className="relative size-56">
      <svg viewBox="0 0 200 200" className="size-full -rotate-90">
        <circle cx="100" cy="100" r="80" fill="none" stroke="#ececee" strokeWidth="14" className="anim-fade" />
        {withStarts(data.slices).map((s) => {
          const len = Math.max(0, s.share * 100 - (data.slices.length > 1 ? 0.6 : 0))
          const style: Vars = {
            '--len': len,
            '--dur': ms(Math.max(40, s.share * draw)),
            animationDelay: ms(200 + s.start * draw),
            transform: `rotate(${s.start * 360}deg)`,
            transformOrigin: '100px 100px',
          }
          return (
            <circle
              key={s.id}
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke={s.color}
              strokeWidth="14"
              pathLength={100}
              strokeDasharray={`${len} 100`}
              className="anim-draw"
              style={style}
            />
          )
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="anim-fade text-[11px] text-muted-foreground" style={{ animationDelay: '300ms' }}>Portfolio value</span>
        <Total value={value} className="text-xl" />
      </div>
    </div>
  )
}

/* 2 — Count: the total counts up from zero, then the change since last time settles in beneath it. */
export function Count({ data }: { data: SplashData }) {
  const value = useCountUp(data.total, 1600, 200)
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="anim-fade-up text-sm text-muted-foreground">Portfolio value</span>
      <Total value={value} className="text-5xl" />
      <ChangeLine change={data.change} delay={1500} />
    </div>
  )
}

/* 3 — Odometer: every digit rolls into place like a mechanical counter, right to left. */
export function Odometer({ data }: { data: SplashData }) {
  const [go, setGo] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setGo(true)))
    return () => cancelAnimationFrame(id)
  }, [])
  const chars = formatTHB(data.total).split('')
  const digitCount = chars.filter((c) => /\d/.test(c)).length
  let digitIndex = 0
  return (
    <div className="flex flex-col items-center gap-3">
      <span className="anim-fade-up text-sm text-muted-foreground">Portfolio value</span>
      <div className="flex text-5xl leading-[1.1] font-semibold tracking-tight tabular-nums">
        {chars.map((c, i) => {
          if (!/\d/.test(c)) {
            return (
              <span key={i} className="anim-fade" style={{ animationDelay: '300ms' }}>
                {c}
              </span>
            )
          }
          const d = Number(c)
          const fromRight = digitCount - 1 - digitIndex++
          const delay = 150 + fromRight * 70
          return (
            <span key={i} className="relative inline-block h-[1.1em] overflow-hidden">
              <span
                className="odo-strip flex flex-col"
                style={{ transform: `translateY(${go ? -(10 + d) * 1.1 : 0}em)`, transitionDelay: ms(delay) }}
              >
                {Array.from({ length: 20 }, (_, n) => (
                  <span key={n} className="odo-digit h-[1.1em]" style={{ animationDelay: ms(delay) }}>
                    {n % 10}
                  </span>
                ))}
              </span>
            </span>
          )
        })}
      </div>
      <ChangeLine change={data.change} delay={1600} />
    </div>
  )
}

/* 4 — Allocation bar: a single hairline fills with each category's colour, then the total appears. */
export function Bar({ data }: { data: SplashData }) {
  const fill = 1300
  return (
    <div className="flex w-64 flex-col items-center gap-5">
      <span className="anim-fade-up text-sm font-medium tracking-tight">Portfolio</span>
      <div className="flex h-1.5 w-full gap-px overflow-hidden rounded-full bg-neutral-200/70">
        {withStarts(data.slices).map((s) => {
          const style: Vars = { '--dur': ms(Math.max(30, s.share * fill)), animationDelay: ms(250 + s.start * fill) }
          return (
            <div key={s.id} style={{ width: `${s.share * 100}%` }}>
              <div className="anim-scale-x h-full" style={{ ...style, background: s.color }} />
            </div>
          )
        })}
      </div>
      <Total value={data.total} className="anim-fade-up text-3xl" style={{ animationDelay: '1500ms' }} />
    </div>
  )
}

/* 5 — Trace: the portfolio's history draws itself as a line and lands on today's value. */
export function Trace({ data }: { data: SplashData }) {
  const w = 240
  const h = 96
  const values = data.history.length >= 2 ? data.history : [data.total, data.total]
  const min = Math.min(...values)
  const max = Math.max(...values)
  const pts = values.map((v, i) => [
    (i / (values.length - 1)) * w,
    max === min ? h / 2 : h - 8 - ((v - min) / (max - min)) * (h - 16),
  ])
  const line = smoothPath(pts)
  const [ex, ey] = pts[pts.length - 1]
  return (
    <div className="flex flex-col items-center gap-4">
      <svg viewBox={`-8 -8 ${w + 16} ${h + 16}`} width={w + 16} height={h + 16} className="overflow-visible">
        <defs>
          <linearGradient id="splash-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#18181b" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#18181b" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${line} L ${w} ${h} L 0 ${h} Z`} fill="url(#splash-area)" className="anim-fade" style={{ animationDelay: '1200ms' }} />
        <path
          d={line}
          fill="none"
          stroke="#18181b"
          strokeWidth="2"
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray="1 1"
          className="anim-draw-ease"
          style={{ '--len': 1, '--dur': '1400ms', animationDelay: '150ms' } as Vars}
        />
        <circle cx={ex} cy={ey} r="4" fill="#18181b" className="anim-pulse" style={{ animationDelay: '1500ms' }} />
        <circle cx={ex} cy={ey} r="4" fill="#18181b" className="anim-pop" style={{ animationDelay: '1450ms' }} />
      </svg>
      <div className="flex flex-col items-center gap-1">
        <Total value={data.total} className="anim-fade-up text-3xl" style={{ animationDelay: '1300ms' }} />
        <ChangeLine change={data.change} delay={1600} />
      </div>
    </div>
  )
}

/* 6 — Wordmark: the app mark turns into place and the name resolves out of a blur. No numbers. */
export function Wordmark() {
  const word = 'Portfolio'
  return (
    <div className="flex flex-col items-center gap-4">
      <svg viewBox="0 0 48 48" className="size-12">
        <circle cx="24" cy="24" r="17" fill="none" stroke="#e4e4e7" strokeWidth="6" />
        <circle
          cx="24"
          cy="24"
          r="17"
          fill="none"
          stroke="#18181b"
          strokeWidth="6"
          pathLength={100}
          strokeDasharray="62 100"
          className="anim-spin-in"
          style={{ rotate: '-90deg', transformOrigin: '24px 24px' }}
        />
        <circle
          cx="24"
          cy="24"
          r="17"
          fill="none"
          stroke="#4E79A7"
          strokeWidth="6"
          pathLength={100}
          strokeDasharray="18 100"
          strokeDashoffset="-66"
          className="anim-spin-in"
          style={{ rotate: '-90deg', transformOrigin: '24px 24px', animationDelay: '120ms' }}
        />
      </svg>
      <div className="flex flex-col items-center gap-2">
        <span className="flex text-3xl font-semibold tracking-tight">
          {word.split('').map((c, i) => (
            <span key={i} className="anim-rise-blur inline-block" style={{ animationDelay: ms(350 + i * 45) }}>
              {c}
            </span>
          ))}
        </span>
        <span
          className="anim-scale-x h-px w-full bg-neutral-300"
          style={{ '--dur': '600ms', animationDelay: '900ms', animationTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)' } as Vars}
        />
      </div>
    </div>
  )
}

/* 7 — Aperture: the donut's segments swing open from the centre like a camera shutter. */
export function Aperture({ data }: { data: SplashData }) {
  const value = useCountUp(data.total, 1300, 600)
  return (
    <div className="relative size-56">
      <svg viewBox="0 0 200 200" className="size-full">
        {withStarts(data.slices).map((s, i) => {
          const a0 = s.start * 360
          const a1 = (s.start + s.share) * 360
          return (
            <path
              key={s.id}
              d={annularSector(100, 100, 94, 66, a0, a1, data.slices.length > 1 ? 1.2 : 0)}
              fill={s.color}
              className="anim-aperture"
              style={{ animationDelay: ms(100 + i * 55) }}
            />
          )
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <Total value={value} className="anim-fade text-xl" style={{ animationDelay: '500ms' }} />
      </div>
    </div>
  )
}


/** Catmull-Rom spline through the points, as an SVG path. */
function smoothPath(pts: number[][]): string {
  let d = `M ${pts[0][0]} ${pts[0][1]}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += ` C ${c1[0]} ${c1[1]}, ${c2[0]} ${c2[1]}, ${p2[0]} ${p2[1]}`
  }
  return d
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
