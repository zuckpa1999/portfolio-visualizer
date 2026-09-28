import type { Id } from '@/core/domain/types'
import { formatTHB, hasChange } from '@/core/format'
import { useSnapshotEditor } from '@/core/state/views'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { ChangeText } from './common'

interface Props {
  /** Omit for a new snapshot (draft kept on this device); pass to correct an existing one. */
  snapshotId?: Id
  onSaved(): void
  onCancel?(): void
  /** Distance of the sticky footer from the bottom (clears the tab bar by default). */
  footerClassName?: string
}

export function SnapshotEditor({ snapshotId, onSaved, onCancel, footerClassName = 'bottom-[calc(4.5rem+env(safe-area-inset-bottom))]' }: Props) {
  const editor = useSnapshotEditor(snapshotId)

  return (
    <div>
      <ul className="mx-4 divide-y overflow-hidden rounded-xl border bg-background">
        {editor.visibleRows.map((row) => (
          <li key={row.holding.id} className="flex items-center gap-3 px-4 py-2.5">
            <div className="min-w-0 flex-1">
              <p className={cn('truncate text-sm', row.closed && 'text-muted-foreground')}>{row.holding.name}</p>
              {hasChange(row.vsPrevious) && <ChangeText change={row.vsPrevious} className="text-xs" />}
            </div>
            <Input
              inputMode="decimal"
              enterKeyHint="next"
              aria-label={`${row.holding.name} value`}
              aria-invalid={row.invalid || undefined}
              value={row.input}
              placeholder="0"
              onFocus={(e) => e.currentTarget.select()}
              onChange={(e) => editor.setInput(row.holding.id, e.target.value)}
              className={cn('h-10 w-36 text-right text-base tabular-nums', row.changed && 'border-foreground/40 font-medium')}
            />
          </li>
        ))}
      </ul>

      {editor.closedCount > 0 && (
        <label className="mx-4 mt-3 flex items-center justify-between px-1 text-sm text-muted-foreground">
          Show {editor.closedCount} closed holdings
          <Switch checked={editor.showClosed} onCheckedChange={editor.setShowClosed} />
        </label>
      )}

      <div className={cn('sticky z-10 mx-4 mt-4 mb-4', footerClassName, 'rounded-xl border bg-background p-3 shadow-sm')}>
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-muted-foreground">
            {editor.changedCount ? `${editor.changedCount} changed` : 'No changes yet'}
          </span>
          <span className="text-right">
            <span className="block text-base font-semibold tabular-nums">{formatTHB(editor.total)}</span>
            {hasChange(editor.totalChange) && <ChangeText change={editor.totalChange} className="text-xs" />}
          </span>
        </div>
        <div className="mt-3 flex gap-2">
          <Button
            variant="outline"
            className="h-10 flex-1"
            onClick={() => (onCancel ? onCancel() : editor.discard())}
            disabled={!onCancel && !editor.dirty}
          >
            {onCancel ? 'Cancel' : 'Discard'}
          </Button>
          <Button
            className="h-10 flex-1"
            disabled={!editor.canSave}
            onClick={async () => {
              await editor.save()
              onSaved()
            }}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}
