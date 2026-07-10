import { useEffect, useMemo, useState } from 'react'
import { fetchTransactions } from './api'
import FilterBar from './components/FilterBar'
import SummaryCards from './components/SummaryCards'
import CategoryChart from './components/CategoryChart'
import MerchantBreakdown from './components/MerchantBreakdown'
import TransactionTable from './components/TransactionTable'
import UploadZone from './components/UploadZone'
import {
  INTERNAL_CATEGORIES,
  OTHER_LABEL,
  buildCategoryChartData,
  categoryColorVar,
  categoryGroup,
} from './utils/categories'
import { toDateInputValue } from './utils/format'
import './App.css'

function inCategorySelection(t, selectedCategory, excludeInternal) {
  if (selectedCategory === OTHER_LABEL) {
    if (categoryGroup(t.category) !== OTHER_LABEL) return false
    return !(excludeInternal && INTERNAL_CATEGORIES.includes(t.category))
  }
  return t.category === selectedCategory
}

function App() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [excludeInternal, setExcludeInternal] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedMerchant, setSelectedMerchant] = useState(null)

  // `initial` controls whether this shows the full-page loading/error state
  // (first load) or refreshes quietly behind the current view (post-upload).
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
      else console.error('Failed to refresh transactions after upload:', err)
    } finally {
      if (initial) setLoading(false)
    }
  }

  useEffect(() => {
    loadTransactions({ initial: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  const totalIncome = useMemo(
    () => filteredByDate.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0),
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
  const net = totalIncome - totalSpendingAll

  const categoryTotals = useMemo(() => {
    const groups = new Map()
    for (const t of filteredByDate) {
      if (t.category === 'Income') continue
      if (excludeInternal && INTERNAL_CATEGORIES.includes(t.category)) continue
      const group = categoryGroup(t.category)
      groups.set(group, (groups.get(group) ?? 0) - t.amount)
    }
    const totals = [...groups.entries()]
      .map(([name, value]) => ({ name, value }))
      .filter((c) => c.value > 0)
    totals.sort((a, b) => {
      if (a.name === OTHER_LABEL) return 1
      if (b.name === OTHER_LABEL) return -1
      return b.value - a.value
    })
    return totals
  }, [filteredByDate, excludeInternal])

  const chartData = useMemo(() => buildCategoryChartData(categoryTotals), [categoryTotals])

  // Clear selection if it no longer appears in the current chart data.
  useEffect(() => {
    if (selectedCategory && !categoryTotals.some((c) => c.name === selectedCategory)) {
      setSelectedCategory(null)
      setSelectedMerchant(null)
    }
  }, [categoryTotals, selectedCategory])

  const categoryFiltered = useMemo(() => {
    if (!selectedCategory) return filteredByDate
    return filteredByDate.filter((t) => inCategorySelection(t, selectedCategory, excludeInternal))
  }, [filteredByDate, selectedCategory, excludeInternal])

  const merchantTotals = useMemo(() => {
    if (!selectedCategory) return []
    const groups = new Map()
    for (const t of categoryFiltered) {
      groups.set(t.merchant, (groups.get(t.merchant) ?? 0) - t.amount)
    }
    return [...groups.entries()]
      .map(([merchant, value]) => ({ merchant, value }))
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
      <h1>Budget Analyzer</h1>

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
      />

      <SummaryCards
        totalSpending={totalSpending}
        totalIncome={totalIncome}
        net={net}
        excludeInternal={excludeInternal}
      />

      <section className="panel">
        <h2>Spending by category</h2>
        <CategoryChart
          data={chartData}
          selectedCategory={selectedCategory}
          onSelectCategory={handleSelectCategory}
        />
      </section>

      {selectedCategory && (
        <section className="panel">
          <h2>{selectedCategory} by merchant</h2>
          <MerchantBreakdown
            category={selectedCategory}
            data={merchantTotals}
            color={categoryColorVar(selectedCategory)}
            selectedMerchant={selectedMerchant}
            onSelectMerchant={setSelectedMerchant}
          />
        </section>
      )}

      <section className="panel">
        <TransactionTable
          transactions={tableTransactions}
          activeCategory={selectedCategory}
          activeMerchant={selectedMerchant}
          onClearCategory={() => {
            setSelectedCategory(null)
            setSelectedMerchant(null)
          }}
          onClearMerchant={() => setSelectedMerchant(null)}
        />
      </section>
    </div>
  )
}

export default App
