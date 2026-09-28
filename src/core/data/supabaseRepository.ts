import type { SupabaseClient } from '@supabase/supabase-js'
import { sortSnapshots } from '../domain/portfolio'
import type { Category, Grouping, Holding, Id, Portfolio, Snapshot } from '../domain/types'
import type { PortfolioRepository } from './repository'
import { seedPortfolio } from './seed'

/** Stores the portfolio in Supabase. Row-level security scopes every query to the signed-in user. */
export class SupabaseRepository implements PortfolioRepository {
  private db: SupabaseClient

  constructor(db: SupabaseClient) {
    this.db = db
  }

  async load(): Promise<Portfolio> {
    const portfolio = await this.fetchAll()
    if (portfolio.holdings.length === 0 && portfolio.snapshots.length === 0) {
      await this.importPortfolio(seedPortfolio)
      return this.fetchAll()
    }
    return portfolio
  }

  private async fetchAll(): Promise<Portfolio> {
    const [groupings, categories, holdings, holdingCategories, snapshots, values] = await Promise.all([
      this.select('groupings'),
      this.select('categories'),
      this.select('holdings'),
      this.select('holding_categories'),
      this.select('snapshots'),
      this.select('snapshot_values'),
    ])

    return {
      groupings: groupings
        .map((g) => ({ id: g.id, name: g.name, sortOrder: g.sort_order }))
        .sort((a, b) => a.sortOrder - b.sortOrder),
      categories: categories.map((c) => ({ id: c.id, groupingId: c.grouping_id, name: c.name, color: c.color })),
      holdings: holdings
        .map((h) => ({
          id: h.id,
          name: h.name,
          investedAmount: h.invested_amount === null ? null : Number(h.invested_amount),
          sortOrder: h.sort_order,
          categoryIds: Object.fromEntries(
            holdingCategories.filter((hc) => hc.holding_id === h.id).map((hc) => [hc.grouping_id, hc.category_id]),
          ),
        }))
        .sort((a, b) => a.sortOrder - b.sortOrder),
      snapshots: sortSnapshots(
        snapshots.map((s) => ({
          id: s.id,
          takenAt: new Date(s.taken_at).toISOString(),
          values: Object.fromEntries(
            values.filter((v) => v.snapshot_id === s.id).map((v) => [v.holding_id, Number(v.value)]),
          ),
        })),
      ),
    }
  }

  private async select(table: string): Promise<any[]> {
    const { data, error } = await this.db.from(table).select('*')
    if (error) throw error
    return data
  }

  private async check(promise: PromiseLike<{ error: unknown }>) {
    const { error } = await promise
    if (error) throw error
  }

  async upsertSnapshot(snapshot: Snapshot) {
    await this.check(
      this.db.rpc('save_snapshot', { p_id: snapshot.id, p_taken_at: snapshot.takenAt, p_values: snapshot.values }),
    )
  }

  async deleteSnapshot(id: Id) {
    await this.check(this.db.from('snapshots').delete().eq('id', id))
  }

  async upsertHolding(holding: Holding) {
    await this.check(
      this.db.from('holdings').upsert({
        id: holding.id,
        name: holding.name,
        invested_amount: holding.investedAmount,
        sort_order: holding.sortOrder,
      }),
    )
    await this.check(this.db.from('holding_categories').delete().eq('holding_id', holding.id))
    const rows = Object.entries(holding.categoryIds).map(([groupingId, categoryId]) => ({
      holding_id: holding.id,
      grouping_id: groupingId,
      category_id: categoryId,
    }))
    if (rows.length > 0) await this.check(this.db.from('holding_categories').insert(rows))
  }

  async upsertCategory(category: Category) {
    await this.check(
      this.db
        .from('categories')
        .upsert({ id: category.id, grouping_id: category.groupingId, name: category.name, color: category.color }),
    )
  }

  async deleteCategory(id: Id) {
    await this.check(this.db.from('categories').delete().eq('id', id))
  }

  async upsertGrouping(grouping: Grouping) {
    await this.check(
      this.db.from('groupings').upsert({ id: grouping.id, name: grouping.name, sort_order: grouping.sortOrder }),
    )
  }

  async deleteGrouping(id: Id) {
    await this.check(this.db.from('groupings').delete().eq('id', id))
  }

  /** One-time import of the seed (the Google Sheet data) into an empty account. */
  private async importPortfolio(p: Portfolio) {
    for (const g of p.groupings) await this.upsertGrouping(g)
    for (const c of p.categories) await this.upsertCategory(c)
    for (const h of p.holdings) await this.upsertHolding(h)
    for (const s of p.snapshots) await this.upsertSnapshot(s)
  }
}
