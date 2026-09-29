import { useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Splash } from './Splash'
import { SPLASH_VARIANTS } from './registry'

/** Dev-only page (`?splash-gallery`) to compare splash variants side by side. */
export function SplashGallery() {
  const [runs, setRuns] = useState<Record<string, number>>({})
  const replay = (id: string) => setRuns((r) => ({ ...r, [id]: (r[id] ?? 0) + 1 }))
  const replayAll = () => setRuns((r) => Object.fromEntries(SPLASH_VARIANTS.map((v) => [v.id, (r[v.id] ?? 0) + 1])))

  return (
    <main className="mx-auto max-w-6xl p-4 pb-16 md:p-8">
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Splash screens</h1>
          <p className="text-sm text-muted-foreground">Tap a frame (or Replay) to watch it again. “Open” plays it in the real app.</p>
        </div>
        <Button variant="outline" onClick={replayAll}>
          <RotateCcw /> Replay all
        </Button>
      </header>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {SPLASH_VARIANTS.map((v, i) => (
          <section key={v.id} className="space-y-3">
            <div
              className="relative aspect-[390/600] cursor-pointer overflow-hidden rounded-2xl border bg-background"
              onClick={() => replay(v.id)}
            >
              <Frame key={runs[v.id] ?? 0} id={v.id} />
            </div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-medium">
                  {i + 1}. {v.name}
                </h2>
                <p className="text-xs text-muted-foreground">{v.description}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button variant="ghost" size="sm" onClick={() => replay(v.id)}>
                  Replay
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <a href={`/?splash=${v.id}`}>Open</a>
                </Button>
              </div>
            </div>
          </section>
        ))}
      </div>
    </main>
  )
}

/** Plays the splash, then leaves an empty frame (the app would appear here). */
function Frame({ id }: { id: string }) {
  const [done, setDone] = useState(false)
  if (done) {
    return <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Tap to replay</div>
  }
  return <Splash variantId={id} contained onDone={() => setDone(true)} />
}
