import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Download, TrendingUp, TrendingDown, BarChart2 } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line, Legend,
} from 'recharts'
import { apiClient } from '@/services/api'
import { Button, PageHeader, Spinner } from '@/components/ui'
import type { MonthlySummary, RevenuePoint } from '@/types'

function KpiTile({ label, value, change, color }: { label: string; value: string; change?: number; color: string }) {
  const up = (change ?? 0) >= 0
  return (
    <div className="bg-surface-raised border border-white/[0.08] rounded-xl p-5"
      style={{ borderColor: `${color}20`, boxShadow: `0 4px 20px ${color}10` }}>
      <p className="text-xs text-white/35 uppercase tracking-widest mb-2">{label}</p>
      <p className="text-3xl font-display" style={{ color }}>{value}</p>
      {change !== undefined && (
        <div className={`flex items-center gap-1 mt-2 text-xs ${up ? 'text-emerald-400' : 'text-red-400'}`}>
          {up ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
          <span>{Math.abs(change)}% vs mes anterior</span>
        </div>
      )}
    </div>
  )
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-overlay border border-white/10 rounded-xl p-3 shadow-card text-xs">
      <p className="text-white/40 mb-2">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <strong>${Number(p.value).toLocaleString()}</strong>
        </p>
      ))}
    </div>
  )
}

