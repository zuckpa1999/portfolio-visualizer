// Category palette: muted, distinguishable on light and dark backgrounds.
export const CATEGORY_PALETTE = [
  '#4E79A7', '#F28E2B', '#59A14F', '#E15759', '#76B7B2', '#EDC948', '#B07AA1', '#FF9DA7',
  '#9C755F', '#86BCB6', '#D37295', '#8CD17D', '#499894', '#F1CE63', '#A0CBE8', '#79706E',
]

/** First palette colour not already used, cycling when all are taken. */
export function nextCategoryColor(used: string[]): string {
  return CATEGORY_PALETTE.find((c) => !used.includes(c)) ?? CATEGORY_PALETTE[used.length % CATEGORY_PALETTE.length]
}
