import { formatCurrency, formatDate } from '../utils/format'

function TransactionTable({ transactions, activeCategory, activeMerchant, onClearCategory, onClearMerchant }) {
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
              {transactions.map((t) => (
                <tr key={t.id}>
                  <td>{formatDate(t.date)}</td>
                  <td>{t.description}</td>
                  <td>{t.merchant}</td>
                  <td>{t.category}</td>
                  <td
                    className="amount-col"
                    style={{ color: t.amount < 0 ? 'var(--status-critical)' : 'var(--status-good)' }}
                  >
                    {formatCurrency(t.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default TransactionTable
