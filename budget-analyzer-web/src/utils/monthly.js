// Shared calculations for the month-over-month comparison view. Kept separate
// from the components so the chart, table, and headline callouts all derive
// their numbers from the exact same logic (no risk of the table and the
// callouts disagreeing about what "last month" means).

export const DEFAULT_VISIBLE_CATEGORIES = 6

export function formatMonthLabel(month) {
  const [y, m] = month.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
}

// A month is partial when the query range doesn't cover it start-to-end —
// only possible for the first/last month of the range, since bank statements
// give us a single contiguous span of transactions.
export function isPartialMonth(month, startDate, endDate) {
  const [y, m] = month.split('-').map(Number)
  const daysInMonth = new Date(y, m, 0).getDate()
  const monthStart = `${month}-01`
  const monthEnd = `${month}-${String(daysInMonth).padStart(2, '0')}`
  if (month === startDate.slice(0, 7) && startDate > monthStart) return true
  if (month === endDate.slice(0, 7) && endDate < monthEnd) return true
  return false
}

export function getSortedMonths(rows) {
  return [...new Set(rows.map((r) => r.month))].sort()
}

// Total spend per category across the whole range, descending — drives both
// the table's row order and the trend chart's default top-N selection.
export function getCategorySpendTotals(rows) {
  const totals = new Map()
  for (const r of rows) {
    const spend = Math.abs(r.totalOut)
    totals.set(r.category, (totals.get(r.category) ?? 0) + spend)
  }
  return [...totals.entries()]
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total)
}

// One point per month for the line chart. Categories not in `visibleCategories`
// are folded into a single "Other" series so the chart never exceeds the
// legible line count, no matter how many categories exist in the range.
// Every visible category is zero-filled for months with no spend — a real
// £0 data point, not a gap — so the line dips to zero instead of skipping.
export function buildTrendPoints(rows, months, visibleCategories) {
  return months.map((month) => {
    const point = { month, Other: 0 }
    for (const category of visibleCategories) point[category] = 0

    for (const r of rows.filter((r) => r.month === month)) {
      const spend = Math.abs(r.totalOut)
      if (visibleCategories.has(r.category)) {
        point[r.category] += spend
      } else {
        point.Other += spend
      }
    }
    return point
  })
}

// One row per category, one value per month, plus the change vs. the
// previous month in the range (both £ and %). `changePct` is null when the
// previous month had no spend in that category (division by zero) — callers
// should render that as "new spending" rather than a percentage.
export function buildComparisonRows(rows, months) {
  const byCategory = new Map()
  for (const r of rows) {
    if (!byCategory.has(r.category)) byCategory.set(r.category, new Map())
    byCategory.get(r.category).set(r.month, Math.abs(r.totalOut))
  }

  return getCategorySpendTotals(rows).map(({ category, total }) => {
    const values = months.map((m) => byCategory.get(category)?.get(m) ?? 0)
    let changeAbs = null
    let changePct = null
    if (months.length >= 2) {
      const last = values[values.length - 1]
      const prev = values[values.length - 2]
      changeAbs = last - prev
      changePct = prev === 0 ? null : (changeAbs / prev) * 100
    }
    return { category, total, values, changeAbs, changePct }
  })
}

// The automatic "biggest movers" headlines: the largest £ swings, plus the
// largest % swing if it isn't already covered and is striking enough to call
// out on its own (e.g. a small category that doubled).
export function computeHeadlineMovers(comparisonRows, { maxMovers = 3, minPct = 25 } = {}) {
  const withChange = comparisonRows.filter((r) => r.changeAbs !== null && r.changeAbs !== 0)

  const byAbs = [...withChange].sort((a, b) => Math.abs(b.changeAbs) - Math.abs(a.changeAbs))
  const movers = byAbs.slice(0, maxMovers)

  const byPct = withChange
    .filter((r) => r.changePct !== null)
    .sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))
  const topPct = byPct[0]
  if (topPct && Math.abs(topPct.changePct) >= minPct && !movers.some((r) => r.category === topPct.category)) {
    movers.push(topPct)
  }

  return movers
}
