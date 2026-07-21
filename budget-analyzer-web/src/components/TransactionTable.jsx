import { useEffect, useState } from 'react'
import { formatCurrency, formatDate } from '../utils/format'

const PAGE_SIZE = 20

function TransactionTable({
  transactions,
  categories,
  activeCategory,
  activeMerchant,
  onClearCategory,
  onClearMerchant,
  onMoveCategory,
}) {
  const [rowState, setRowState] = useState({})
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  // Jump back to the top page whenever the drill-down scope changes — editing
  // a row's category in place shouldn't reset the reader's place in the list.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [activeCategory, activeMerchant])

  const visibleTransactions = transactions.slice(0, visibleCount)
  const hasMore = visibleCount < transactions.length

  async function handleCategoryChange(t, newCategory) {
    if (newCategory === t.category) return
    setRowState((prev) => ({ ...prev, [t.id]: 'saving' }))
    try {
      await onMoveCategory(t.id, newCategory)
      setRowState((prev) => {
        const next = { ...prev }
        delete next[t.id]
        return next
      })
    } catch (err) {
      setRowState((prev) => ({ ...prev, [t.id]: err.message || 'Failed to update' }))
    }
  }

  return (
    <div className="transaction-table-wrap">
      <div className="transaction-table-header">
        <h2>Transactions ({transactions.length})</h2>
        <div className="active-filters">
          {activeCategory && (
            <button type="button" className="filter-chip" onClick={onClearCategory}>
              {activeCategory} ✕
            </button>
          )}
          {activeMerchant && (
            <button type="button" className="filter-chip" onClick={onClearMerchant}>
              {activeMerchant} ✕
            </button>
          )}
        </div>
      </div>

      {transactions.length === 0 ? (
        <p className="empty-state">No transactions match the current filters.</p>
      ) : (
        <div className="table-scroll">
          <table className="transaction-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Merchant</th>
                <th>Category</th>
                <th className="amount-col">Amount</th>
              </tr>
            </thead>
            <tbody>
              {visibleTransactions.map((t) => {
                const state = rowState[t.id]
                const isSaving = state === 'saving'
                const rowError = state && state !== 'saving' ? state : null
                const hasCurrentOption = categories.some((c) => c.name === t.category)
                return (
                  <tr key={t.id}>
                    <td>{formatDate(t.date)}</td>
                    <td>{t.description}</td>
                    <td>{t.merchant}</td>
                    <td className="category-col">
                      <select
                        className="category-select"
                        value={t.category}
                        disabled={isSaving}
                        onChange={(e) => handleCategoryChange(t, e.target.value)}
                      >
                        {!hasCurrentOption && <option value={t.category}>{t.category}</option>}
                        {categories.map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      {rowError && (
                        <span className="row-error" title={rowError}>
                          ⚠
                        </span>
                      )}
                    </td>
                    <td
                      className="amount-col"
                      style={{ color: t.amount < 0 ? 'var(--status-critical)' : 'var(--status-good)' }}
                    >
                      {formatCurrency(t.amount)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {hasMore && (
        <div className="table-load-more">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
          >
            Show 20 more ({transactions.length - visibleCount} remaining)
          </button>
        </div>
      )}
    </div>
  )
}

export default TransactionTable
