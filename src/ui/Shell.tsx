import { useState } from 'react'
import { ChartPie, History, PencilLine, X } from 'lucide-react'
import { usePortfolio } from '@/core/state/PortfolioProvider'
import type { useSession } from '@/core/state/useSession'
import { cn } from '@/lib/utils'
import { HistoryScreen } from './HistoryScreen'
import { Splash } from './splash/Splash'
import { chosenSplashId } from './splash/splashData'
import { OverviewScreen } from './OverviewScreen'
import { SettingsScreen } from './SettingsScreen'
import { UpdateScreen } from './UpdateScreen'

type Tab = 'overview' | 'update' | 'history'

const TABS: { id: Tab; label: string; icon: typeof ChartPie }[] = [
  { id: 'overview', label: 'Overview', icon: ChartPie },
  { id: 'update', label: 'Update', icon: PencilLine },
  { id: 'history', label: 'History', icon: History },
]

export function Shell({ session }: { session: ReturnType<typeof useSession> }) {
  const { status } = usePortfolio()
  const [splashDone, setSplashDone] = useState(false)
  const [splashId] = useState(chosenSplashId)

  return (
    <>
      {/* Same tree position while loading and after, so the splash isn't remounted (and restarted). */}
      {!splashDone && <Splash variantId={splashId} onDone={() => setSplashDone(true)} />}
      {status !== 'loading' && <Screens session={session} />}
    </>
  )
}

function Screens({ session }: { session: ReturnType<typeof useSession> }) {
  const { error, dismissError } = usePortfolio()
  const [tab, setTab] = useState<Tab>('overview')
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <div className="pt-safe mx-auto min-h-dvh max-w-md pb-24 md:max-w-3xl">
      {error && (
        <div className="mx-4 mt-4 flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <span>{error}</span>
          <button onClick={dismissError} aria-label="Dismiss">
            <X className="size-4" />
          </button>
        </div>
      )}

      {settingsOpen ? (
        <SettingsScreen session={session} onClose={() => setSettingsOpen(false)} />
      ) : (
        <>
          {tab === 'overview' && <OverviewScreen onOpenSettings={() => setSettingsOpen(true)} />}
          {tab === 'update' && <UpdateScreen onSaved={() => setTab('overview')} />}
          {tab === 'history' && <HistoryScreen />}
        </>
      )}

      {!settingsOpen && (
        <nav className="pb-safe fixed inset-x-0 bottom-0 border-t bg-background/90 backdrop-blur">
          <div className="mx-auto flex max-w-md md:max-w-3xl">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={cn(
                  'flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors',
                  tab === id ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                <Icon className="size-5" strokeWidth={tab === id ? 2.25 : 1.75} />
                {label}
              </button>
            ))}
          </div>
        </nav>
      )}
    </div>
  )
}
