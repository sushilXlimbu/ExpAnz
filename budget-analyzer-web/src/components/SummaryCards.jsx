import { formatCurrency } from '../utils/format'

function SummaryCards({ totalSpending, totalIncome, net, excludeInternal }) {
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
