import type { Category, Grouping, Holding, Id, Portfolio, Snapshot } from '../domain/types'

/** Persistence boundary. The UI never talks to storage directly. */
export interface PortfolioRepository {
  load(): Promise<Portfolio>
  upsertSnapshot(snapshot: Snapshot): Promise<void>
  deleteSnapshot(id: Id): Promise<void>
  upsertHolding(holding: Holding): Promise<void>
  upsertCategory(category: Category): Promise<void>
  /** Holdings in this category become Uncategorised in its grouping. */
  deleteCategory(id: Id): Promise<void>
  upsertGrouping(grouping: Grouping): Promise<void>
  /** Also deletes the grouping's categories. */
  deleteGrouping(id: Id): Promise<void>
}
