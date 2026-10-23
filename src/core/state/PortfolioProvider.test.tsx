// @vitest-environment happy-dom
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PortfolioProvider, usePortfolio } from './PortfolioProvider'
import { FakeRepository, fixture, store } from './test-support'

vi.mock('../data/backend', async () => (await import('./test-support')).fakeBackend)

beforeEach(() => {
  localStorage.clear()
  store.repo = new FakeRepository(fixture)
})

async function renderPortfolio() {
  const rendered = renderHook(() => usePortfolio(), { wrapper: PortfolioProvider })
  await waitFor(() => expect(rendered.result.current.status).toBe('ready'))
  return rendered
}

const categoriesOf = (holdings: { id: string; categoryIds: Record<string, string> }[]) =>
  Object.fromEntries(holdings.map((h) => [h.id, h.categoryIds]))

describe('deleting', () => {
  it('a category leaves its holdings Uncategorised in that grouping only', async () => {
    const { result } = await renderPortfolio()
    await act(() => result.current.actions.deleteCategory('c-stocks'))

    expect(result.current.portfolio.categories.map((c) => c.id)).toEqual(['c-cash', 'c-liquid'])
    expect(categoriesOf(result.current.portfolio.holdings)).toEqual({
      cash: { 'g-product': 'c-cash', 'g-asset': 'c-liquid' },
      sp500: {},
      closed: {},
    })
  })

  it('a grouping removes its categories and takes it off every holding', async () => {
    const { result } = await renderPortfolio()
    await act(() => result.current.actions.deleteGrouping('g-asset'))

    expect(result.current.portfolio.groupings.map((g) => g.id)).toEqual(['g-product'])
    expect(result.current.portfolio.categories.map((c) => c.id)).toEqual(['c-cash', 'c-stocks'])
    expect(categoriesOf(result.current.portfolio.holdings)).toEqual({
      cash: { 'g-product': 'c-cash' },
      sp500: { 'g-product': 'c-stocks' },
      closed: { 'g-product': 'c-stocks' },
    })
  })
})

describe('adding', () => {
  it('a holding puts it after the existing ones', async () => {
    const { result } = await renderPortfolio()
    const gold = await act(() => result.current.actions.addHolding('Gold', { 'g-product': 'c-stocks' }))

    expect(gold).toMatchObject({ name: 'Gold', sortOrder: 3, investedAmount: null, categoryIds: { 'g-product': 'c-stocks' } })
    expect(result.current.portfolio.holdings.map((h) => h.name)).toEqual(['Cash', 'SP500', 'Closed', 'Gold'])
  })

  it('a category gives it a colour not yet used in its grouping', async () => {
    const { result } = await renderPortfolio()
    const bonds = await act(() => result.current.actions.addCategory('g-product', 'Bonds'))
    const equity = await act(() => result.current.actions.addCategory('g-asset', 'Equity'))

    expect(bonds.color).toBe('#59A14F')
    expect(equity.color).toBe('#F28E2B')
  })
})

describe('when saving fails', () => {
  it('shows the error and goes back to what is stored', async () => {
    const { result } = await renderPortfolio()
    store.repo.failNextWrite = true
    await act(() =>
      result.current.actions.saveSnapshot({ id: 's-oct', takenAt: '2026-10-01T09:00:00', values: { cash: 9999 } }),
    )

    expect(result.current.error).toBe('You are offline')
    expect(result.current.portfolio.snapshots.map((s) => s.id)).toEqual(['s-aug', 's-sep-10', 's-sep-20'])
  })

  it('lets you dismiss the error', async () => {
    const { result } = await renderPortfolio()
    store.repo.failNextWrite = true
    await act(() => result.current.actions.deleteSnapshot('s-aug'))
    act(() => result.current.dismissError())

    expect(result.current.error).toBeNull()
    expect(result.current.portfolio.snapshots).toHaveLength(3)
  })
})
