import type { Change } from './domain/portfolio'

const baht = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })
const percent = new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 })
const dateTime = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
const shortDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' })

export function formatTHB(value: number): string {
  return `฿${baht.format(Math.round(value))}`
}

/** Axis labels: "฿2,045k". Thousands keep neighbouring ticks distinct for a portfolio that moves by small amounts. */
export function formatCompactTHB(value: number): string {
  if (Math.abs(value) >= 10_000) return `฿${baht.format(Math.round(value / 1_000))}k`
  return formatTHB(value)
}

export function formatShare(share: number): string {
  return percent.format(share)
}

export function formatSignedTHB(amount: number): string {
  const sign = amount > 0 ? '+' : amount < 0 ? '−' : ''
  return `${sign}${formatTHB(Math.abs(amount))}`
}

export function formatChange(c: Change | null): string {
  if (!c) return '—'
  if (c.amount === 0) return 'No change'
  const pct = c.percent === null ? '' : ` (${c.percent > 0 ? '+' : c.percent < 0 ? '−' : ''}${percent.format(Math.abs(c.percent))})`
  return `${formatSignedTHB(c.amount)}${pct}`
}

export type Trend = 'up' | 'down' | 'flat' | 'none'

/** True when there is a non-zero change worth showing. */
export function hasChange(c: Change | null): c is Change {
  return c !== null && c.amount !== 0
}

export function trendOf(c: Change | null): Trend {
  if (!c) return 'none'
  return c.amount > 0 ? 'up' : c.amount < 0 ? 'down' : 'flat'
}

export function formatDateTime(iso: string): string {
  return dateTime.format(new Date(iso))
}

export function formatShortDate(iso: string): string {
  return shortDate.format(new Date(iso))
}

/** Parse user input like "245,000" or "1234.5". Returns null for empty/invalid input. */
export function parseAmount(input: string): number | null {
  const cleaned = input.replace(/[,\s฿]/g, '')
  if (cleaned === '') return null
  const n = Number(cleaned)
  return Number.isFinite(n) && n >= 0 ? n : null
}
