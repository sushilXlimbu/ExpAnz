import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCurrency } from '../utils/format'
import { getCategoryColor } from '../utils/categories'

const OTHER_COLOR = 'var(--series-other)'

function CustomTooltip({ active, payload, label, monthMeta }) {
  if (!active || !payload?.length) return null
  const meta = monthMeta.find((m) => m.month === label)
  const rows = [...payload]
    .filter((row) => row.value > 0)
    .sort((a, b) => b.value - a.value)

  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">
        {meta?.label ?? label}
        {meta?.isPartial && <span className="partial-flag"> *</span>}
      </div>
      <ul className="chart-tooltip-rows">
        {rows.map((row) => (
          <li key={row.dataKey}>
            <span className="chart-tooltip-key" style={{ background: row.color }} />
            <span className="chart-tooltip-series">{row.name}</span>
            <span className="chart-tooltip-amount">{formatCurrency(row.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function MonthlyTrendChart({ monthMeta, points, categoryTotals, visibleCategories, colorMap, hasOther, onToggleCategory }) {
  if (points.length === 0) {
    return <p className="empty-state">No spending in this range.</p>
  }

  const tickLabel = (month) => {
    const meta = monthMeta.find((m) => m.month === month)
    return meta?.isPartial ? `${meta.label}*` : meta?.label ?? month
  }

  return (
    <div className="monthly-trend">
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={points} margin={{ top: 8, right: 16, bottom: 4, left: 4 }}>
          <CartesianGrid stroke="var(--gridline)" vertical={false} />
          <XAxis
            dataKey="month"
            tickFormatter={tickLabel}
            stroke="var(--text-muted)"
            tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: 'var(--baseline)' }}
          />
          <YAxis
            tickFormatter={(v) => formatCurrency(v)}
            stroke="var(--text-muted)"
            tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: 'var(--baseline)' }}
            width={72}
          />
          <Tooltip content={<CustomTooltip monthMeta={monthMeta} />} cursor={{ stroke: 'var(--baseline)' }} />
          {[...visibleCategories].map((category) => (
            <Line
              key={category}
              dataKey={category}
              name={category}
              stroke={getCategoryColor(colorMap, category)}
              strokeWidth={2}
              dot={{ r: 4, fill: getCategoryColor(colorMap, category), strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          ))}
          {hasOther && (
            <Line
              key="Other"
              dataKey="Other"
              name="Other"
              stroke={OTHER_COLOR}
              strokeWidth={2}
              strokeDasharray="4 3"
              dot={{ r: 4, fill: OTHER_COLOR, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>

      <ul className="trend-legend" aria-label="Toggle categories shown on the trend chart">
        {categoryTotals.map(({ category }) => {
          const isVisible = visibleCategories.has(category)
          return (
            <li key={category}>
              <button
                type="button"
                className={'trend-legend-chip' + (isVisible ? ' is-visible' : '')}
                aria-pressed={isVisible}
                onClick={() => onToggleCategory(category)}
              >
                <span
                  className="legend-swatch"
                  style={{ background: getCategoryColor(colorMap, category) }}
                />
                {category}
              </button>
            </li>
          )
        })}
        {hasOther && (
          <li>
            <span className="trend-legend-chip is-other">
              <span className="legend-swatch" style={{ background: OTHER_COLOR }} />
              Other (folded categories)
            </span>
          </li>
        )}
      </ul>
    </div>
  )
}

export default MonthlyTrendChart
