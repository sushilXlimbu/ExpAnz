import { useEffect, useMemo, useState } from 'react'
import { fetchCategories, fetchMonthlySummary, fetchTransactions, updateTransactionCategory } from './api'
import FilterBar from './components/FilterBar'
import SummaryCards from './components/SummaryCards'
import CategoryChart from './components/CategoryChart'
import MonthlyComparison from './components/MonthlyComparison'
import MerchantBreakdown from './components/MerchantBreakdown'
import TransactionTable from './components/TransactionTable'
import UploadZone from './components/UploadZone'
import CategoryManagerModal from './components/CategoryManagerModal'
import {
  INTERNAL_CATEGORIES,
  UNCATEGORIZED_LABEL,
  buildCategoryChartData,
  buildCategoryColorMap,
  getCategoryColor,
} from './utils/categories'
import { formatFlowSummary, toDateInputValue } from './utils/format'
import './App.css'

// Accumulates gross out/in per key without netting them against each other —
// a refund or win must never cancel out real spend in the same bucket.
function addFlow(groups, key, amount) {
  const entry = groups.get(key) ?? { totalOut: 0, totalIn: 0 }
  if (amount < 0) entry.totalOut += -amount
  else entry.totalIn += amount
  groups.set(key, entry)
}

function App() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [categories, setCategories] = useState([])

  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [excludeInternal, setExcludeInternal] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedMerchant, setSelectedMerchant] = useState(null)
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false)

  const [monthlyRows, setMonthlyRows] = useState([])
  const [monthlyLoading, setMonthlyLoading] = useState(false)
  const [monthlyError, setMonthlyError] = useState(null)

  // `initial` controls whether this shows the full-page loading/error state
  // (first load) or refreshes quietly behind the current view (post-upload,
  // post-move, post-category-change).
  async function loadTransactions({ initial = false } = {}) {
    if (initial) setLoading(true)
    try {
      const data = await fetchTransactions()
      const wasShowingAll = initial || (startDate === bounds.minDate && endDate === bounds.maxDate)
      setTransactions(data)
      if (initial) setError(null)
      if (wasShowingAll && data.length > 0) {
        const dates = data.map((t) => toDateInputValue(t.date))
        setStartDate(dates.reduce((min, d) => (d < min ? d : min)))
        setEndDate(dates.reduce((max, d) => (d > max ? d : max)))
      }
    } catch (err) {
      if (initial) setError(err.message)
      else console.error('Failed to refresh transactions:', err)
    } finally {
      if (initial) setLoading(false)
    }
  }

  async function loadCategories() {
    try {
      const data = await fetchCategories()
      setCategories(data)
    } catch (err) {
      console.error('Failed to load categories:', err)
    }
  }

  useEffect(() => {
    loadTransactions({ initial: true })
    loadCategories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Drives the month-over-month comparison view off the same date range as
  // the rest of the dashboard, so its numbers always agree with what's shown
  // elsewhere.
  useEffect(() => {
    if (!startDate || !endDate) return
    let cancelled = false
    setMonthlyLoading(true)
    fetchMonthlySummary(startDate, endDate)
      .then((data) => {
        if (cancelled) return
        setMonthlyRows(data)
        setMonthlyError(null)
      })
      .catch((err) => {
        if (cancelled) return
        setMonthlyError(err.message)
      })
      .finally(() => {
        if (!cancelled) setMonthlyLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [startDate, endDate])

  const colorMap = useMemo(() => buildCategoryColorMap(categories), [categories])

  const bounds = useMemo(() => {
    if (transactions.length === 0) return { minDate: '', maxDate: '' }
    const dates = transactions.map((t) => toDateInputValue(t.date))
    return {
      minDate: dates.reduce((min, d) => (d < min ? d : min)),
      maxDate: dates.reduce((max, d) => (d > max ? d : max)),
    }
  }, [transactions])

  const filteredByDate = useMemo(() => {
    if (!startDate || !endDate) return transactions
    return transactions.filter((t) => {
      const d = toDateInputValue(t.date)
      return d >= startDate && d <= endDate
    })
  }, [transactions, startDate, endDate])

  // Only the Income category counts as income — a win in Betting or a refund
  // in Shopping is money back in that category, not income.
  const totalIncome = useMemo(
    () =>
      filteredByDate
        .filter((t) => t.category === 'Income' && t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0),
    [filteredByDate],
  )
  const totalSpendingAll = useMemo(
    () => filteredByDate.filter((t) => t.amount < 0).reduce((sum, t) => sum - t.amount, 0),
    [filteredByDate],
  )
  const totalSpendingTrue = useMemo(
    () =>
      filteredByDate
        .filter((t) => t.amount < 0 && !INTERNAL_CATEGORIES.includes(t.category))
        .reduce((sum, t) => sum - t.amount, 0),
    [filteredByDate],
  )
  const totalSpending = excludeInternal ? totalSpendingTrue : totalSpendingAll
  // Real income minus real spending — matches the two figures shown above it.
  const net = totalIncome - totalSpending

  const uncategorizedCount = useMemo(
    () => filteredByDate.filter((t) => t.category === UNCATEGORIZED_LABEL).length,
    [filteredByDate],
  )

  // Same Income/internal-transfer exclusions as rawCategoryTotals below, so
  // the monthly comparison view agrees with the doughnut chart and summary
  // cards instead of showing a contradictory picture of "spending".
  const monthlyComparisonRows = useMemo(
    () =>
      monthlyRows.filter(
        (r) => r.category !== 'Income' && !(excludeInternal && INTERNAL_CATEGORIES.includes(r.category)),
      ),
    [monthlyRows, excludeInternal],
  )

  // Gross outflow per category drives the chart's slice size — the same
  // definition SummaryCards uses for "Total spending" (only amount < 0
  // counts). Netting refunds/wins against spend here would make a category
  // with a net gain (e.g. a betting category with more wins than losses)
  // vanish from the chart despite real spend in it, and would make the pie's
  // total silently disagree with the summary card. totalIn is tracked
  // alongside (not subtracted) so it can be surfaced without hiding it.
  const rawCategoryTotals = useMemo(() => {
    const groups = new Map()
    for (const t of filteredByDate) {
      if (t.category === 'Income') continue
      if (excludeInternal && INTERNAL_CATEGORIES.includes(t.category)) continue
      addFlow(groups, t.category, t.amount)
    }
    return [...groups.entries()]
      .map(([name, { totalOut, totalIn }]) => ({
        name,
        value: totalOut,
        totalOut,
        totalIn,
        net: totalOut - totalIn,
      }))
      .filter((c) => c.value > 0)
  }, [filteredByDate, excludeInternal])

  // Every category with spend gets its own slice — no folding into "Other".
  const categoryTotals = useMemo(
    () => [...rawCategoryTotals].sort((a, b) => b.value - a.value),
    [rawCategoryTotals],
  )

  const chartData = useMemo(
    () => buildCategoryChartData(categoryTotals, colorMap),
    [categoryTotals, colorMap],
  )

  // Clear the selection if it's no longer a sensible thing to be looking at
  // (category deleted/renamed, toggled out by the internal-transfer filter,
  // or no longer present in the current date range).
  useEffect(() => {
    if (!selectedCategory) return
    const stillValid =
      selectedCategory !== 'Income' &&
      !(excludeInternal && INTERNAL_CATEGORIES.includes(selectedCategory)) &&
      filteredByDate.some((t) => t.category === selectedCategory)
    if (!stillValid) {
      setSelectedCategory(null)
      setSelectedMerchant(null)
    }
  }, [filteredByDate, excludeInternal, selectedCategory])

  const categoryFiltered = useMemo(() => {
    if (!selectedCategory) return filteredByDate
    return filteredByDate.filter((t) => t.category === selectedCategory)
  }, [filteredByDate, selectedCategory])

  // Independent of categoryTotals' Income/internal-transfer exclusions and
  // its value > 0 filter — this always reflects exactly what's in
  // categoryFiltered, so the summary cards and drill-down subtitle can't
  // silently go blank for an edge-case category (e.g. one that's all refund).
  const selectedCategorySummary = useMemo(() => {
    if (!selectedCategory) return null
    let totalOut = 0
    let totalIn = 0
    for (const t of categoryFiltered) {
      if (t.amount < 0) totalOut += -t.amount
      else totalIn += t.amount
    }
    return { name: selectedCategory, totalOut, totalIn, net: totalOut - totalIn }
  }, [categoryFiltered, selectedCategory])

  // Same gross-outflow definition as rawCategoryTotals above, so a merchant
  // with a net gain in this category (a win, a refund larger than the spend)
  // doesn't silently disappear from its own breakdown.
  const merchantTotals = useMemo(() => {
    if (!selectedCategory) return []
    const groups = new Map()
    for (const t of categoryFiltered) {
      addFlow(groups, t.merchant, t.amount)
    }
    return [...groups.entries()]
      .map(([merchant, { totalOut, totalIn }]) => ({
        merchant,
        value: totalOut,
        totalOut,
        totalIn,
        net: totalOut - totalIn,
      }))
      .filter((m) => m.value > 0)
      .sort((a, b) => b.value - a.value)
  }, [categoryFiltered, selectedCategory])

  const tableTransactions = useMemo(() => {
    if (!selectedMerchant) return categoryFiltered
    return categoryFiltered.filter((t) => t.merchant === selectedMerchant)
  }, [categoryFiltered, selectedMerchant])

  function handleSelectCategory(name) {
    setSelectedCategory(name)
    setSelectedMerchant(null)
  }

  function handleReset() {
    setStartDate(bounds.minDate)
    setEndDate(bounds.maxDate)
  }

  async function handleMoveCategory(transactionId, newCategory) {
    await updateTransactionCategory(transactionId, newCategory)
    // Same reasoning as the category add/delete handlers: apply the change
    // to local state immediately rather than waiting on (and depending on
    // the success of) a full refetch.
    setTransactions((prev) =>
      prev.map((t) => (t.id === transactionId ? { ...t, category: newCategory } : t)),
    )
    loadTransactions().catch((err) => console.error('Failed to reconcile after move:', err))
  }

  async function handleCategoriesChanged() {
    await loadCategories()
    await loadTransactions()
  }

  // Applied immediately from the mutation's own result — the dashboard must
  // not depend on a second network round-trip (the refetch below) succeeding
  // to reflect a change the server already confirmed.
  function handleCategoryAdded(category) {
    setCategories((prev) => {
      if (prev.some((c) => c.id === category.id)) return prev
      return [...prev, category].sort((a, b) => a.name.localeCompare(b.name))
    })
  }

  function handleCategoryDeleted(id) {
    const deleted = categories.find((c) => c.id === id)
    setCategories((prev) => prev.filter((c) => c.id !== id))
    if (deleted) {
      setTransactions((prev) =>
        prev.map((t) =>
          t.category === deleted.name ? { ...t, category: UNCATEGORIZED_LABEL } : t,
        ),
      )
    }
  }

  if (loading) return <p className="status-message">Loading transactions…</p>
  if (error) {
    return (
      <p className="status-message error">
        Couldn't reach the API at the configured URL: {error}. If this is a
        certificate error, open the API URL directly in your browser and accept the
        self-signed certificate, then reload this page.
      </p>
    )
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Budget Analyzer</h1>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setIsCategoryManagerOpen(true)}
        >
          Manage categories
        </button>
      </div>

      <UploadZone onUploadSuccess={() => loadTransactions()} />

      <FilterBar
        minDate={bounds.minDate}
        maxDate={bounds.maxDate}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onReset={handleReset}
        excludeInternal={excludeInternal}
        onExcludeInternalChange={setExcludeInternal}
        uncategorizedCount={uncategorizedCount}
        onReviewUncategorized={() => handleSelectCategory(UNCATEGORIZED_LABEL)}
      />

      <SummaryCards
        totalSpending={totalSpending}
        totalIncome={totalIncome}
        net={net}
        excludeInternal={excludeInternal}
        categoryView={selectedCategorySummary}
      />

      <section className="panel">
        <h2>Spending by category</h2>
        <CategoryChart
          data={chartData}
          selectedCategory={selectedCategory}
          onSelectCategory={handleSelectCategory}
        />
      </section>

      <section className="panel">
        <h2>Month-over-month comparison</h2>
        <MonthlyComparison
          rows={monthlyComparisonRows}
          colorMap={colorMap}
          startDate={startDate}
          endDate={endDate}
          loading={monthlyLoading}
          error={monthlyError}
        />
      </section>

      {selectedCategory && (
        <section className="panel">
          <h2>{selectedCategory} by merchant</h2>
          {selectedCategorySummary?.totalIn > 0 && (
            <p className="category-flow-summary">
              {formatFlowSummary(selectedCategorySummary.totalOut, selectedCategorySummary.totalIn)}
            </p>
          )}
          <MerchantBreakdown
            category={selectedCategory}
            data={merchantTotals}
            color={getCategoryColor(colorMap, selectedCategory)}
            selectedMerchant={selectedMerchant}
            onSelectMerchant={setSelectedMerchant}
          />
        </section>
      )}

      <section className="panel">
        <TransactionTable
          transactions={tableTransactions}
          categories={categories}
          activeCategory={selectedCategory}
          activeMerchant={selectedMerchant}
          onClearCategory={() => {
            setSelectedCategory(null)
            setSelectedMerchant(null)
          }}
          onClearMerchant={() => setSelectedMerchant(null)}
          onMoveCategory={handleMoveCategory}
        />
      </section>

      {isCategoryManagerOpen && (
        <CategoryManagerModal
          categories={categories}
          onClose={() => setIsCategoryManagerOpen(false)}
          onCategoryAdded={handleCategoryAdded}
          onCategoryDeleted={handleCategoryDeleted}
          onCategoriesChanged={handleCategoriesChanged}
        />
      )}
    </div>
  )
}

export default App
