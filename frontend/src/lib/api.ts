const API_URL = import.meta.env.VITE_API_URL || ''

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('njangi_token')
  const headers = new Headers(options.headers)
  if (!headers.has('Content-Type') && options.body) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const response = await fetch(`${API_URL}${path}`, { ...options, headers })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const detail = data.detail
    const message = Array.isArray(detail)
      ? detail.map((item: { msg?: string; loc?: (string | number)[] }) =>
        `${item.loc?.slice(1).join('.') || 'Request'}: ${item.msg || 'Invalid value'}`).join('; ')
      : typeof detail === 'string' ? detail : 'Request failed'
    throw new Error(message)
  }
  return data as T
}

export function money(value: number, currency = 'XAF') {
  return new Intl.NumberFormat('en-CM', {
    style: 'currency', currency,
    maximumFractionDigits: 0,
  }).format(value)
}
