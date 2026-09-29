import type { SplashVariant } from './types'
import { Aperture, Bar, Count, Odometer, Ring, Trace, Wordmark } from './variants'

export const SPLASH_VARIANTS: SplashVariant[] = [
  { id: 'ring', name: 'Ring', description: 'One pen stroke draws your allocation donut while the total counts up.', duration: 2300, Component: Ring },
  { id: 'count', name: 'Count', description: 'The total counts up from zero; the change since last time settles in.', duration: 2300, Component: Count },
  { id: 'odometer', name: 'Odometer', description: 'Each digit rolls into place like a mechanical counter.', duration: 2400, Component: Odometer },
  { id: 'bar', name: 'Allocation bar', description: 'A hairline bar fills with each category colour, then the total appears.', duration: 2300, Component: Bar },
  { id: 'trace', name: 'Trace', description: 'Your history draws itself as a line and lands on today.', duration: 2500, Component: Trace },
  { id: 'wordmark', name: 'Wordmark', description: 'The app mark turns into place and the name resolves from a blur. No numbers.', duration: 2000, Component: Wordmark },
  { id: 'aperture', name: 'Aperture', description: 'Donut segments swing open from the centre like a camera shutter.', duration: 2300, Component: Aperture },
]

export const DEFAULT_SPLASH = 'ring'
