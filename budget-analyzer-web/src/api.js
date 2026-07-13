import { API_BASE_URL } from './config'

async function request(path, options) {
  const response = await fetch(`${API_BASE_URL}${path}`, options)

  let body = null
  try {
    body = await response.json()
  } catch {
    // no JSON body (e.g. plain-text error, or empty response)
  }

  if (!response.ok) {
    const message =
      body?.detail || body?.message || body?.error || body?.title ||
      `Request to ${path} failed (${response.status} ${response.statusText})`
    const error = new Error(message)
    error.status = response.status
    throw error
  }

  return body
}

function withJsonBody(data) {
  return {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }
}

export function fetchTransactions() {
  return request('/api/transactions')
}

export function fetchSummary(startDate, endDate) {
  const params = new URLSearchParams({ startDate, endDate })
  return request(`/api/summary?${params.toString()}`)
}

export function fetchCategories() {
  return request('/api/categories')
}

export function createCategory({ name, color }) {
  return request('/api/categories', { method: 'POST', ...withJsonBody({ name, color }) })
}

export function deleteCategory(id) {
  return request(`/api/categories/${id}`, { method: 'DELETE' })
}

export function updateTransactionCategory(id, category) {
  return request(`/api/transactions/${id}/category`, {
    method: 'PUT',
    ...withJsonBody({ category }),
  })
}

export function uploadStatement(file) {
  const formData = new FormData()
  formData.append('file', file)
  return request('/api/upload', { method: 'POST', body: formData })
}
