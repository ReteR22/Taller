// ============================================================
// MechPro — Tipos compartidos del frontend
// ============================================================

export type Role        = 'ADMIN' | 'MECHANIC'
export type FuelType    = 'GASOLINE' | 'DIESEL' | 'ELECTRIC' | 'HYBRID' | 'GNC'
export type WorkOrderStatus = 'PENDING' | 'IN_PROGRESS' | 'WAITING_PARTS' | 'COMPLETED' | 'DELIVERED' | 'CANCELLED'

// ── Auth ──────────────────────────────────────────────────
export interface User {
  id:      string
  name:    string
  email:   string
  role:    Role
  avatar?: string
}

// ── Pagination ────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data:       T[]
  total:      number
  page:       number
  limit:      number
  totalPages: number
}

// ── Client ────────────────────────────────────────────────
export interface Client {
  id:        string
  firstName: string
  lastName:  string
  email?:    string
  phone:     string
  address?:  string
  dni?:      string
  notes?:    string
  isActive:  boolean
  createdAt: string
  vehicles?: VehicleSummary[]
}

// ── Vehicle ───────────────────────────────────────────────
export interface VehicleSummary {
  id:    string
  brand: string
  model: string
  year:  number
  plate: string
}

export interface Vehicle extends VehicleSummary {
  clientId:   string
  vin?:       string
  color?:     string
  engineType?: string
  fuelType:   FuelType
  mileage?:   number
  notes?:     string
  createdAt:  string
  client?:    Client
  workOrders?: WorkOrderSummary[]
}

// ── Work Order ────────────────────────────────────────────
export interface WorkOrderSummary {
  id:        string
  number:    string
  status:    WorkOrderStatus
  total:     number
  entryDate: string
}

export interface WorkOrderPart {
  id:          string
  name:        string
  quantity:    number
  unitPrice:   number
  subtotal:    number
  partId?:     string
}

export interface WorkOrder extends WorkOrderSummary {
  vehicleId:    string
  mechanicId:   string
  description:  string
  diagnosis?:   string
  observations?: string
  laborCost:    number
  discount:     number
  tax:          number
  isPaid:       boolean
  deliveryDate?: string
  createdAt:    string
  vehicle?:     Vehicle & { client: Client }
  mechanic?:    Pick<User, 'id' | 'name'>
  parts:        WorkOrderPart[]
}

// ── Part (repuesto del catálogo) ──────────────────────────
export interface Part {
  id:       string
  name:     string
  code?:    string
  brand?:   string
  unit:     string
  price:    number
  stock:    number
  minStock: number
  category?: string
}

// ── Reports ───────────────────────────────────────────────
export interface MonthlySummary {
  period:        string
  totalRevenue:  number
  totalLabor:    number
  totalDiscount: number
  totalOrders:   number
  avgOrderValue: number
  byStatus:      { status: string; _count: { id: number }; _sum: { total: number } }[]
  topMechanics:  { mechanicId: string; mechanicName: string; orders: number; labor: number }[]
}

export interface RevenuePoint {
  month:   string
  revenue: number
  labor:   number
  count:   number
}

export interface DashboardSummary {
  thisMonth:     { revenue: number; labor: number; orders: number }
  lastMonth:     { revenue: number; orders: number }
  revenueChange: number
  totalClients:  number
  pendingOrders: number
}

// ── Status config ─────────────────────────────────────────
export const STATUS_CONFIG: Record<WorkOrderStatus, { label: string; tailwind: string }> = {
  PENDING:       { label: 'Pendiente',      tailwind: 'text-amber-400  bg-amber-400/10  border-amber-400/30'  },
  IN_PROGRESS:   { label: 'En curso',       tailwind: 'text-blue-400   bg-blue-400/10   border-blue-400/30'   },
  WAITING_PARTS: { label: 'Esp. repuesto',  tailwind: 'text-purple-400 bg-purple-400/10 border-purple-400/30' },
  COMPLETED:     { label: 'Completado',     tailwind: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30' },
  DELIVERED:     { label: 'Entregado',      tailwind: 'text-slate-400  bg-slate-400/10  border-slate-400/30'  },
  CANCELLED:     { label: 'Cancelado',      tailwind: 'text-red-400    bg-red-400/10    border-red-400/30'    },
}

export const FUEL_LABELS: Record<FuelType, string> = {
  GASOLINE: 'Nafta',
  DIESEL:   'Diesel',
  ELECTRIC: 'Eléctrico',
  HYBRID:   'Híbrido',
  GNC:      'GNC',
}
