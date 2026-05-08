// ============================================================
// MechPro — Custom Hooks
// ============================================================

import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/services/api'
import type { Client, Vehicle, WorkOrder, PaginatedResponse, DashboardSummary, RevenuePoint } from '@/types'

// ─────────────────────────────────────────────
// useClients
// ─────────────────────────────────────────────
export function useClients(initialPage = 1, initialLimit = 20) {
  const [data,    setData]    = useState<Client[]>([])
  const [total,   setTotal]   = useState(0)
  const [page,    setPage]    = useState(initialPage)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)
  const [search,  setSearch]  = useState('')

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiClient.get<PaginatedResponse<Client>>('/clients', {
        params: { page, limit: initialLimit, ...(search && { q: search }) },
      })
      setData(res.data.data)
      setTotal(res.data.total)
    } catch {
      setError('Error al cargar clientes')
    } finally {
      setLoading(false)
    }
  }, [page, initialLimit, search])

  useEffect(() => { fetch() }, [fetch])

  const create = async (payload: Partial<Client>) => {
    const res = await apiClient.post<Client>('/clients', payload)
    fetch()
    return res.data
  }

  const update = async (id: string, payload: Partial<Client>) => {
    const res = await apiClient.put<Client>(`/clients/${id}`, payload)
    fetch()
    return res.data
  }

  const remove = async (id: string) => {
    await apiClient.delete(`/clients/${id}`)
    fetch()
  }

  return { data, total, page, setPage, loading, error, search, setSearch, refetch: fetch, create, update, remove }
}

// ─────────────────────────────────────────────
// useWorkOrders
// ─────────────────────────────────────────────
interface WorkOrderFilters {
  status?:     string
  mechanicId?: string
  vehicleId?:  string
  from?:       string
  to?:         string
}

export function useWorkOrders(filters: WorkOrderFilters = {}, page = 1, limit = 20) {
  const [data,    setData]    = useState<WorkOrder[]>([])
  const [total,   setTotal]   = useState(0)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiClient.get<PaginatedResponse<WorkOrder>>('/work-orders', {
        params: { page, limit, ...filters },
      })
      setData(res.data.data)
      setTotal(res.data.total)
    } catch {
      setError('Error al cargar órdenes')
    } finally {
      setLoading(false)
    }
  }, [page, limit, JSON.stringify(filters)])

  useEffect(() => { fetch() }, [fetch])

  const create = async (payload: any) => {
    const res = await apiClient.post<WorkOrder>('/work-orders', payload)
    fetch()
    return res.data
  }

  const changeStatus = async (id: string, status: string) => {
    const res = await apiClient.patch<WorkOrder>(`/work-orders/${id}/status`, { status })
    fetch()
    return res.data
  }

  const getPDF = (id: string) => {
    window.open(`/api/work-orders/${id}/pdf`, '_blank')
  }

  return { data, total, loading, error, refetch: fetch, create, changeStatus, getPDF }
}

// ─────────────────────────────────────────────
// useVehicles
// ─────────────────────────────────────────────
export function useVehicles(clientId?: string) {
  const [data,    setData]    = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiClient.get<PaginatedResponse<Vehicle>>('/vehicles', {
        params: { ...(clientId && { clientId }), limit: 100 },
      })
      setData(res.data.data)
    } catch {
      setData([])
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => { fetch() }, [fetch])

  const create = async (payload: any) => {
    const res = await apiClient.post<Vehicle>('/vehicles', payload)
    fetch()
    return res.data
  }

  return { data, loading, refetch: fetch, create }
}

// ─────────────────────────────────────────────
// useDashboard
// ─────────────────────────────────────────────
export function useDashboard() {
  const [summary,  setSummary]  = useState<DashboardSummary | null>(null)
  const [revenue,  setRevenue]  = useState<RevenuePoint[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    Promise.all([
      apiClient.get<DashboardSummary>('/reports/summary'),
      apiClient.get<RevenuePoint[]>('/reports/revenue'),
    ])
      .then(([s, r]) => {
        setSummary(s.data)
        setRevenue(r.data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return { summary, revenue, loading }
}

// ─────────────────────────────────────────────
// useDebounce
// ─────────────────────────────────────────────
export function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

// ─────────────────────────────────────────────
// useLocalStorage
// ─────────────────────────────────────────────
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : initialValue
    } catch {
      return initialValue
    }
  })

  const set = (val: T) => {
    setValue(val)
    localStorage.setItem(key, JSON.stringify(val))
  }

  return [value, set] as const
}
