import type { Category, Holding, Id, Portfolio, Snapshot } from './types'

export const UNCATEGORISED_ID = '__uncategorised__'
const UNCATEGORISED_COLOR = '#A1A1AA'

export interface Change {
  amount: number
  /** null when the base is zero, so a percentage is meaningless. */
  percent: number | null
}

export function sortSnapshots(snapshots: Snapshot[]): Snapshot[] {
  return [...snapshots].sort((a, b) => a.takenAt.localeCompare(b.takenAt))
}

export function latestSnapshot(portfolio: Portfolio): Snapshot | undefined {
  return portfolio.snapshots.at(-1)
}

export function holdingValue(snapshot: Snapshot | undefined, holdingId: Id): number {
  return snapshot?.values[holdingId] ?? 0
}

export function portfolioValue(snapshot: Snapshot | undefined): number {
  if (!snapshot) return 0
  return Object.values(snapshot.values).reduce((sum, v) => sum + v, 0)
}

export function change(current: number, base: number | undefined): Change | null {
  if (base === undefined) return null
  const amount = current - base
  return { amount, percent: base === 0 ? null : amount / base }
}

/** A holding is closed when the latest snapshot records it at zero. */
export function isClosed(holding: Holding, latest: Snapshot | undefined): boolean {
  return latest !== undefined && latest.values[holding.id] === 0
}

export function previousSnapshot(snapshots: Snapshot[], snapshotId: Id): Snapshot | undefined {
  const index = snapshots.findIndex((s) => s.id === snapshotId)
  return index > 0 ? snapshots[index - 1] : undefined
}

/** The last snapshot taken before the calendar month (local time) of `snapshot` began. */
export function monthlyBaseline(snapshots: Snapshot[], snapshot: Snapshot): Snapshot | undefined {
  const taken = new Date(snapshot.takenAt)
  const monthStart = new Date(taken.getFullYear(), taken.getMonth(), 1).getTime()
  let baseline: Snapshot | undefined
  for (const s of snapshots) {
    if (new Date(s.takenAt).getTime() < monthStart) baseline = s
  }
  return baseline
}

export interface AllocationSlice {
  category: Category
  value: number
  /** 0..1 share of the portfolio value. */
  share: number
  holdings: { holding: Holding; value: number }[]
}

export function categoryOf(portfolio: Portfolio, holding: Holding, groupingId: Id): Category {
  const categoryId = holding.categoryIds[groupingId]
  return (
    portfolio.categories.find((c) => c.id === categoryId && c.groupingId === groupingId) ?? {
      id: UNCATEGORISED_ID,
      groupingId,
      name: 'Uncategorised',
      color: UNCATEGORISED_COLOR,
    }
  )
}

/** Value per category of `groupingId`, largest first. Empty categories are left out. */
export function allocation(portfolio: Portfolio, snapshot: Snapshot | undefined, groupingId: Id): AllocationSlice[] {
  if (!snapshot) return []
  const total = portfolioValue(snapshot)
  const slices = new Map<Id, AllocationSlice>()
  for (const holding of portfolio.holdings) {
    const value = holdingValue(snapshot, holding.id)
    if (value === 0) continue
    const category = categoryOf(portfolio, holding, groupingId)
    const slice = slices.get(category.id) ?? { category, value: 0, share: 0, holdings: [] }
    slice.value += value
    slice.holdings.push({ holding, value })
    slices.set(category.id, slice)
  }
  return [...slices.values()]
    .map((s) => ({
      ...s,
      share: total === 0 ? 0 : s.value / total,
      holdings: s.holdings.sort((a, b) => b.value - a.value),
    }))
    .sort((a, b) => b.value - a.value)
}

/** Value of one category in a snapshot (0 when the snapshot is missing). */
export function categoryValue(portfolio: Portfolio, snapshot: Snapshot | undefined, groupingId: Id, categoryId: Id): number {
  if (!snapshot) return 0
  return portfolio.holdings
    .filter((h) => categoryOf(portfolio, h, groupingId).id === categoryId)
    .reduce((sum, h) => sum + holdingValue(snapshot, h.id), 0)
}

/**
 * Build a snapshot from the latest one plus the user's edits. Untouched holdings carry their value forward;
 * holdings never valued and not edited stay absent so they are not mistaken for closed.
 */
export function snapshotFromEdits(
  base: Snapshot | undefined,
  holdings: Holding[],
  edits: Record<Id, number>,
  takenAt: string,
  id: Id,
): Snapshot {
  const values: Record<Id, number> = {}
  for (const h of holdings) {
    const value = edits[h.id] ?? base?.values[h.id]
    if (value !== undefined) values[h.id] = value
  }
  return { id, takenAt, values }
}

export interface HistoryPoint {
  snapshot: Snapshot
  value: number
  vsPrevious: Change | null
}

export function valueHistory(snapshots: Snapshot[]): HistoryPoint[] {
  return snapshots.map((snapshot, i) => {
    const value = portfolioValue(snapshot)
    const prev = i > 0 ? portfolioValue(snapshots[i - 1]) : undefined
    return { snapshot, value, vsPrevious: change(value, prev) }
  })
}
