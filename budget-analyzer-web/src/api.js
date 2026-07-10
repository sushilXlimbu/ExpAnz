import { API_BASE_URL } from './config'

async function getJson(path) {
  const response = await fetch(`${API_BASE_URL}${path}`)
  if (!response.ok) {
    throw new Error(`Request to ${path} failed: ${response.status} ${response.statusText}`)
  }
  return response.json()
}

export function fetchTransactions() {
  return getJson('/api/transactions')
}

export function fetchSummary(startDate, endDate) {
  const params = new URLSearchParams({ startDate, endDate })
  return getJson(`/api/summary?${params.toString()}`)
}

export async function uploadStatement(file) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${API_BASE_URL}/api/upload`, {
    method: 'POST',
    body: formData,
  })

  let body = null
  try {
    body = await response.json()
  } catch {
    // no JSON body (e.g. plain-text error, or empty response)
  }

  if (!response.ok) {
    const message =
      body?.detail || body?.message || body?.error || body?.title ||
      `Upload failed (${response.status} ${response.statusText})`
    throw new Error(message)
  }

  return body
}
