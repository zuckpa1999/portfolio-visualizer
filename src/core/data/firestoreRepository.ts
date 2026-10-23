import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  FieldPath,
  getDocs,
  query,
  setDoc,
  where,
  writeBatch,
  type Firestore,
} from 'firebase/firestore/lite'
import { sortSnapshots } from '../domain/portfolio'
import type { Category, Grouping, Holding, Id, Portfolio, Snapshot } from '../domain/types'
import type { PortfolioRepository } from './repository'
import { seedPortfolio } from './seed'

type CollectionName = 'groupings' | 'categories' | 'holdings' | 'snapshots'

/** A Firestore batch holds at most 500 writes. */
const BATCH_LIMIT = 500

/**
 * Stores the portfolio in Firestore under users/{uid}: one document per grouping, category, holding and snapshot,
 * keyed by its id. Security rules (firestore.rules) restrict each user to their own documents.
 * Uses Firestore Lite (plain reads and writes, no live updates or offline cache), which is ~100 KB smaller.
 */
export class FirestoreRepository implements PortfolioRepository {
  private db: Firestore
  private uid: string

  constructor(db: Firestore, uid: string) {
    this.db = db
    this.uid = uid
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
    const [groupings, categories, holdings, snapshots] = await Promise.all([
      this.list<Grouping>('groupings'),
      this.list<Category>('categories'),
      this.list<Holding>('holdings'),
      this.list<Snapshot>('snapshots'),
    ])
    return {
      groupings: groupings.sort((a, b) => a.sortOrder - b.sortOrder),
      categories,
      holdings: holdings.sort((a, b) => a.sortOrder - b.sortOrder),
      snapshots: sortSnapshots(snapshots),
    }
  }

  private async list<T extends { id: Id }>(name: CollectionName): Promise<T[]> {
    const result = await getDocs(this.collection(name))
    return result.docs.map((d) => ({ ...d.data(), id: d.id }) as T)
  }

  private collection(name: CollectionName) {
    return collection(this.db, 'users', this.uid, name)
  }

  private ref(name: CollectionName, id: Id) {
    return doc(this.db, 'users', this.uid, name, id)
  }

  private put(name: CollectionName, item: { id: Id }) {
    return setDoc(this.ref(name, item.id), withoutId(item))
  }

  async upsertSnapshot(snapshot: Snapshot) {
    // setDoc replaces the whole document, so values removed from the snapshot are removed here too.
    await this.put('snapshots', snapshot)
  }

  async deleteSnapshot(id: Id) {
    await deleteDoc(this.ref('snapshots', id))
  }

  async upsertHolding(holding: Holding) {
    await this.put('holdings', holding)
  }

  async upsertCategory(category: Category) {
    await this.put('categories', category)
  }

  async deleteCategory(id: Id) {
    const holdings = await this.list<Holding>('holdings')
    const batch = writeBatch(this.db)
    batch.delete(this.ref('categories', id))
    for (const h of holdings) {
      for (const [groupingId, categoryId] of Object.entries(h.categoryIds)) {
        if (categoryId === id) batch.update(this.ref('holdings', h.id), new FieldPath('categoryIds', groupingId), deleteField())
      }
    }
    await batch.commit()
  }

  async upsertGrouping(grouping: Grouping) {
    await this.put('groupings', grouping)
  }

  async deleteGrouping(id: Id) {
    const [categories, holdings] = await Promise.all([
      getDocs(query(this.collection('categories'), where('groupingId', '==', id))),
      this.list<Holding>('holdings'),
    ])
    const batch = writeBatch(this.db)
    batch.delete(this.ref('groupings', id))
    for (const c of categories.docs) batch.delete(c.ref)
    for (const h of holdings) {
      if (id in h.categoryIds) batch.update(this.ref('holdings', h.id), new FieldPath('categoryIds', id), deleteField())
    }
    await batch.commit()
  }

  /** One-time import of the seed (the Google Sheet data) into an empty account. */
  private async importPortfolio(p: Portfolio) {
    const writes: (readonly [CollectionName, { id: Id }])[] = [
      ...p.groupings.map((g) => ['groupings', g] as const),
      ...p.categories.map((c) => ['categories', c] as const),
      ...p.holdings.map((h) => ['holdings', h] as const),
      ...p.snapshots.map((s) => ['snapshots', s] as const),
    ]
    for (let i = 0; i < writes.length; i += BATCH_LIMIT) {
      const batch = writeBatch(this.db)
      for (const [name, item] of writes.slice(i, i + BATCH_LIMIT)) batch.set(this.ref(name, item.id), withoutId(item))
      await batch.commit()
    }
  }
}

/** The id is the document's key, so it isn't repeated inside the document. */
function withoutId<T extends { id: Id }>({ id: _id, ...rest }: T) {
  return rest
}
