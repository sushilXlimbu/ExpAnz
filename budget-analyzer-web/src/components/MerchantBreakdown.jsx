import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCurrency } from '../utils/format'

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const { merchant, value } = payload[0].payload
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-value">{formatCurrency(value)}</div>
      <div className="chart-tooltip-label">{merchant}</div>
    </div>
  )
}

function MerchantBreakdown({ category, data, color, selectedMerchant, onSelectMerchant }) {
  if (data.length === 0) {
    return <p className="empty-state">No merchant data for {category} in this range.</p>
  }

  const chartHeight = Math.max(120, data.length * 36 + 40)

  return (
    <div className="merchant-breakdown">
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 48, bottom: 4, left: 8 }}>
          <CartesianGrid horizontal={false} stroke="var(--gridline)" />
          <XAxis
            type="number"
            tickFormatter={(v) => formatCurrency(v)}
            stroke="var(--text-muted)"
            tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: 'var(--baseline)' }}
          />
          <YAxis
            type="category"
            dataKey="merchant"
            width={140}
            stroke="var(--text-muted)"
            tick={{ fill: 'var(--text-secondary)', fontSize: 13 }}
            tickLine={false}
            axisLine={{ stroke: 'var(--baseline)' }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--gridline)', opacity: 0.4 }} />
          <Bar
            dataKey="value"
            radius={[0, 4, 4, 0]}
            barSize={20}
            onClick={(entry) => {
              const merchant = entry.merchant ?? entry.payload?.merchant
              onSelectMerchant(selectedMerchant === merchant ? null : merchant)
            }}
            cursor="pointer"
          >
            {data.map((entry) => (
              <Cell
                key={entry.merchant}
                fill={color}
                opacity={
                  selectedMerchant && selectedMerchant !== entry.merchant ? 0.4 : 1
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default MerchantBreakdown
