// @vitest-environment happy-dom
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PortfolioProvider, usePortfolio } from './PortfolioProvider'
import { FakeRepository, fixture, store } from './test-support'
import { useOverview, useSelectedGrouping, useSnapshotEditor } from './views'

vi.mock('../data/backend', async () => (await import('./test-support')).fakeBackend)

beforeEach(() => {
  localStorage.clear()
  store.repo = new FakeRepository(fixture)
})

/** Render `useView` inside a loaded PortfolioProvider. */
async function renderView<T>(useView: () => T) {
  const rendered = renderHook(() => ({ state: usePortfolio(), view: useView() }), { wrapper: PortfolioProvider })
  await waitFor(() => expect(rendered.result.current.state.status).toBe('ready'))
  return rendered
}

describe('useSnapshotEditor: new snapshot', () => {
  it('starts from the latest values and hides closed holdings', async () => {
    const { result } = await renderView(() => useSnapshotEditor())
    const editor = result.current.view
    expect(editor.visibleRows.map((r) => [r.holding.id, r.input])).toEqual([
      ['cash', '1,100'],
      ['sp500', '2,400'],
    ])
    expect(editor.closedCount).toBe(1)
    expect(editor.total).toBe(3500)
    expect(editor.canSave).toBe(false)
  })

  it('keeps a closed holding visible once you give it a value again', async () => {
    const { result } = await renderView(() => useSnapshotEditor())
    act(() => result.current.view.setShowClosed(true))
    act(() => result.current.view.setInput('closed', '300'))
    act(() => result.current.view.setShowClosed(false))
    expect(result.current.view.visibleRows.map((r) => r.holding.id)).toEqual(['cash', 'sp500', 'closed'])
    expect(result.current.view.closedCount).toBe(0)
  })

  it('updates the total and its change vs the latest snapshot as you type', async () => {
    const { result } = await renderView(() => useSnapshotEditor())
    act(() => result.current.view.setInput('cash', '1,500'))
    const editor = result.current.view
    expect(editor.total).toBe(3900)
    expect(editor.totalChange?.amount).toBe(400)
    expect(editor.changedCount).toBe(1)
    expect(editor.canSave).toBe(true)
  })

  it('blocks saving while an input is invalid, keeping the last value in the total', async () => {
    const { result } = await renderView(() => useSnapshotEditor())
    act(() => {
      result.current.view.setInput('cash', '1,500')
      result.current.view.setInput('sp500', 'abc')
    })
    const editor = result.current.view
    expect(editor.rows.find((r) => r.holding.id === 'sp500')?.invalid).toBe(true)
    expect(editor.total).toBe(3900)
    expect(editor.canSave).toBe(false)
  })

  it('keeps the draft when you leave the screen and come back', async () => {
    const first = await renderView(() => useSnapshotEditor())
    act(() => first.result.current.view.setInput('cash', '1,500'))
    first.unmount()

    const { result } = await renderView(() => useSnapshotEditor())
    expect(result.current.view.rows.find((r) => r.holding.id === 'cash')?.input).toBe('1,500')
    expect(result.current.view.total).toBe(3900)
  })

  it('saves a new latest snapshot with untouched values carried forward, then clears the draft', async () => {
    const { result } = await renderView(() => useSnapshotEditor())
    act(() => result.current.view.setInput('cash', '1,500'))
    await act(() => result.current.view.save())

    const latest = result.current.state.portfolio.snapshots.at(-1)
    expect(result.current.state.portfolio.snapshots).toHaveLength(4)
    expect(latest?.values).toEqual({ cash: 1500, sp500: 2400, closed: 0 })
    expect(result.current.view.dirty).toBe(false)
  })

  it('leaves no edits behind once saved, even if that snapshot is then deleted', async () => {
    const { result } = await renderView(() => useSnapshotEditor())
    act(() => result.current.view.setInput('cash', '1,500'))
    const saved = await act(() => result.current.view.save())
    await act(() => result.current.state.actions.deleteSnapshot(saved.id))

    expect(result.current.view.dirty).toBe(false)
    expect(result.current.view.rows.find((r) => r.holding.id === 'cash')?.input).toBe('1,100')
  })
})

describe('useSnapshotEditor: correcting a past snapshot', () => {
  it('starts from that snapshot and compares with the one before it', async () => {
    const { result } = await renderView(() => useSnapshotEditor('s-sep-10'))
    act(() => result.current.view.setInput('sp500', '2,000'))
    expect(result.current.view.total).toBe(3200)
    expect(result.current.view.totalChange?.amount).toBe(-200)
  })

  it('saves in place, keeping its id and time', async () => {
    const { result } = await renderView(() => useSnapshotEditor('s-sep-10'))
    act(() => result.current.view.setInput('sp500', '2,000'))
    await act(() => result.current.view.save())

    expect(result.current.state.portfolio.snapshots).toEqual([
      fixture.snapshots[0],
      { id: 's-sep-10', takenAt: '2026-09-10T09:00:00', values: { cash: 1200, sp500: 2000, closed: 0 } },
      fixture.snapshots[2],
    ])
  })

  it('leaves the new-snapshot draft alone when you edit a past snapshot and leave without saving', async () => {
    const draft = await renderView(() => useSnapshotEditor())
    act(() => draft.result.current.view.setInput('cash', '1,500'))
    draft.unmount()
    const correction = await renderView(() => useSnapshotEditor('s-sep-10'))
    act(() => correction.result.current.view.setInput('sp500', '2,000'))
    correction.unmount()

    const { result } = await renderView(() => useSnapshotEditor())
    expect(result.current.view.rows.map((r) => [r.holding.id, r.input])).toEqual([
      ['cash', '1,500'],
      ['sp500', '2,400'],
      ['closed', '0'],
    ])
  })
})

describe('useOverview', () => {
  it('compares the portfolio value with the previous snapshot and with the end of last month', async () => {
    const { result } = await renderView(() => useOverview('g-product'))
    const overview = result.current.view
    expect(overview.total).toBe(3500)
    expect(overview.vsPrevious?.amount).toBe(200)
    expect(overview.monthly?.amount).toBe(100)
    expect(overview.baselineTakenAt).toBe('2026-08-31T09:00:00')
  })

  it('compares each category the same way, largest category first', async () => {
    const { result } = await renderView(() => useOverview('g-product'))
    expect(result.current.view.slices.map((s) => [s.category.name, s.value, s.vsPrevious?.amount, s.monthly?.amount])).toEqual([
      ['Stocks', 2400, 300, 0],
      ['Cash', 1100, -100, 100],
    ])
  })
})

describe('useSelectedGrouping', () => {
  it('starts on the first grouping and remembers the one you pick', async () => {
    const first = await renderView(() => useSelectedGrouping())
    expect(first.result.current.view[0]).toBe('g-product')
    act(() => first.result.current.view[1]('g-asset'))
    first.unmount()

    const { result } = await renderView(() => useSelectedGrouping())
    expect(result.current.view[0]).toBe('g-asset')
  })

  it('falls back to the first grouping when the remembered one is deleted', async () => {
    const { result } = await renderView(() => useSelectedGrouping())
    act(() => result.current.view[1]('g-asset'))
    await act(() => result.current.state.actions.deleteGrouping('g-asset'))
    expect(result.current.view[0]).toBe('g-product')
  })
})
