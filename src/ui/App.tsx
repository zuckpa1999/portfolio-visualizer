import '../index.css'
import { PortfolioProvider } from '@/core/state/PortfolioProvider'
import { useSession } from '@/core/state/useSession'
import { Button } from '@/components/ui/button'
import { Shell } from './Shell'

export function App() {
  const session = useSession()

  if (session.status === 'checking') return null
  if (session.status === 'signed-out') {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6 text-center">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">Portfolio</h1>
          <p className="text-sm text-muted-foreground">Sign in to see your portfolio.</p>
        </div>
        <Button size="lg" onClick={() => session.signIn()}>
          Continue with Google
        </Button>
      </main>
    )
  }

  return (
    <PortfolioProvider>
      <Shell session={session} />
    </PortfolioProvider>
  )
}
