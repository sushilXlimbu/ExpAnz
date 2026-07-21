import { formatCurrency } from '../utils/format'

function SummaryCards({ totalSpending, totalIncome, net, excludeInternal, categoryView }) {
  if (categoryView) {
    const { name, totalOut, totalIn, net: categoryNet } = categoryView
    return (
      <div className="summary-cards">
        <div className="stat-tile">
          <span className="stat-label">{name} — spent</span>
          <span className="stat-value">{formatCurrency(totalOut)}</span>
        </div>
        <div className="stat-tile">
          <span className="stat-label">{name} — back</span>
          <span className="stat-value">{formatCurrency(totalIn)}</span>
        </div>
        <div className="stat-tile">
          <span className="stat-label">{name} — net</span>
          <span
            className="stat-value"
            style={{ color: categoryNet > 0 ? 'var(--status-critical)' : 'var(--status-good)' }}
          >
            {formatCurrency(categoryNet)}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="summary-cards">
      <div className="stat-tile">
        <span className="stat-label">
          Total spending{excludeInternal ? ' (excl. transfers)' : ''}
        </span>
        <span className="stat-value">{formatCurrency(totalSpending)}</span>
      </div>
      <div className="stat-tile">
        <span className="stat-label">Total income</span>
        <span className="stat-value">{formatCurrency(totalIncome)}</span>
      </div>
      <div className="stat-tile">
        <span className="stat-label">Net</span>
        <span
          className="stat-value"
          style={{ color: net >= 0 ? 'var(--status-good)' : 'var(--status-critical)' }}
        >
          {formatCurrency(net)}
        </span>
      </div>
    </div>
  )
}

export default SummaryCards
