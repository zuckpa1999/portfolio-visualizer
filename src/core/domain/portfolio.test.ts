import { describe, expect, it } from 'vitest'
import {
  allocation,
  categoryValue,
  change,
  isClosed,
  monthlyBaseline,
  portfolioValue,
  previousSnapshot,
  snapshotFromEdits,
  sortSnapshots,
  UNCATEGORISED_ID,
  valueHistory,
} from './portfolio'
import type { Holding, Portfolio, Snapshot } from './types'

const holding = (id: string, categoryIds: Record<string, string> = {}): Holding => ({
  id,
  name: id,
  investedAmount: null,
  categoryIds,
  sortOrder: 0,
})

const snap = (id: string, takenAt: string, values: Record<string, number>): Snapshot => ({ id, takenAt, values })

describe('change', () => {
  it('returns null without a base', () => {
    expect(change(100, undefined)).toBeNull()
  })
  it('computes amount and percent', () => {
    expect(change(110, 100)).toEqual({ amount: 10, percent: 0.1 })
  })
  it('has no percent from a zero base', () => {
    expect(change(50, 0)).toEqual({ amount: 50, percent: null })
  })
})

describe('snapshotFromEdits', () => {
  const holdings = [holding('a'), holding('b'), holding('new')]
  const base = snap('s1', '2026-09-01T00:00:00Z', { a: 100, b: 200 })

  it('carries untouched values forward and applies edits', () => {
    const next = snapshotFromEdits(base, holdings, { b: 250 }, '2026-09-02T00:00:00Z', 's2')
    expect(next.values).toEqual({ a: 100, b: 250 })
  })

  it('leaves never-valued holdings absent so they are not closed', () => {
    const next = snapshotFromEdits(base, holdings, {}, '2026-09-02T00:00:00Z', 's2')
    expect('new' in next.values).toBe(false)
    expect(isClosed(holdings[2], next)).toBe(false)
  })

  it('closes a holding set to zero, and reopens it when valued again', () => {
    const closed = snapshotFromEdits(base, holdings, { a: 0 }, '2026-09-02T00:00:00Z', 's2')
    expect(isClosed(holdings[0], closed)).toBe(true)
    const reopened = snapshotFromEdits(closed, holdings, { a: 5 }, '2026-09-03T00:00:00Z', 's3')
    expect(isClosed(holdings[0], reopened)).toBe(false)
  })
})

describe('comparisons', () => {
  const snapshots = [
    snap('aug-a', '2026-08-10T10:00:00', { a: 1 }),
    snap('aug-b', '2026-08-31T22:00:00', { a: 2 }),
    snap('sep-a', '2026-09-03T09:00:00', { a: 3 }),
    snap('sep-b', '2026-09-20T09:00:00', { a: 4 }),
  ]

  it('previous is the snapshot just before', () => {
    expect(previousSnapshot(snapshots, 'sep-b')?.id).toBe('sep-a')
    expect(previousSnapshot(snapshots, 'aug-a')).toBeUndefined()
  })

  it('monthly baseline is the last snapshot of the previous month', () => {
    expect(monthlyBaseline(snapshots, snapshots[3])?.id).toBe('aug-b')
    expect(monthlyBaseline(snapshots, snapshots[2])?.id).toBe('aug-b')
    expect(monthlyBaseline(snapshots, snapshots[1])).toBeUndefined()
  })

  it('monthly baseline for January is the last snapshot of the previous December', () => {
    const yearEnd = [
      snap('dec-a', '2026-12-05T09:00:00', { a: 1 }),
      snap('dec-b', '2026-12-28T09:00:00', { a: 2 }),
      snap('jan-a', '2027-01-04T09:00:00', { a: 3 }),
    ]
    expect(monthlyBaseline(yearEnd, yearEnd[2])?.id).toBe('dec-b')
  })
})

describe('allocation', () => {
  const portfolio: Portfolio = {
    groupings: [{ id: 'g', name: 'Asset class', sortOrder: 0 }],
    categories: [
      { id: 'cash', groupingId: 'g', name: 'Cash', color: '#000' },
      { id: 'stocks', groupingId: 'g', name: 'Stocks', color: '#111' },
    ],
    holdings: [holding('a', { g: 'cash' }), holding('b', { g: 'stocks' }), holding('c', { g: 'stocks' }), holding('d')],
    snapshots: [],
  }
  const s = snap('s', '2026-09-01T00:00:00Z', { a: 100, b: 200, c: 100, d: 100 })

  it('sums holdings per category, largest first, with shares', () => {
    const slices = allocation(portfolio, s, 'g')
    expect(portfolioValue(s)).toBe(500)
    expect(slices.map((x) => [x.category.id, x.value, x.share])).toEqual([
      ['stocks', 300, 0.6],
      ['cash', 100, 0.2],
      [UNCATEGORISED_ID, 100, 0.2],
    ])
  })

  it('leaves out zero-valued holdings', () => {
    const slices = allocation(portfolio, snap('z', '2026-09-01T00:00:00Z', { a: 0, b: 10 }), 'g')
    expect(slices.map((x) => x.category.id)).toEqual(['stocks'])
  })

  it('counts a holding as Uncategorised when its category belongs to another grouping', () => {
    const mixedUp: Portfolio = {
      ...portfolio,
      categories: [...portfolio.categories, { id: 'usd', groupingId: 'other', name: 'USD', color: '#222' }],
      holdings: [holding('a', { g: 'usd' })],
    }
    const slices = allocation(mixedUp, snap('m', '2026-09-01T00:00:00Z', { a: 100 }), 'g')
    expect(slices.map((x) => [x.category.id, x.value])).toEqual([[UNCATEGORISED_ID, 100]])
  })

  it('lists the holdings inside a category largest first', () => {
    const stocks = allocation(portfolio, snap('o', '2026-09-01T00:00:00Z', { b: 50, c: 80 }), 'g')[0]
    expect(stocks.holdings.map((x) => [x.holding.id, x.value])).toEqual([
      ['c', 80],
      ['b', 50],
    ])
  })

  it('totals one category, and is zero without a snapshot', () => {
    expect(categoryValue(portfolio, s, 'g', 'stocks')).toBe(300)
    expect(categoryValue(portfolio, s, 'g', UNCATEGORISED_ID)).toBe(100)
    expect(categoryValue(portfolio, undefined, 'g', 'stocks')).toBe(0)
  })
})

describe('sortSnapshots', () => {
  it('orders by instant even when UTC offsets differ', () => {
    const imported = snap('imported', '2026-09-29T00:00:00+07:00', {}) // 28 Sep 17:00 UTC
    const saved = snap('saved', '2026-09-28T17:35:00.000Z', {})
    expect(sortSnapshots([saved, imported]).map((s) => s.id)).toEqual(['imported', 'saved'])
  })
})

describe('valueHistory', () => {
  it('gives each snapshot its portfolio value and its change vs the previous snapshot', () => {
    const history = valueHistory([
      snap('s1', '2026-09-01T00:00:00Z', { a: 100, b: 100 }),
      snap('s2', '2026-09-08T00:00:00Z', { a: 150, b: 100 }),
      snap('s3', '2026-09-15T00:00:00Z', { a: 50, b: 75 }),
    ])
    expect(history.map((p) => [p.snapshot.id, p.value, p.vsPrevious])).toEqual([
      ['s1', 200, null],
      ['s2', 250, { amount: 50, percent: 0.25 }],
      ['s3', 125, { amount: -125, percent: -0.5 }],
    ])
  })
})
