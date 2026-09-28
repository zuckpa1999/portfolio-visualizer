import { useState } from 'react'
import { ArrowLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { backendKind } from '@/core/data/backend'
import { LocalRepository } from '@/core/data/localRepository'
import { categoryOf } from '@/core/domain/portfolio'
import type { Category, Holding, Id } from '@/core/domain/types'
import { usePortfolio } from '@/core/state/PortfolioProvider'
import type { useSession } from '@/core/state/useSession'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Dot, Segmented } from './common'

type Section = 'holdings' | 'categories' | 'account'

export function SettingsScreen({ session, onClose }: { session: ReturnType<typeof useSession>; onClose(): void }) {
  const [section, setSection] = useState<Section>('holdings')

  return (
    <div>
      <header className="flex items-center gap-2 px-3 pt-4 pb-2">
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Back">
          <ArrowLeft className="size-5" />
        </Button>
        <h1 className="text-lg font-semibold tracking-tight">Settings</h1>
      </header>

      <div className="px-4 pb-4">
        <Segmented<Section>
          value={section}
          onChange={setSection}
          options={[
            { value: 'holdings', label: 'Holdings' },
            { value: 'categories', label: 'Categories' },
            { value: 'account', label: 'Account' },
          ]}
        />
      </div>

      {section === 'holdings' && <HoldingsSettings />}
      {section === 'categories' && <CategoriesSettings />}
      {section === 'account' && <AccountSettings session={session} />}
    </div>
  )
}

function HoldingsSettings() {
  const { portfolio } = usePortfolio()
  const [editing, setEditing] = useState<Holding | 'new' | null>(null)
  const holdings = [...portfolio.holdings].sort((a, b) => a.sortOrder - b.sortOrder)
  const groupings = [...portfolio.groupings].sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <div className="px-4">
      <ul className="divide-y overflow-hidden rounded-xl border bg-background">
        {holdings.map((h) => (
          <li key={h.id}>
            <button className="flex w-full items-center gap-3 px-4 py-3 text-left" onClick={() => setEditing(h)}>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm">{h.name}</span>
                <span className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  {groupings.map((g) => {
                    const c = categoryOf(portfolio, h, g.id)
                    return (
                      <span key={g.id} className="inline-flex items-center gap-1.5">
                        <Dot color={c.color} className="size-2" />
                        {c.name}
                      </span>
                    )
                  })}
                </span>
              </span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </button>
          </li>
        ))}
      </ul>
      <Button variant="outline" className="mt-3 h-10 w-full" onClick={() => setEditing('new')}>
        <Plus /> Add holding
      </Button>

      <HoldingSheet holding={editing} onClose={() => setEditing(null)} />
    </div>
  )
}

