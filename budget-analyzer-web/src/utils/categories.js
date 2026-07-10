// Categories that represent money moving to the user's own accounts rather
// than true spending.
export const INTERNAL_CATEGORIES = ['Wallet Transfer', 'Investment', 'Crypto', 'Gift Card']

export const OTHER_LABEL = 'Other'

// Fixed, data-independent color-slot order (never derived from rank/value —
// see dataviz "color follows the entity, never its rank"). A category not
// listed here always folds into the OTHER_LABEL bucket instead of a 9th hue.
export const CATEGORY_COLOR_ORDER = [
  'Groceries',
  'Eating Out',
  'Transport',
  'Shopping',
  'Credit Card',
  'Wallet Transfer',
  'Investment',
  'Person-to-Person',
]

export function categoryColorVar(category) {
  const index = CATEGORY_COLOR_ORDER.indexOf(category)
  if (index === -1) return 'var(--series-other)'
  return `var(--series-${index + 1})`
}

// Collapses a transaction's category into either its own identity (if it has
// a dedicated color slot) or the shared "Other" bucket.
export function categoryGroup(category) {
  return CATEGORY_COLOR_ORDER.includes(category) ? category : OTHER_LABEL
}

export function buildCategoryChartData(categoryTotals) {
  return categoryTotals.map(({ name, value }) => ({
    name,
    value,
    color: categoryColorVar(name),
  }))
}
