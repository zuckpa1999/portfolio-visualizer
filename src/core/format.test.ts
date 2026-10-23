import { describe, expect, it } from 'vitest'
import { formatChange, formatCompactTHB, formatTHB, parseAmount, trendOf } from './format'

describe('parseAmount', () => {
  it('reads amounts typed with thousands separators, a baht sign or spaces', () => {
    expect(parseAmount('245,000')).toBe(245000)
    expect(parseAmount('฿1,234.5')).toBe(1234.5)
    expect(parseAmount(' 12 000 ')).toBe(12000)
  })

  it('treats empty, non-numeric and negative input as no amount', () => {
    expect(parseAmount('')).toBeNull()
    expect(parseAmount('   ')).toBeNull()
    expect(parseAmount('abc')).toBeNull()
    expect(parseAmount('12abc')).toBeNull()
    expect(parseAmount('-500')).toBeNull()
  })

  it('accepts zero, which closes a holding', () => {
    expect(parseAmount('0')).toBe(0)
  })
})

describe('formatChange', () => {
  it('shows a rise with a plus sign and its percentage', () => {
    expect(formatChange({ amount: 18798, percent: 0.00928 })).toBe('+฿18,798 (+0.9%)')
  })

  it('shows a fall with a minus sign', () => {
    expect(formatChange({ amount: -51179, percent: -0.1169 })).toBe('−฿51,179 (−11.7%)')
  })

  it('leaves out the percentage when there was nothing to compare with', () => {
    expect(formatChange({ amount: 60000, percent: null })).toBe('+฿60,000')
  })

  it('says No change for zero and a dash when there is no earlier snapshot', () => {
    expect(formatChange({ amount: 0, percent: 0 })).toBe('No change')
    expect(formatChange(null)).toBe('—')
  })
})

describe('formatTHB', () => {
  it('rounds to whole baht', () => {
    expect(formatTHB(2044725.6)).toBe('฿2,044,726')
  })
})

describe('formatCompactTHB', () => {
  it('shows thousands from ฿10,000 up, so close axis ticks stay distinct', () => {
    expect(formatCompactTHB(2044726)).toBe('฿2,045k')
    expect(formatCompactTHB(10000)).toBe('฿10k')
  })

  it('shows smaller values in full', () => {
    expect(formatCompactTHB(9999)).toBe('฿9,999')
  })
})

describe('trendOf', () => {
  it('reads a change as up, down or flat, and none without a comparison', () => {
    expect(trendOf({ amount: 1, percent: 0.01 })).toBe('up')
    expect(trendOf({ amount: -1, percent: -0.01 })).toBe('down')
    expect(trendOf({ amount: 0, percent: 0 })).toBe('flat')
    expect(trendOf(null)).toBe('none')
  })
})
