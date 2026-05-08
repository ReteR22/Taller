const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

function headers() {
  const token = localStorage.getItem('mechpro-token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function handle(res: Response) {
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || data.message || 'Error desconocido')
  return data
}

// ── Part Requests ─────────────────────────────────────────────
export async function getPartRequests(params?: {
  page?: number
  limit?: number
  status?: string
  search?: string
}) {
  const q = new URLSearchParams()
  if (params?.page)   q.set('page',   String(params.page))
  if (params?.limit)  q.set('limit',  String(params.limit))
  if (params?.status) q.set('status', params.status)
  if (params?.search) q.set('search', params.search)
  return handle(await fetch(`${BASE}/forum/requests?${q}`, { headers: headers() }))
}

export async function getPartRequest(id: string) {
  return handle(await fetch(`${BASE}/forum/requests/${id}`, { headers: headers() }))
}

export async function createPartRequest(data: {
  title: string
  description: string
  partCode?: string
  brand?: string
  quantity?: number
  vehicleId?: string
}) {
  return handle(await fetch(`${BASE}/forum/requests`, {
    method:  'POST',
    headers: headers(),
    body:    JSON.stringify(data),
  }))
}

export async function closePartRequest(id: string) {
  return handle(await fetch(`${BASE}/forum/requests/${id}/close`, {
    method:  'PATCH',
    headers: headers(),
  }))
}

// ── Quotes ────────────────────────────────────────────────────
export async function createQuote(
  requestId: string,
  data: {
    price: number
    currency?: string
    deliveryDays?: number
    notes?: string
    availability?: boolean
  }
) {
  return handle(await fetch(`${BASE}/forum/requests/${requestId}/quotes`, {
    method:  'POST',
    headers: headers(),
    body:    JSON.stringify(data),
  }))
}

export async function updateQuote(
  quoteId: string,
  data: { price?: number; deliveryDays?: number; notes?: string; availability?: boolean }
) {
  return handle(await fetch(`${BASE}/forum/quotes/${quoteId}`, {
    method:  'PATCH',
    headers: headers(),
    body:    JSON.stringify(data),
  }))
}

export async function deleteQuote(quoteId: string) {
  return handle(await fetch(`${BASE}/forum/quotes/${quoteId}`, {
    method:  'DELETE',
    headers: headers(),
  }))
}

// ── Notifications ─────────────────────────────────────────────
export async function getNotifications() {
  return handle(await fetch(`${BASE}/forum/notifications`, { headers: headers() }))
}

export async function markAllRead() {
  return handle(await fetch(`${BASE}/forum/notifications/read-all`, {
    method:  'PATCH',
    headers: headers(),
  }))
}

export async function markOneRead(id: string) {
  return handle(await fetch(`${BASE}/forum/notifications/${id}/read`, {
    method:  'PATCH',
    headers: headers(),
  }))
}
