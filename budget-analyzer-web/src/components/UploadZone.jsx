import { useRef, useState } from 'react'
import { uploadStatement } from '../api'
import { formatCurrency } from '../utils/format'

const STATUS = { IDLE: 'idle', UPLOADING: 'uploading', SUCCESS: 'success', ERROR: 'error' }

function isPdf(file) {
  return !!file && (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'))
}

function UploadZone({ onUploadSuccess }) {
  const inputRef = useRef(null)
  const [status, setStatus] = useState(STATUS.IDLE)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)

  async function handleFile(file) {
    if (!file) return
    if (!isPdf(file)) {
      setStatus(STATUS.ERROR)
      setError('Only PDF files are supported.')
      return
    }
    setStatus(STATUS.UPLOADING)
    setError('')
    try {
      const data = await uploadStatement(file)
      setResult(data)
      setStatus(STATUS.SUCCESS)
      onUploadSuccess?.()
    } catch (err) {
      setError(err.message)
      setStatus(STATUS.ERROR)
    }
  }

  function handleDrop(e) {
    e.preventDefault()
    setIsDragOver(false)
    if (status === STATUS.UPLOADING) return
    handleFile(e.dataTransfer.files?.[0])
  }

  function handleInputChange(e) {
    handleFile(e.target.files?.[0])
    e.target.value = ''
  }

  function openPicker() {
    if (status !== STATUS.UPLOADING) inputRef.current?.click()
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      openPicker()
    }
  }

  return (
    <div className="upload-zone-wrap">
      <div
        className={
          'upload-zone' +
          (isDragOver ? ' is-drag-over' : '') +
          (status === STATUS.UPLOADING ? ' is-uploading' : '')
        }
        role="button"
        tabIndex={0}
        aria-busy={status === STATUS.UPLOADING}
        onClick={openPicker}
        onKeyDown={handleKeyDown}
        onDragOver={(e) => {
          e.preventDefault()
          if (status !== STATUS.UPLOADING) setIsDragOver(true)
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          hidden
          onChange={handleInputChange}
        />
        {status === STATUS.UPLOADING ? (
          <>
            <span className="upload-spinner" aria-hidden="true" />
            <p className="upload-title">Parsing statement…</p>
            <p className="upload-hint">This can take a few seconds.</p>
          </>
        ) : (
          <>
            <p className="upload-title">Drop a bank statement PDF here, or click to choose a file</p>
            <p className="upload-hint">PDF only</p>
          </>
        )}
      </div>

      {status === STATUS.SUCCESS && result && (
        <div className="upload-result upload-result-success" role="status">
          <p className="upload-result-headline">
            Added {result.inserted} new transaction{result.inserted === 1 ? '' : 's'}
            {result.skippedDuplicates > 0
              ? ` (${result.skippedDuplicates} duplicate${result.skippedDuplicates === 1 ? '' : 's'} skipped)`
              : ''}
          </p>
          <p className="upload-result-detail">
            Parsed {result.parsed} transaction{result.parsed === 1 ? '' : 's'} from {result.fileName}
            {' · '}Out {formatCurrency(result.totalOut)} · In {formatCurrency(result.totalIn)}
          </p>
        </div>
      )}

      {status === STATUS.ERROR && (
        <div className="upload-result upload-result-error" role="alert">
          <p className="upload-result-headline">Upload failed</p>
          <p className="upload-result-detail">{error}</p>
        </div>
      )}
    </div>
  )
}

export default UploadZone