function HoldingSheet({ holding, onClose }: { holding: Holding | 'new' | null; onClose(): void }) {
  const { portfolio, actions } = usePortfolio()
  const isNew = holding === 'new'
  const existing = holding && holding !== 'new' ? holding : undefined
  const [name, setName] = useState('')
  const [categoryIds, setCategoryIds] = useState<Record<Id, Id>>({})
  const [loadedFor, setLoadedFor] = useState<Holding | 'new' | null>(null)

  // Reset the form whenever a different holding is opened.
  if (holding !== loadedFor) {
    setLoadedFor(holding)
    setName(existing?.name ?? '')
    setCategoryIds(existing?.categoryIds ?? {})
  }

  const groupings = [...portfolio.groupings].sort((a, b) => a.sortOrder - b.sortOrder)

  const save = async () => {
    const trimmed = name.trim()
    if (!trimmed) return
    if (existing) await actions.saveHolding({ ...existing, name: trimmed, categoryIds })
    else await actions.addHolding(trimmed, categoryIds)
    onClose()
  }

  return (
    <Sheet open={holding !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>{isNew ? 'Add holding' : 'Edit holding'}</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 px-4">
          <div className="space-y-1.5">
            <Label htmlFor="holding-name">Name</Label>
            <Input id="holding-name" className="h-10 text-base" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          {groupings.map((g) => (
            <div key={g.id} className="space-y-1.5">
              <Label>{g.name}</Label>
              <Select
                value={categoryIds[g.id] ?? ''}
                onValueChange={(v) => setCategoryIds((ids) => ({ ...ids, [g.id]: v }))}
              >
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Uncategorised" />
                </SelectTrigger>
                <SelectContent>
                  {portfolio.categories
                    .filter((c) => c.groupingId === g.id)
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        <Dot color={c.color} /> {c.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          ))}
          {isNew && (
            <p className="text-xs text-muted-foreground">Enter its value next time you add a snapshot.</p>
          )}
        </div>
        <SheetFooter className="pb-safe flex-row">
          <Button variant="outline" className="h-10 flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button className="h-10 flex-1" disabled={!name.trim()} onClick={save}>
            Save
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function CategoriesSettings() {
  const { portfolio, actions } = usePortfolio()
  const groupings = [...portfolio.groupings].sort((a, b) => a.sortOrder - b.sortOrder)
  const [groupingId, setGroupingId] = useState<Id | undefined>(groupings[0]?.id)
  const grouping = groupings.find((g) => g.id === groupingId) ?? groupings[0]
  const [newCategory, setNewCategory] = useState('')

  if (!grouping) return null
  const categories = portfolio.categories.filter((c) => c.groupingId === grouping.id)

  return (
    <div className="space-y-4 px-4">
      <div className="flex gap-2">
        <Segmented
          value={grouping.id}
          onChange={setGroupingId}
          options={groupings.map((g) => ({ value: g.id, label: g.name }))}
          className="min-w-0 flex-1 overflow-x-auto"
        />
        <Button
          variant="outline"
          size="icon-lg"
          aria-label="Add grouping"
          onClick={async () => setGroupingId((await actions.addGrouping('New grouping')).id)}
        >
          <Plus />
        </Button>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="grouping-name">Grouping name</Label>
        <div className="flex gap-2">
          <Input
            id="grouping-name"
            key={grouping.id}
            className="h-10 text-base"
            defaultValue={grouping.name}
            onBlur={(e) => {
              const name = e.target.value.trim()
              if (name && name !== grouping.name) void actions.saveGrouping({ ...grouping, name })
            }}
          />
          {groupings.length > 1 && (
            <ConfirmDelete
              title={`Delete “${grouping.name}”?`}
              description="Its categories are deleted too. Holdings and snapshots are kept."
              onConfirm={() => {
                void actions.deleteGrouping(grouping.id)
                setGroupingId(undefined)
              }}
            />
          )}
        </div>
      </div>

      <ul className="divide-y overflow-hidden rounded-xl border bg-background">
        {categories.map((c) => (
          <CategoryRow key={c.id} category={c} holdingCount={portfolio.holdings.filter((h) => h.categoryIds[grouping.id] === c.id).length} />
        ))}
      </ul>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          const name = newCategory.trim()
          if (!name) return
          void actions.addCategory(grouping.id, name)
          setNewCategory('')
        }}
      >
        <Input
          placeholder="New category"
          className="h-10 text-base"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
        />
        <Button type="submit" variant="outline" className="h-10" disabled={!newCategory.trim()}>
          Add
        </Button>
      </form>
    </div>
  )
}

function CategoryRow({ category, holdingCount }: { category: Category; holdingCount: number }) {
  const { actions } = usePortfolio()
  return (
    <li className="flex items-center gap-3 px-3 py-2">
      <label className="relative size-7 shrink-0 cursor-pointer overflow-hidden rounded-full border" style={{ background: category.color }}>
        <input
          type="color"
          aria-label={`${category.name} colour`}
          className="absolute inset-0 opacity-0"
          defaultValue={category.color}
          onChange={(e) => actions.saveCategory({ ...category, color: e.target.value })}
        />
      </label>
      <Input
        className="h-9 flex-1 border-transparent bg-transparent px-1 text-base shadow-none focus-visible:border-input"
        defaultValue={category.name}
        onBlur={(e) => {
          const name = e.target.value.trim()
          if (name && name !== category.name) void actions.saveCategory({ ...category, name })
        }}
      />
      <span className="text-xs text-muted-foreground tabular-nums">{holdingCount}</span>
      <ConfirmDelete
        title={`Delete “${category.name}”?`}
        description={
          holdingCount > 0 ? `${holdingCount} holding${holdingCount > 1 ? 's' : ''} will become Uncategorised.` : 'No holdings use it.'
        }
        onConfirm={() => void actions.deleteCategory(category.id)}
      />
    </li>
  )
}

function ConfirmDelete({ title, description, onConfirm }: { title: string; description: string; onConfirm(): void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon-lg" aria-label="Delete" className="text-muted-foreground">
          <Trash2 />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function AccountSettings({ session }: { session: ReturnType<typeof useSession> }) {
  return (
    <div className="space-y-3 px-4">
      <div className="rounded-xl border bg-background px-4 py-3 text-sm">
        <p className="text-muted-foreground">Data is stored in</p>
        <p className="font-medium">{backendKind === 'supabase' ? `Supabase · ${session.email ?? ''}` : 'This browser only'}</p>
      </div>
      {session.canSignOut ? (
        <Button variant="outline" className="h-10 w-full" onClick={() => session.signOut()}>
          Sign out
        </Button>
      ) : (
        <ConfirmReset />
      )}
    </div>
  )
}

function ConfirmReset() {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="h-10 w-full">
          Reset to imported data
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Reset local data?</AlertDialogTitle>
          <AlertDialogDescription>Everything you've changed in this browser is replaced with the imported sheet data.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => {
              LocalRepository.reset()
              window.location.reload()
            }}
          >
            Reset
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
