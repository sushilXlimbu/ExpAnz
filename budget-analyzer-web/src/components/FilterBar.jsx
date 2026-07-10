function FilterBar({
  minDate,
  maxDate,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onReset,
  excludeInternal,
  onExcludeInternalChange,
}) {
  return (
    <div className="filter-bar">
      <div className="filter-group">
        <label htmlFor="start-date">From</label>
        <input
          id="start-date"
          type="date"
          value={startDate}
          min={minDate}
          max={endDate}
          onChange={(e) => onStartDateChange(e.target.value)}
        />
      </div>
      <div className="filter-group">
        <label htmlFor="end-date">To</label>
        <input
          id="end-date"
          type="date"
          value={endDate}
          min={startDate}
          max={maxDate}
          onChange={(e) => onEndDateChange(e.target.value)}
        />
      </div>
      <button type="button" className="filter-reset" onClick={onReset}>
        Show all data
      </button>
      <label className="filter-toggle">
        <input
          type="checkbox"
          checked={excludeInternal}
          onChange={(e) => onExcludeInternalChange(e.target.checked)}
        />
        Exclude internal transfers (Wallet Transfer, Investment, Crypto, Gift Card)
      </label>
    </div>
  )
}

export default FilterBar
