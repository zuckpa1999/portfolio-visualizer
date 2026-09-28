import type { Portfolio } from '../../domain/types'
import example from './example'

// my-portfolio.ts holds real balances and is git-ignored; fall back to the fictional example.
const privateSeed = import.meta.glob<{ default: Portfolio }>('./my-portfolio.ts', { eager: true })

export const seedPortfolio: Portfolio = Object.values(privateSeed)[0]?.default ?? example
export const usingPrivateSeed = Object.keys(privateSeed).length > 0
