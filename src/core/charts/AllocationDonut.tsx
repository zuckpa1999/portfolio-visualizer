import type { ReactNode } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import type { Id } from '../domain/types'

export interface DonutSlice {
  id: Id
  name: string
  color: string
  value: number
}

interface Props {
  slices: DonutSlice[]
  activeId: Id | null
  onActiveChange(id: Id | null): void
  /** Rendered in the hole, e.g. the portfolio value or the active slice. */
  center: ReactNode
  size?: number
  /** Gap colour between slices; match the surface behind the chart. */
  strokeColor?: string
}

/** Allocation donut. Tapping a slice highlights it; tapping it again clears. */
export function AllocationDonut({ slices, activeId, onActiveChange, center, size = 260, strokeColor = '#fff' }: Props) {
  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: size, height: size, margin: '0 auto' }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={slices}
            dataKey="value"
            nameKey="name"
            innerRadius="68%"
            outerRadius="100%"
            startAngle={90}
            endAngle={-270}
            stroke={strokeColor}
            strokeWidth={2}
            isAnimationActive={false}
            onClick={(_, index) => {
              const id = slices[index]?.id ?? null
              onActiveChange(id === activeId ? null : id)
            }}
          >
            {slices.map((s) => (
              <Cell
                key={s.id}
                fill={s.color}
                fillOpacity={activeId && activeId !== s.id ? 0.25 : 1}
                style={{ cursor: 'pointer', outline: 'none' }}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div
        style={{
          position: 'absolute',
          inset: '18%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          pointerEvents: 'none',
        }}
      >
        {center}
      </div>
    </div>
  )
}
