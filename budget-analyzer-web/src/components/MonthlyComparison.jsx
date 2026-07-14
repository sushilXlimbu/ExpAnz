import { useEffect, useMemo, useState } from 'react'
import MonthlyTrendChart from './MonthlyTrendChart'
import { formatCurrency } from '../utils/format'
import {
  DEFAULT_VISIBLE_CATEGORIES,
  buildComparisonRows,
  buildTrendPoints,
  computeHeadlineMovers,
  formatMonthLabel,
  getCategorySpendTotals,
  getSortedMonths,
  isPartialMonth,
} from '../utils/monthly'

function moverText(mover) {
  const isIncrease = mover.changeAbs > 0
  const direction = isIncrease ? 'up' : 'down'
  const magnitude =
    mover.changePct === null
      ? formatCurrency(Math.abs(mover.changeAbs))
      : `${Math.abs(mover.changePct).toFixed(0)}%`
  return `${mover.category} ${direction} ${magnitude} vs last month`
}

function MonthlyComparison({ rows, colorMap, startDate, endDate, loading, error }) {
  const months = useMemo(() => getSortedMonths(rows), [rows])

  const monthMeta = useMemo(
    () =>
      months.map((month) => ({
        month,
        label: formatMonthLabel(month),
        isPartial: isPartialMonth(month, startDate, endDate),
      })),
    [months, startDate, endDate],
  )

  const categoryTotals = useMemo(() => getCategorySpendTotals(rows), [rows])

  const [visibleCategories, setVisibleCategories] = useState(() => new Set())

  // Re-derive the default top-N selection whenever a new range is fetched —
  // manual toggles from a previous range shouldn't linger over new data.
  useEffect(() => {
    setVisibleCategories(
      new Set(getCategorySpendTotals(rows).slice(0, DEFAULT_VISIBLE_CATEGORIES).map((c) => c.category)),
    )
  }, [rows])

  function handleToggleCategory(category) {
    setVisibleCategories((prev) => {
      const next = new Set(prev)
      if (next.has(category)) next.delete(category)
      else next.add(category)
      return next
    })
  }

  const hasOther = categoryTotals.some((c) => !visibleCategories.has(c.category))

  const trendPoints = useMemo(
    () => buildTrendPoints(rows, months, visibleCategories),
    [rows, months, visibleCategories],
  )

  const comparisonRows = useMemo(() => buildComparisonRows(rows, months), [rows, months])

  const movers = useMemo(() => computeHeadlineMovers(comparisonRows), [comparisonRows])

  const hasPartialMonth = monthMeta.some((m) => m.isPartial)

  if (loading && rows.length === 0) {
    return <p className="status-message">Loading monthly comparison…</p>
  }
  if (error) {
    return <p className="status-message error">Couldn't load monthly comparison: {error}</p>
  }
  if (months.length === 0) {
    return <p className="empty-state">No spending data in this range.</p>
  }

  return (
    <div className="monthly-comparison">
      {movers.length > 0 && (
        <ul className="mover-callouts">
          {movers.map((mover) => (
            <li
              key={mover.category}
              className={'mover-chip ' + (mover.changeAbs > 0 ? 'is-up' : 'is-down')}
            >
              {moverText(mover)}
            </li>
          ))}
        </ul>
      )}

      <MonthlyTrendChart
        monthMeta={monthMeta}
        points={trendPoints}
        categoryTotals={categoryTotals}
        visibleCategories={visibleCategories}
        colorMap={colorMap}
        hasOther={hasOther}
        onToggleCategory={handleToggleCategory}
      />

      {hasPartialMonth && (
        <p className="partial-footnote">
          * Partial month — the bank statement doesn't cover the full calendar month, so this
          figure will look artificially low.
        </p>
      )}
    </div>
  )
}

export default MonthlyComparison
