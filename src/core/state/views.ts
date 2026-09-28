// View-model hooks shared by every UI: screens only render what these return.
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  allocation,
  categoryValue,
  change,
  holdingValue,
  isClosed,
  latestSnapshot,
  monthlyBaseline,
  portfolioValue,
  previousSnapshot,
  snapshotFromEdits,
  valueHistory,
  type AllocationSlice,
  type Change,
} from '../domain/portfolio'
import type { Holding, Id, Snapshot } from '../domain/types'
import { parseAmount } from '../format'
import { newId } from './ids'
import { usePortfolio } from './PortfolioProvider'

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

function writeStorage(key: string, value: unknown) {
  try {
    if (value === undefined) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // storage unavailable; the value just won't persist
  }
}

/** The grouping shown on Overview, remembered per device. */
export function useSelectedGrouping(): [Id | undefined, (id: Id) => void] {
  const { portfolio } = usePortfolio()
  const [stored, setStored] = useState<Id | undefined>(() => readStorage('pv.grouping', undefined))
  const groupings = [...portfolio.groupings].sort((a, b) => a.sortOrder - b.sortOrder)
  const selected = groupings.some((g) => g.id === stored) ? stored : groupings[0]?.id
  const select = useCallback((id: Id) => {
    setStored(id)
    writeStorage('pv.grouping', id)
  }, [])
  return [selected, select]
}

export interface OverviewSlice extends AllocationSlice {
  vsPrevious: Change | null
  monthly: Change | null
}

export function useOverview(groupingId: Id | undefined) {
  const { portfolio } = usePortfolio()
  return useMemo(() => {
    const latest = latestSnapshot(portfolio)
    const previous = latest && previousSnapshot(portfolio.snapshots, latest.id)
    const baseline = latest && monthlyBaseline(portfolio.snapshots, latest)
    const total = portfolioValue(latest)
    const slices: OverviewSlice[] = groupingId
      ? allocation(portfolio, latest, groupingId).map((s) => ({
          ...s,
          vsPrevious: previous ? change(s.value, categoryValue(portfolio, previous, groupingId, s.category.id)) : null,
          monthly: baseline ? change(s.value, categoryValue(portfolio, baseline, groupingId, s.category.id)) : null,
        }))
      : []
    return {
      latest,
      total,
      vsPrevious: previous ? change(total, portfolioValue(previous)) : null,
      monthly: baseline ? change(total, portfolioValue(baseline)) : null,
      previousTakenAt: previous?.takenAt,
      baselineTakenAt: baseline?.takenAt,
      slices,
      groupings: [...portfolio.groupings].sort((a, b) => a.sortOrder - b.sortOrder),
    }
  }, [portfolio, groupingId])
}

export function useHistory() {
  const { portfolio, actions } = usePortfolio()
  const points = useMemo(() => valueHistory(portfolio.snapshots), [portfolio.snapshots])
  return { points, newestFirst: [...points].reverse(), deleteSnapshot: actions.deleteSnapshot }
}

export interface EditorRow {
  holding: Holding
  /** What the input shows. */
  input: string
  /** Parsed input; null when empty or invalid. */
  value: number | null
  invalid: boolean
  /** Edited to something different from the starting value. */
  changed: boolean
  closed: boolean
  /** Change against the previous snapshot. */
  vsPrevious: Change | null
}

const DRAFT_KEY = 'pv.draft.v1'
const inputNumber = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })

/**
 * Editing values. Without `snapshotId` this is a New Snapshot whose draft survives leaving the screen;
 * with it, it corrects an existing snapshot in place.
 */
export function useSnapshotEditor(snapshotId?: Id) {
  const { portfolio, actions } = usePortfolio()
  const editing = snapshotId ? portfolio.snapshots.find((s) => s.id === snapshotId) : undefined
  const base: Snapshot | undefined = editing ?? latestSnapshot(portfolio)
  const previous = editing ? previousSnapshot(portfolio.snapshots, editing.id) : base
  const isDraft = snapshotId === undefined

  const [edits, setEdits] = useState<Record<Id, string>>(() => (isDraft ? readStorage(DRAFT_KEY, {}) : {}))
  const [showClosed, setShowClosed] = useState(false)

  useEffect(() => {
    if (isDraft) writeStorage(DRAFT_KEY, Object.keys(edits).length ? edits : undefined)
  }, [edits, isDraft])

  const rows: EditorRow[] = useMemo(
    () =>
      [...portfolio.holdings]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((holding) => {
          const baseValue = base?.values[holding.id]
          const edited = edits[holding.id]
          const input = edited ?? (baseValue === undefined ? '' : inputNumber.format(baseValue))
          const value = parseAmount(input)
          const invalid = input.trim() !== '' && value === null
          const current = value ?? baseValue ?? 0
          return {
            holding,
            input,
            value,
            invalid,
            changed: edited !== undefined && value !== null && value !== baseValue,
            closed: isClosed(holding, base),
            vsPrevious: previous && holding.id in previous.values ? change(current, holdingValue(previous, holding.id)) : null,
          }
        }),
    [portfolio.holdings, base, previous, edits],
  )

  const visibleRows = showClosed ? rows : rows.filter((r) => !r.closed || r.changed)
  const dirty = rows.some((r) => r.changed)
  const invalid = rows.some((r) => r.invalid)
  const total = rows.reduce((sum, r) => sum + (r.value ?? 0), 0)

  const setInput = useCallback((holdingId: Id, text: string) => {
    setEdits((e) => ({ ...e, [holdingId]: text }))
  }, [])

  const discard = useCallback(() => setEdits({}), [])

  const save = useCallback(async () => {
    const numeric: Record<Id, number> = {}
    for (const r of rows) if (r.changed && r.value !== null) numeric[r.holding.id] = r.value
    const snapshot = snapshotFromEdits(
      base,
      portfolio.holdings,
      numeric,
      editing?.takenAt ?? new Date().toISOString(),
      editing?.id ?? newId(),
    )
    setEdits({})
    await actions.saveSnapshot(snapshot)
    return snapshot
  }, [rows, base, portfolio.holdings, editing, actions])

  return {
    editing,
    rows,
    visibleRows,
    closedCount: rows.filter((r) => r.closed && !r.changed).length,
    showClosed,
    setShowClosed,
    setInput,
    total,
    totalChange: previous ? change(total, portfolioValue(previous)) : null,
    changedCount: rows.filter((r) => r.changed).length,
    dirty,
    canSave: dirty && !invalid,
    save,
    discard,
  }
}
