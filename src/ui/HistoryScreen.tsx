import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { ValueHistoryChart } from '@/core/charts/ValueHistoryChart'
import type { Id } from '@/core/domain/types'
import { formatDateTime, formatTHB } from '@/core/format'
import { useHistory } from '@/core/state/views'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ChangeText, ScreenHeader } from './common'
import { SnapshotEditor } from './SnapshotEditor'

const chartTheme = {
  line: '#18181b',
  grid: '#e4e4e7',
  text: '#71717a',
  tooltipBackground: '#ffffff',
  tooltipBorder: '#e4e4e7',
  fontFamily: 'Geist Variable, sans-serif',
}

export function HistoryScreen() {
  const history = useHistory()
  const [editingId, setEditingId] = useState<Id | null>(null)
  const editing = history.points.find((p) => p.snapshot.id === editingId)

  return (
    <div>
      <ScreenHeader title="History" subtitle={`${history.points.length} snapshots`} />

      {history.points.length > 1 && (
        <div className="mx-4 rounded-xl border bg-background px-2 pt-4 pb-2">
          <ValueHistoryChart points={history.points.map((p) => ({ takenAt: p.snapshot.takenAt, value: p.value }))} theme={chartTheme} />
        </div>
      )}

      <ul className="mx-4 mt-4 divide-y overflow-hidden rounded-xl border bg-background">
        {history.newestFirst.map((p) => (
          <li key={p.snapshot.id}>
            <button className="flex w-full items-center gap-3 px-4 py-3 text-left" onClick={() => setEditingId(p.snapshot.id)}>
              <span className="min-w-0 flex-1 text-sm">{formatDateTime(p.snapshot.takenAt)}</span>
              <span className="text-right">
                <span className="block text-sm font-medium tabular-nums">{formatTHB(p.value)}</span>
                <ChangeText change={p.vsPrevious} className="text-xs" />
              </span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </button>
          </li>
        ))}
      </ul>

      <Sheet open={editing !== undefined} onOpenChange={(open) => !open && setEditingId(null)}>
        <SheetContent side="bottom" className="h-[92dvh] gap-0 overflow-y-auto rounded-t-2xl bg-neutral-50 p-0">
          {editing && (
            <>
              <SheetHeader className="flex-row items-start justify-between px-5 pt-5 pb-4">
                <div>
                  <SheetTitle>Edit snapshot</SheetTitle>
                  <SheetDescription>{formatDateTime(editing.snapshot.takenAt)}</SheetDescription>
                </div>
              </SheetHeader>
              <SnapshotEditor
                snapshotId={editing.snapshot.id}
                footerClassName="bottom-0"
                onSaved={() => setEditingId(null)}
                onCancel={() => setEditingId(null)}
              />
              <div className="px-4 pb-8">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" className="w-full text-red-600 hover:text-red-700">
                      Delete snapshot
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent size="sm">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this snapshot?</AlertDialogTitle>
                      <AlertDialogDescription>
                        {formatDateTime(editing.snapshot.takenAt)} · {formatTHB(editing.value)}. This can't be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        variant="destructive"
                        onClick={() => {
                          void history.deleteSnapshot(editing.snapshot.id)
                          setEditingId(null)
                        }}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
