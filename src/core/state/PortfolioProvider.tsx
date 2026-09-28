import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { nextCategoryColor } from '../colors'
import { createRepository } from '../data/backend'
import { sortSnapshots } from '../domain/portfolio'
import type { Category, Grouping, Holding, Id, Portfolio, Snapshot } from '../domain/types'
import { newId } from './ids'

export interface PortfolioActions {
  saveSnapshot(snapshot: Snapshot): Promise<void>
  deleteSnapshot(id: Id): Promise<void>
  saveHolding(holding: Holding): Promise<void>
  addHolding(name: string, categoryIds: Record<Id, Id>): Promise<Holding>
  saveCategory(category: Category): Promise<void>
  addCategory(groupingId: Id, name: string): Promise<Category>
  deleteCategory(id: Id): Promise<void>
  saveGrouping(grouping: Grouping): Promise<void>
  addGrouping(name: string): Promise<Grouping>
  deleteGrouping(id: Id): Promise<void>
}

interface PortfolioState {
  status: 'loading' | 'ready' | 'error'
  error: string | null
  dismissError(): void
  portfolio: Portfolio
  actions: PortfolioActions
}

const EMPTY: Portfolio = { groupings: [], categories: [], holdings: [], snapshots: [] }
const PortfolioContext = createContext<PortfolioState | null>(null)

/** Loads the portfolio and exposes optimistic mutations. Wrap the signed-in app in this. */
export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [repo] = useState(createRepository)
  const [portfolio, setPortfolio] = useState<Portfolio>(EMPTY)
  const [status, setStatus] = useState<PortfolioState['status']>('loading')
  const [error, setError] = useState<string | null>(null)
  const portfolioRef = useRef(portfolio)
  useEffect(() => {
    portfolioRef.current = portfolio
  }, [portfolio])

  const reload = useCallback(async () => {
    try {
      setPortfolio(await repo.load())
      setStatus('ready')
    } catch (e) {
      setError(messageOf(e))
      setStatus('error')
    }
  }, [repo])

  useEffect(() => {
    void reload()
  }, [reload])

  /** Apply the change locally first, then persist; on failure resync from storage. */
  const mutate = useCallback(
    async (apply: (p: Portfolio) => Portfolio, persist: () => Promise<void>) => {
      setPortfolio((p) => apply(p))
      try {
        await persist()
      } catch (e) {
        setError(messageOf(e))
        await reload()
      }
    },
    [reload],
  )

  const actions = useMemo<PortfolioActions>(
    () => ({
      saveSnapshot: (s) =>
        mutate((p) => ({ ...p, snapshots: sortSnapshots(upsert(p.snapshots, s)) }), () => repo.upsertSnapshot(s)),
      deleteSnapshot: (id) =>
        mutate((p) => ({ ...p, snapshots: p.snapshots.filter((s) => s.id !== id) }), () => repo.deleteSnapshot(id)),
      saveHolding: (h) => mutate((p) => ({ ...p, holdings: upsert(p.holdings, h) }), () => repo.upsertHolding(h)),
      addHolding: async (name, categoryIds) => {
        const holdings = portfolioRef.current.holdings
        const h: Holding = {
          id: newId(),
          name,
          investedAmount: null,
          categoryIds,
          sortOrder: Math.max(-1, ...holdings.map((x) => x.sortOrder)) + 1,
        }
        await mutate((p) => ({ ...p, holdings: [...p.holdings, h] }), () => repo.upsertHolding(h))
        return h
      },
      saveCategory: (c) =>
        mutate((p) => ({ ...p, categories: upsert(p.categories, c) }), () => repo.upsertCategory(c)),
      addCategory: async (groupingId, name) => {
        const used = portfolioRef.current.categories.filter((c) => c.groupingId === groupingId).map((c) => c.color)
        const c: Category = { id: newId(), groupingId, name, color: nextCategoryColor(used) }
        await mutate((p) => ({ ...p, categories: [...p.categories, c] }), () => repo.upsertCategory(c))
        return c
      },
      deleteCategory: (id) =>
        mutate(
          (p) => ({
            ...p,
            categories: p.categories.filter((c) => c.id !== id),
            holdings: p.holdings.map((h) => ({
              ...h,
              categoryIds: Object.fromEntries(Object.entries(h.categoryIds).filter(([, c]) => c !== id)),
            })),
          }),
          () => repo.deleteCategory(id),
        ),
      saveGrouping: (g) => mutate((p) => ({ ...p, groupings: upsert(p.groupings, g) }), () => repo.upsertGrouping(g)),
      addGrouping: async (name) => {
        const groupings = portfolioRef.current.groupings
        const g: Grouping = { id: newId(), name, sortOrder: Math.max(-1, ...groupings.map((x) => x.sortOrder)) + 1 }
        await mutate((p) => ({ ...p, groupings: [...p.groupings, g] }), () => repo.upsertGrouping(g))
        return g
      },
      deleteGrouping: (id) =>
        mutate(
          (p) => ({
            ...p,
            groupings: p.groupings.filter((g) => g.id !== id),
            categories: p.categories.filter((c) => c.groupingId !== id),
            holdings: p.holdings.map((h) => ({
              ...h,
              categoryIds: Object.fromEntries(Object.entries(h.categoryIds).filter(([g]) => g !== id)),
            })),
          }),
          () => repo.deleteGrouping(id),
        ),
    }),
    [mutate, repo],
  )

  const value = useMemo(
    () => ({ status, error, dismissError: () => setError(null), portfolio, actions }),
    [status, error, portfolio, actions],
  )
  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>
}

// eslint-disable-next-line react/only-export-components
export function usePortfolio(): PortfolioState {
  const ctx = useContext(PortfolioContext)
  if (!ctx) throw new Error('usePortfolio must be used inside <PortfolioProvider>')
  return ctx
}

function upsert<T extends { id: Id }>(items: T[], item: T): T[] {
  return items.some((i) => i.id === item.id) ? items.map((i) => (i.id === item.id ? item : i)) : [...items, item]
}

function messageOf(e: unknown): string {
  if (e instanceof Error) return e.message
  if (typeof e === 'object' && e && 'message' in e) return String(e.message)
  return 'Something went wrong'
}