export function Reports() {
  const now = new Date()
  const [year,    setYear]    = useState(now.getFullYear())
  const [month,   setMonth]   = useState(now.getMonth() + 1)
  const [monthly, setMonthly] = useState<MonthlySummary | null>(null)
  const [revenue, setRevenue] = useState<RevenuePoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      apiClient.get(`/reports/monthly?year=${year}&month=${month}`).then(r => setMonthly(r.data)),
      apiClient.get(`/reports/revenue?from=${year}-01-01&to=${year}-12-31`).then(r => setRevenue(r.data)),
    ])
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [year, month])

  const months = [
    'Enero','Febrero','Marzo','Abril','Mayo','Junio',
    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
  ]

  // Formatear datos de revenue para el chart
  const chartData = revenue.map(r => ({
    mes:      r.month.slice(5), // "MM"
    ingresos: Math.round(r.revenue),
    labor:    Math.round(r.labor),
    ordenes:  r.count,
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reportes"
        subtitle="Análisis financiero del taller"
        actions={
          <div className="flex items-center gap-2">
            <select
              value={month}
              onChange={e => setMonth(Number(e.target.value))}
              className="bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none"
            >
              {months.map((m, i) => <option key={i} value={i+1} style={{ background: '#1C1C1C' }}>{m}</option>)}
            </select>
            <select
              value={year}
              onChange={e => setYear(Number(e.target.value))}
              className="bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none"
            >
              {[2023,2024,2025,2026].map(y => <option key={y} value={y} style={{ background: '#1C1C1C' }}>{y}</option>)}
            </select>
          </div>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-20"><Spinner size={28} /></div>
      ) : (
        <>
          {/* KPIs del mes seleccionado */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 xl:grid-cols-4 gap-4"
          >
            <KpiTile
              label={`Ingresos — ${months[month-1]}`}
              value={`$${Math.round(monthly?.totalRevenue ?? 0).toLocaleString()}`}
              color="#EF4444"
            />
            <KpiTile
              label="Mano de obra"
              value={`$${Math.round(monthly?.totalLabor ?? 0).toLocaleString()}`}
              color="#3B82F6"
            />
            <KpiTile
              label="Órdenes cerradas"
              value={String(monthly?.totalOrders ?? 0)}
              color="#F59E0B"
            />
            <KpiTile
              label="Ticket promedio"
              value={`$${Math.round(monthly?.avgOrderValue ?? 0).toLocaleString()}`}
              color="#8B5CF6"
            />
          </motion.div>

          {/* Revenue chart — año completo */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-surface-raised border border-white/[0.08] rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold">Ingresos vs Mano de Obra — {year}</h3>
                <p className="text-xs text-white/35 mt-1">Órdenes completadas y entregadas</p>
              </div>
              <Button variant="secondary" size="sm" icon={<Download size={13}/>}>
                Exportar CSV
              </Button>
            </div>
            {chartData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-white/25">
                <BarChart2 size={32} className="mb-2" />
                <p className="text-sm">Sin datos para {year}</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartData} barGap={4} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="mes" tick={{ fill:'rgba(255,255,255,0.3)', fontSize:11 }} axisLine={false} tickLine={false}
                    tickFormatter={v => months[parseInt(v)-1]?.slice(0,3) ?? v} />
                  <YAxis tick={{ fill:'rgba(255,255,255,0.3)', fontSize:11 }} axisLine={false} tickLine={false}
                    tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill:'rgba(255,255,255,0.02)' }} />
                  <Legend wrapperStyle={{ paddingTop: 16, fontSize: 12, color: 'rgba(255,255,255,0.4)' }} />
                  <Bar dataKey="ingresos" name="Ingresos"     fill="#EF4444" radius={[4,4,0,0]} opacity={0.85} />
                  <Bar dataKey="labor"    name="Mano de obra" fill="#3B82F6" radius={[4,4,0,0]} opacity={0.85} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </motion.div>

          {/* Orders trend line */}
          {chartData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-surface-raised border border-white/[0.08] rounded-xl p-6"
            >
              <h3 className="font-bold mb-6">Volumen de Órdenes por Mes</h3>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="mes" tick={{ fill:'rgba(255,255,255,0.3)', fontSize:11 }} axisLine={false} tickLine={false}
                    tickFormatter={v => months[parseInt(v)-1]?.slice(0,3) ?? v} />
                  <YAxis tick={{ fill:'rgba(255,255,255,0.3)', fontSize:11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background:'#1C1C1C', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, fontSize:12 }} />
                  <Line type="monotone" dataKey="ordenes" name="Órdenes" stroke="#F59E0B" strokeWidth={2.5}
                    dot={{ fill:'#F59E0B', strokeWidth:0, r:4 }} activeDot={{ r:6, fill:'#F59E0B' }} />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* Top mecánicos */}
          {(monthly?.topMechanics?.length ?? 0) > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-surface-raised border border-white/[0.08] rounded-xl p-6"
            >
              <h3 className="font-bold mb-4">Top Mecánicos — {months[month-1]}</h3>
              <div className="space-y-3">
                {monthly!.topMechanics.map((m, i) => (
                  <div key={m.mechanicId} className="flex items-center gap-4">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                      {i+1}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">{m.mechanicName}</span>
                        <span className="text-xs text-gold font-bold">${Math.round(m.labor).toLocaleString()}</span>
                      </div>
                      <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-primary-dark rounded-full"
                          style={{ width: `${Math.min(100, (m.labor / (monthly!.topMechanics[0]?.labor || 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-white/35 w-16 text-right">{m.orders} órdenes</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Estado de órdenes en el mes */}
          {(monthly?.byStatus?.length ?? 0) > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-surface-raised border border-white/[0.08] rounded-xl p-6"
            >
              <h3 className="font-bold mb-4">Órdenes por Estado — {months[month-1]}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {monthly!.byStatus.map(s => {
                  const colors: Record<string, string> = {
                    PENDING:'#FBBF24', IN_PROGRESS:'#60A5FA', WAITING_PARTS:'#C084FC',
                    COMPLETED:'#34D399', DELIVERED:'#94A3B8', CANCELLED:'#F87171'
                  }
                  const labels: Record<string, string> = {
                    PENDING:'Pendiente', IN_PROGRESS:'En curso', WAITING_PARTS:'Esp. repuesto',
                    COMPLETED:'Completado', DELIVERED:'Entregado', CANCELLED:'Cancelado'
                  }
                  const color = colors[s.status] ?? '#fff'
                  return (
                    <div key={s.status} className="bg-white/[0.03] rounded-lg p-3 text-center border border-white/[0.04]">
                      <p className="text-2xl font-bold" style={{ color }}>{s._count.id}</p>
                      <p className="text-xs text-white/35 mt-1">{labels[s.status] ?? s.status}</p>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  )
}
