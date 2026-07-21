// Categories that represent money moving to the user's own accounts rather
// than true spending. A client-side convention, independent of the
// user-managed category list from the API.
export const INTERNAL_CATEGORIES = ['Wallet Transfer', 'Investment', 'Crypto', 'Gift Card']

export const UNCATEGORIZED_LABEL = 'Uncategorized'
const FALLBACK_COLOR = 'var(--series-other)'

export function buildCategoryColorMap(categories) {
  return new Map(categories.map((c) => [c.name, c.color]))
}

export function getCategoryColor(colorMap, name) {
  return colorMap.get(name) ?? FALLBACK_COLOR
}

// Preserves whatever fields the caller attached to each total (totalOut,
// totalIn, net, …) — this just adds the resolved color.
export function buildCategoryChartData(categoryTotals, colorMap) {
  return categoryTotals.map((c) => ({
    ...c,
    color: getCategoryColor(colorMap, c.name),
  }))
}
