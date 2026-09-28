import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCompactTHB, formatDateTime, formatShortDate, formatTHB } from '../format'

export interface ChartTheme {
  line: string
  grid: string
  text: string
  tooltipBackground: string
  tooltipBorder: string
  fontFamily?: string
}

interface Props {
  points: { takenAt: string; value: number }[]
  theme: ChartTheme
  height?: number
}

/** Portfolio value over time. */
export function ValueHistoryChart({ points, theme, height = 220 }: Props) {
  const data = points.map((p) => ({ t: new Date(p.takenAt).getTime(), takenAt: p.takenAt, value: p.value }))
  const values = data.map((d) => d.value)
  const pad = Math.max(1, (Math.max(...values) - Math.min(...values)) * 0.2)
  const tick = { fill: theme.text, fontSize: 11, fontFamily: theme.fontFamily }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="pv-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={theme.line} stopOpacity={0.18} />
            <stop offset="100%" stopColor={theme.line} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={theme.grid} />
        <XAxis
          dataKey="t"
          type="number"
          scale="time"
          domain={['dataMin', 'dataMax']}
          tickFormatter={(t: number) => formatShortDate(new Date(t).toISOString())}
          tick={tick}
          tickLine={false}
          axisLine={false}
          minTickGap={24}
        />
        <YAxis
          domain={[Math.max(0, Math.min(...values) - pad), Math.max(...values) + pad]}
          tickFormatter={formatCompactTHB}
          tick={tick}
          tickLine={false}
          axisLine={false}
          width={56}
        />
        <Tooltip
          cursor={{ stroke: theme.grid }}
          contentStyle={{
            background: theme.tooltipBackground,
            border: `1px solid ${theme.tooltipBorder}`,
            borderRadius: 8,
            fontFamily: theme.fontFamily,
            fontSize: 12,
          }}
          labelFormatter={(_, payload) => (payload?.[0] ? formatDateTime(payload[0].payload.takenAt) : '')}
          formatter={(v) => [formatTHB(Number(v)), 'Value']}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={theme.line}
          strokeWidth={2}
          fill="url(#pv-area)"
          dot={data.length < 30 ? { r: 3, fill: theme.line, strokeWidth: 0 } : false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
