const currencyFormatter = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
})

export function formatCurrency(amount) {
  return currencyFormatter.format(amount)
}

export function formatDate(isoDate) {
  return new Date(isoDate).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function toDateInputValue(isoDate) {
  return isoDate.slice(0, 10)
}

// e.g. "£642.50 out · £310.00 back · £332.50 net" (or "… net gain" if
// money back exceeds money out). totalOut/totalIn are both positive
// magnitudes here — not the API's signed convention.
export function formatFlowSummary(totalOut, totalIn) {
  const net = totalOut - totalIn
  const netText = net >= 0 ? `${formatCurrency(net)} net` : `${formatCurrency(Math.abs(net))} net gain`
  return `${formatCurrency(totalOut)} out · ${formatCurrency(totalIn)} back · ${netText}`
}
