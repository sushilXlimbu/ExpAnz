import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { formatCurrency, formatFlowSummary } from '../utils/format'

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const { name, value, percent, totalOut, totalIn } = payload[0].payload
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-value">{formatCurrency(value)}</div>
      <div className="chart-tooltip-label">
        {name} · {(percent * 100).toFixed(1)}%
      </div>
      {totalIn > 0 && (
        <div className="chart-tooltip-flow">{formatFlowSummary(totalOut, totalIn)}</div>
      )}
    </div>
  )
}

function CategoryChart({ data, selectedCategory, onSelectCategory }) {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  const withPercent = data.map((d) => ({ ...d, percent: total ? d.value / total : 0 }))

  if (data.length === 0) {
    return <p className="empty-state">No spending in this range.</p>
  }

  return (
    <div className="category-chart">
      <div className="category-chart-plot">
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={withPercent}
              dataKey="value"
              nameKey="name"
              innerRadius={70}
              outerRadius={110}
              paddingAngle={2}
              stroke="var(--surface-1)"
              strokeWidth={2}
              onClick={(entry) => {
                const name = entry.name ?? entry.payload?.name
                onSelectCategory(selectedCategory === name ? null : name)
              }}
              cursor="pointer"
            >
              {withPercent.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={entry.color}
                  opacity={
                    selectedCategory && selectedCategory !== entry.name ? 0.45 : 1
                  }
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <ul className="category-legend" aria-label="Spending by category">
        {withPercent.map((entry) => (
          <li key={entry.name}>
            <button
              type="button"
              className={
                'category-legend-row' +
                (selectedCategory === entry.name ? ' is-selected' : '')
              }
              title={entry.totalIn > 0 ? formatFlowSummary(entry.totalOut, entry.totalIn) : undefined}
              onClick={() =>
                onSelectCategory(selectedCategory === entry.name ? null : entry.name)
              }
            >
              <span className="legend-swatch" style={{ background: entry.color }} />
              <span className="legend-name">
                {entry.name}
                {entry.totalIn > 0 && <span className="legend-flow-indicator">↩</span>}
              </span>
              <span className="legend-percent">{(entry.percent * 100).toFixed(1)}%</span>
              <span className="legend-value">{formatCurrency(entry.value)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default CategoryChart
