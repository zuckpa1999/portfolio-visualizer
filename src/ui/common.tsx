import type { Change } from '@/core/domain/portfolio'
import { formatChange, trendOf } from '@/core/format'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'

const trendClass = {
  up: 'text-emerald-600',
  down: 'text-red-600',
  flat: 'text-muted-foreground',
  none: 'text-muted-foreground',
}

export function ChangeText({ change, className }: { change: Change | null; className?: string }) {
  return <span className={cn('tabular-nums', trendClass[trendOf(change)], className)}>{formatChange(change)}</span>
}

export function Dot({ color, className }: { color: string; className?: string }) {
  return <span className={cn('inline-block size-2.5 shrink-0 rounded-full', className)} style={{ background: color }} />
}

export function ScreenHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <header className="flex items-start justify-between gap-4 px-5 pt-6 pb-4">
      <div className="min-w-0">
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </header>
  )
}

/** iOS-style segmented control: muted track, selected option raised on white. */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T | undefined
  onChange(value: T): void
  options: { value: T; label: string }[]
  className?: string
}) {
  return (
    <ToggleGroup
      type="single"
      spacing={0}
      value={value}
      onValueChange={(v) => v && onChange(v as T)}
      className={cn('w-full rounded-lg bg-neutral-200/60 p-0.5', className)}
    >
      {options.map((o) => (
        <ToggleGroupItem
          key={o.value}
          value={o.value}
          className="h-8 flex-1 rounded-md! px-3 whitespace-nowrap text-muted-foreground data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm"
        >
          {o.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
