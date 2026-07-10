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
