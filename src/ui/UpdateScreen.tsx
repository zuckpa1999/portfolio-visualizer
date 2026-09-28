import { usePortfolio } from '@/core/state/PortfolioProvider'
import { formatDateTime } from '@/core/format'
import { ScreenHeader } from './common'
import { SnapshotEditor } from './SnapshotEditor'

export function UpdateScreen({ onSaved }: { onSaved(): void }) {
  const latest = usePortfolio().portfolio.snapshots.at(-1)
  return (
    <div>
      <ScreenHeader
        title="New snapshot"
        subtitle={latest ? `Starting from ${formatDateTime(latest.takenAt)}` : 'Enter the current value of each holding'}
      />
      <SnapshotEditor onSaved={onSaved} />
    </div>
  )
}
