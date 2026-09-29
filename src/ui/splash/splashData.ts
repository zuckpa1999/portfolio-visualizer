import { usePortfolio } from '@/core/state/PortfolioProvider'
import { useHistory, useOverview, useSelectedGrouping } from '@/core/state/views'
import { DEFAULT_SPLASH, SPLASH_VARIANTS } from './registry'
import type { SplashData } from './types'

export function useSplashData(): { ready: boolean; data: SplashData } {
  const { status } = usePortfolio()
  const [groupingId] = useSelectedGrouping()
  const view = useOverview(groupingId)
  const { points } = useHistory()
  return {
    ready: status !== 'loading',
    data: {
      total: view.total,
      change: view.vsPrevious,
      slices: view.slices.map((s) => ({ id: s.category.id, color: s.category.color, share: s.share })),
      history: points.map((p) => p.value),
    },
  }
}

/** `?splash=<id>` previews a specific variant in the real app. */
export function chosenSplashId(): string {
  const requested = new URLSearchParams(window.location.search).get('splash')
  return SPLASH_VARIANTS.some((v) => v.id === requested) ? requested! : DEFAULT_SPLASH
}
