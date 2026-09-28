import { CATEGORY_PALETTE } from '../../colors'
import type { Category, Holding, Portfolio, Snapshot } from '../../domain/types'

/** One row of the original Google Sheet. `null` value = the holding did not exist at that date. */
export interface SeedRow {
  name: string
  product: string
  assetClass: string
  invested: number | null
  values: (number | null)[]
}

export interface SeedInput {
  /** ISO timestamps, one per entry in each row's `values`, oldest first. */
  snapshotDates: string[]
  assetClassColors?: Record<string, string>
  rows: SeedRow[]
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

export function buildPortfolio(input: SeedInput): Portfolio {
  const groupings = [
    { id: 'g-product', name: 'Product', sortOrder: 0 },
    { id: 'g-asset-class', name: 'Asset class', sortOrder: 1 },
  ]
  const categories: Category[] = []
  const categoryId = (groupingId: string, name: string, color?: string) => {
    const id = `${groupingId}:${slug(name)}`
    if (!categories.some((c) => c.id === id)) {
      const inGrouping = categories.filter((c) => c.groupingId === groupingId).length
      categories.push({ id, groupingId, name, color: color ?? CATEGORY_PALETTE[inGrouping % CATEGORY_PALETTE.length] })
    }
    return id
  }

  const holdings: Holding[] = input.rows.map((row, i) => ({
    id: `h-${slug(row.name)}`,
    name: row.name,
    investedAmount: row.invested,
    sortOrder: i,
    categoryIds: {
      'g-product': categoryId('g-product', row.product),
      'g-asset-class': categoryId('g-asset-class', row.assetClass, input.assetClassColors?.[row.assetClass]),
    },
  }))

  const snapshots: Snapshot[] = input.snapshotDates.map((takenAt, i) => {
    const values: Record<string, number> = {}
    input.rows.forEach((row, r) => {
      const v = row.values[i]
      if (v !== null && v !== undefined) values[holdings[r].id] = v
    })
    return { id: `s-seed-${i}`, takenAt, values }
  })

  return { groupings, categories, holdings, snapshots }
}

export const ASSET_CLASS_COLORS: Record<string, string> = {
  Cash: '#A0CBE8',
  Bond: '#76B7B2',
  Stocks: '#4E79A7',
  Gold: '#EDC948',
  Crypto: '#F28E2B',
}
