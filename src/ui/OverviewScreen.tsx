import { useState } from 'react'
import { ChevronDown, Settings } from 'lucide-react'
import { AllocationDonut } from '@/core/charts/AllocationDonut'
import type { Id } from '@/core/domain/types'
import { formatDateTime, formatShare, formatShortDate, formatTHB } from '@/core/format'
import { useOverview, useSelectedGrouping } from '@/core/state/views'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ChangeText, Dot, Segmented } from './common'

export function OverviewScreen({ onOpenSettings }: { onOpenSettings(): void }) {
  const [groupingId, setGroupingId] = useSelectedGrouping()
  const view = useOverview(groupingId)
  const [activeId, setActiveId] = useState<Id | null>(null)
  const active = view.slices.find((s) => s.category.id === activeId)

  if (!view.latest) {
    return <p className="p-8 text-center text-sm text-muted-foreground">No snapshots yet. Add one from Update.</p>
  }

  return (
    <div>
      <header className="px-5 pt-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Portfolio value</p>
          <Button variant="ghost" size="icon" onClick={onOpenSettings} aria-label="Settings">
            <Settings className="size-5 text-muted-foreground" />
          </Button>
        </div>
        <p className="mt-1 text-4xl font-semibold tracking-tight tabular-nums">{formatTHB(view.total)}</p>
        <p className="mt-1 text-xs text-muted-foreground">As of {formatDateTime(view.latest.takenAt)}</p>

        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl border bg-background px-3 py-2.5">
            <dt className="text-xs text-muted-foreground">
              vs previous{view.previousTakenAt && ` · ${formatShortDate(view.previousTakenAt)}`}
            </dt>
            <dd className="mt-0.5 font-medium">
              <ChangeText change={view.vsPrevious} />
            </dd>
          </div>
          <div className="rounded-xl border bg-background px-3 py-2.5">
            <dt className="text-xs text-muted-foreground">
              This month{view.baselineTakenAt && ` · since ${formatShortDate(view.baselineTakenAt)}`}
            </dt>
            <dd className="mt-0.5 font-medium">
              <ChangeText change={view.monthly} />
            </dd>
          </div>
        </dl>
      </header>

      {view.groupings.length > 1 && (
        <div className="px-5 pt-6">
          <Segmented
            value={groupingId}
            onChange={(v) => {
              setGroupingId(v)
              setActiveId(null)
            }}
            options={view.groupings.map((g) => ({ value: g.id, label: g.name }))}
          />
        </div>
      )}

      <div className="md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] md:items-start md:gap-6 md:px-5 md:pt-6">
        <div className="px-5 pt-6 md:sticky md:top-6 md:px-0 md:pt-0">
          <AllocationDonut
            slices={view.slices.map((s) => ({ id: s.category.id, name: s.category.name, color: s.category.color, value: s.value }))}
            activeId={activeId}
            onActiveChange={setActiveId}
            strokeColor="#fafafa"
            center={
              active ? (
                <>
                  <span className="text-xs text-muted-foreground">{active.category.name}</span>
                  <span className="text-lg font-semibold tabular-nums">{formatTHB(active.value)}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">{formatShare(active.share)}</span>
                </>
              ) : (
                <>
                  <span className="text-xs text-muted-foreground">{view.slices.length} categories</span>
                  <span className="text-lg font-semibold tabular-nums">{formatTHB(view.total)}</span>
                </>
              )
            }
          />
        </div>

        <ul className="mx-4 mt-6 divide-y overflow-hidden rounded-xl border bg-background md:mx-0 md:mt-0">
          {view.slices.map((s) => {
            const open = s.category.id === activeId
            return (
              <li key={s.category.id}>
                <button
                  className={cn('flex w-full items-center gap-3 px-4 py-3 text-left', open && 'bg-muted/60')}
                  onClick={() => setActiveId(open ? null : s.category.id)}
                >
                  <Dot color={s.category.color} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{s.category.name}</span>
                    <ChangeText change={s.vsPrevious} className="text-xs" />
                  </span>
                  <span className="text-right">
                    <span className="block text-sm font-medium tabular-nums">{formatTHB(s.value)}</span>
                    <span className="block text-xs text-muted-foreground tabular-nums">{formatShare(s.share)}</span>
                  </span>
                  <ChevronDown className={cn('size-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
                </button>
                {open && (
                  <ul className="bg-muted/30 px-4 pb-2">
                    {s.holdings.map(({ holding, value }) => (
                      <li key={holding.id} className="flex justify-between gap-3 py-1.5 pl-5.5 text-xs">
                        <span className="truncate text-muted-foreground">{holding.name}</span>
                        <span className="tabular-nums">{formatTHB(value)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
