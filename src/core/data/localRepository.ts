import { sortSnapshots } from '../domain/portfolio'
import type { Category, Grouping, Holding, Id, Portfolio, Snapshot } from '../domain/types'
import type { PortfolioRepository } from './repository'
import { seedPortfolio } from './seed'

const KEY = 'portfolio-visualizer.data.v1'

/** Stores the whole portfolio in this browser's localStorage. For trying the app before Supabase is set up. */
export class LocalRepository implements PortfolioRepository {
  private read(): Portfolio {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) return JSON.parse(raw) as Portfolio
    } catch {
      // fall through to seed
    }
    return structuredClone(seedPortfolio)
  }

  private write(update: (p: Portfolio) => Portfolio) {
    const next = update(this.read())
    next.snapshots = sortSnapshots(next.snapshots)
    localStorage.setItem(KEY, JSON.stringify(next))
  }

  async load() {
    const p = this.read()
    return { ...p, snapshots: sortSnapshots(p.snapshots) }
  }

  async upsertSnapshot(snapshot: Snapshot) {
    this.write((p) => ({ ...p, snapshots: upsert(p.snapshots, snapshot) }))
  }

  async deleteSnapshot(id: Id) {
    this.write((p) => ({ ...p, snapshots: p.snapshots.filter((s) => s.id !== id) }))
  }

  async upsertHolding(holding: Holding) {
    this.write((p) => ({ ...p, holdings: upsert(p.holdings, holding) }))
  }

  async upsertCategory(category: Category) {
    this.write((p) => ({ ...p, categories: upsert(p.categories, category) }))
  }

  async deleteCategory(id: Id) {
    this.write((p) => ({
      ...p,
      categories: p.categories.filter((c) => c.id !== id),
      holdings: p.holdings.map((h) => ({ ...h, categoryIds: withoutValue(h.categoryIds, id) })),
    }))
  }

  async upsertGrouping(grouping: Grouping) {
    this.write((p) => ({ ...p, groupings: upsert(p.groupings, grouping) }))
  }

  async deleteGrouping(id: Id) {
    this.write((p) => ({
      ...p,
      groupings: p.groupings.filter((g) => g.id !== id),
      categories: p.categories.filter((c) => c.groupingId !== id),
      holdings: p.holdings.map((h) => {
        const { [id]: _removed, ...rest } = h.categoryIds
        return { ...h, categoryIds: rest }
      }),
    }))
  }

  /** Wipe local data so the next load starts from the seed again. */
  static reset() {
    localStorage.removeItem(KEY)
  }
}

function upsert<T extends { id: Id }>(items: T[], item: T): T[] {
  return items.some((i) => i.id === item.id) ? items.map((i) => (i.id === item.id ? item : i)) : [...items, item]
}

function withoutValue(record: Record<Id, Id>, value: Id): Record<Id, Id> {
  return Object.fromEntries(Object.entries(record).filter(([, v]) => v !== value))
}
