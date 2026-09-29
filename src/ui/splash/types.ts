import type { ReactNode } from 'react'
import type { Change } from '@/core/domain/portfolio'

export interface SplashData {
  total: number
  change: Change | null
  /** Allocation of the current grouping, largest first; shares sum to 1. */
  slices: { id: string; color: string; share: number }[]
  /** Portfolio value per snapshot, oldest first. */
  history: number[]
}

export interface SplashVariant {
  id: string
  name: string
  description: string
  /** How long the animation plays before the splash fades out (ms). */
  duration: number
  Component(props: { data: SplashData }): ReactNode
}
