// Domain types. Vocabulary follows CONTEXT.md.

export type Id = string

/** One way of dividing the portfolio into categories, e.g. "Product" or "Asset class". */
export interface Grouping {
  id: Id
  name: string
  sortOrder: number
}

/** A bucket within a grouping. */
export interface Category {
  id: Id
  groupingId: Id
  name: string
  /** Hex colour, stable wherever this category is drawn. */
  color: string
}

/** A single position held in one account or app. */
export interface Holding {
  id: Id
  name: string
  /** Money put into the holding. Stored for future gain/loss; not shown in v1. */
  investedAmount: number | null
  /** groupingId -> categoryId. At most one category per grouping. */
  categoryIds: Record<Id, Id>
  sortOrder: number
}

/** Timestamped value (THB) of every holding at one moment. */
export interface Snapshot {
  id: Id
  /** ISO 8601 timestamp. */
  takenAt: string
  /** holdingId -> value in THB. A holding with no key did not exist yet. */
  values: Record<Id, number>
}

export interface Portfolio {
  groupings: Grouping[]
  categories: Category[]
  holdings: Holding[]
  /** Sorted oldest -> newest. */
  snapshots: Snapshot[]
}
