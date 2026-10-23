// Shared by the hook and provider tests. Stands in for the storage boundary (src/core/data/backend.ts).
import type { PortfolioRepository } from '../data/repository'
import type { Category, Grouping, Holding, Id, Portfolio, Snapshot } from '../domain/types'

/**
 * Product: Cash / Stocks. Asset class: Liquid.
 * "Closed" was sold in early September, so the latest snapshot records it at zero.
 */
export const fixture: Portfolio = {
  groupings: [
    { id: 'g-product', name: 'Product', sortOrder: 0 },
    { id: 'g-asset', name: 'Asset class', sortOrder: 1 },
  ],
  categories: [
    { id: 'c-cash', groupingId: 'g-product', name: 'Cash', color: '#4E79A7' },
    { id: 'c-stocks', groupingId: 'g-product', name: 'Stocks', color: '#F28E2B' },
    { id: 'c-liquid', groupingId: 'g-asset', name: 'Liquid', color: '#4E79A7' },
  ],
  holdings: [
    { id: 'cash', name: 'Cash', investedAmount: null, sortOrder: 0, categoryIds: { 'g-product': 'c-cash', 'g-asset': 'c-liquid' } },
    { id: 'sp500', name: 'SP500', investedAmount: null, sortOrder: 1, categoryIds: { 'g-product': 'c-stocks' } },
    { id: 'closed', name: 'Closed', investedAmount: null, sortOrder: 2, categoryIds: { 'g-product': 'c-stocks' } },
  ],
  snapshots: [
    { id: 's-aug', takenAt: '2026-08-31T09:00:00', values: { cash: 1000, sp500: 2000, closed: 400 } },
    { id: 's-sep-10', takenAt: '2026-09-10T09:00:00', values: { cash: 1200, sp500: 2100, closed: 0 } },
    { id: 's-sep-20', takenAt: '2026-09-20T09:00:00', values: { cash: 1100, sp500: 2400, closed: 0 } },
  ],
}

/** Keeps the portfolio in memory. `failNextWrite` makes the next save or delete reject, like going offline. */
export class FakeRepository implements PortfolioRepository {
  stored: Portfolio
  failNextWrite = false

  constructor(portfolio: Portfolio) {
    this.stored = structuredClone(portfolio)
  }

  async load() {
    return structuredClone(this.stored)
  }

  private write(update: (p: Portfolio) => Portfolio) {
    if (this.failNextWrite) {
      this.failNextWrite = false
      return Promise.reject(new Error('You are offline'))
    }
    this.stored = update(this.stored)
    return Promise.resolve()
  }

  upsertSnapshot = (s: Snapshot) => this.write((p) => ({ ...p, snapshots: upsert(p.snapshots, s) }))
  deleteSnapshot = (id: Id) => this.write((p) => ({ ...p, snapshots: p.snapshots.filter((s) => s.id !== id) }))
  upsertHolding = (h: Holding) => this.write((p) => ({ ...p, holdings: upsert(p.holdings, h) }))
  upsertCategory = (c: Category) => this.write((p) => ({ ...p, categories: upsert(p.categories, c) }))
  deleteCategory = (id: Id) => this.write((p) => ({ ...p, categories: p.categories.filter((c) => c.id !== id) }))
  upsertGrouping = (g: Grouping) => this.write((p) => ({ ...p, groupings: upsert(p.groupings, g) }))
  deleteGrouping = (id: Id) => this.write((p) => ({ ...p, groupings: p.groupings.filter((g) => g.id !== id) }))
}

function upsert<T extends { id: Id }>(items: T[], item: T): T[] {
  return items.some((i) => i.id === item.id) ? items.map((i) => (i.id === item.id ? item : i)) : [...items, item]
}

/** The repository the mocked backend hands to PortfolioProvider. Replace it in beforeEach. */
export const store = { repo: new FakeRepository(fixture) }

/** Replacement for src/core/data/backend.ts: `vi.mock('../data/backend', () => fakeBackend)`. */
export const fakeBackend = {
  auth: null,
  backendKind: 'local' as const,
  createRepository: () => store.repo,
}
