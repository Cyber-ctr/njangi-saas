const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('njangi_token')
  const headers = new Headers(options.headers)
  if (!headers.has('Content-Type') && options.body) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const response = await fetch(`${API_URL}${path}`, { ...options, headers })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.detail || 'Request failed')
  return data as T
}

export function money(value: number, currency = 'XAF') {
  return new Intl.NumberFormat('en-CM', {
    style: 'currency', currency,
    maximumFractionDigits: 0,
  }).format(value)
}
