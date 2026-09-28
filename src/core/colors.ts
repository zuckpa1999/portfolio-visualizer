// Category palette: muted, distinguishable on light and dark backgrounds.
export const CATEGORY_PALETTE = [
  '#4E79A7', '#F28E2B', '#59A14F', '#E15759', '#B07AA1', '#EDC948', '#76B7B2', '#FF9DA7',
  '#9C755F', '#2F4B7C', '#8CD17D', '#D37295', '#A0CBE8', '#6B5B95', '#79706E', '#BAB0AC',
]

/** First palette colour not already used, cycling when all are taken. */
export function nextCategoryColor(used: string[]): string {
  return CATEGORY_PALETTE.find((c) => !used.includes(c)) ?? CATEGORY_PALETTE[used.length % CATEGORY_PALETTE.length]
}
