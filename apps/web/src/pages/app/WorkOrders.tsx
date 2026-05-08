import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, FileText, RefreshCw, ChevronDown, Download } from 'lucide-react'
import { useWorkOrders } from '@/hooks'
import { WorkOrderForm } from '@/components/workshop/WorkOrderForm'
import { Button, Badge, PageHeader, EmptyState, Spinner } from '@/components/ui'
import type { WorkOrderStatus } from '@/types'

const STATUS_CFG: Record<WorkOrderStatus, { label: string; color: string }> = {
  PENDING:       { label: 'Pendiente',     color: '#FBBF24' },
  IN_PROGRESS:   { label: 'En curso',      color: '#60A5FA' },
  WAITING_PARTS: { label: 'Esp. repuesto', color: '#C084FC' },
  COMPLETED:     { label: 'Completado',    color: '#34D399' },
  DELIVERED:     { label: 'Entregado',     color: '#94A3B8' },
  CANCELLED:     { label: 'Cancelado',     color: '#F87171' },
}

const ALL_STATUSES = ['ALL', ...Object.keys(STATUS_CFG)] as const

export function WorkOrders() {
  const [filter,      setFilter]      = useState('ALL')
  const [showForm,    setShowForm]    = useState(false)
  const [expandedId,  setExpandedId]  = useState<string | null>(null)

  const { data, total, loading, error, refetch, changeStatus, getPDF } = useWorkOrders(
    filter !== 'ALL' ? { status: filter } : {}
  )

  return (
    <>
      <WorkOrderForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSaved={() => { setShowForm(false); refetch() }}
      />

      <div className="space-y-5">
        <PageHeader
          title="Órdenes de Trabajo"
          subtitle={`${total} órdenes encontradas`}
          actions={
            <>
              <Button variant="secondary" size="sm" onClick={refetch} icon={<RefreshCw size={13} />}>
                Actualizar
              </Button>
              <Button onClick={() => setShowForm(true)} icon={<Plus size={14} />}>
                Nueva Orden
              </Button>
            </>
          }
        />

        {/* Filtros de estado */}
        <div className="flex gap-2 flex-wrap">
          {ALL_STATUSES.map(s => {
            const cfg = s !== 'ALL' ? STATUS_CFG[s as WorkOrderStatus] : null
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
                style={filter === s && cfg ? {
                  color: cfg.color,
                  background: `${cfg.color}18`,
                  borderColor: `${cfg.color}40`,
                } : {
                  color: filter === s ? '#EF4444' : 'rgba(255,255,255,0.35)',
                  background: filter === s ? 'rgba(239,68,68,0.1)' : 'transparent',
                  borderColor: filter === s ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)',
                }}
              >
                {s === 'ALL' ? 'Todas' : cfg!.label}
              </button>
            )
          })}
        </div>

        {/* Tabla */}
        <div className="bg-surface-raised border border-white/[0.08] rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Spinner size={28} />
            </div>
          ) : error ? (
            <EmptyState
              title="Error al cargar órdenes"
              description={error}
              action={<Button variant="secondary" size="sm" onClick={refetch}>Reintentar</Button>}
            />
          ) : data.length === 0 ? (
            <EmptyState
              title="No hay órdenes"
              description="Creá la primera orden de trabajo para empezar"
              icon={<FileText size={28} />}
              action={<Button onClick={() => setShowForm(true)} icon={<Plus size={14} />}>Nueva Orden</Button>}
            />
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {['', 'Nro. Orden', 'Cliente / Vehículo', 'Mecánico', 'Estado', 'Total', 'Ingreso', 'Acciones'].map(h => (
                    <th key={h} className="text-left text-[10px] font-semibold text-white/25 uppercase tracking-widest px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((wo, i) => {
                  const cfg       = STATUS_CFG[wo.status as WorkOrderStatus]
                  const expanded  = expandedId === wo.id
                  const client    = wo.vehicle?.client
                  const clientName= client ? `${client.firstName} ${client.lastName}` : '—'

                  return (
                    <>
                      <motion.tr
                        key={wo.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02] transition-colors cursor-pointer"
                        onClick={() => setExpandedId(expanded ? null : wo.id)}
                      >
                        <td className="px-4 py-3 w-8">
                          <ChevronDown
                            size={14}
                            className={`text-white/25 transition-transform ${expanded ? 'rotate-180' : ''}`}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-mono font-semibold text-info">{wo.number}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium">{clientName}</div>
                          <div className="text-xs text-white/35 mt-0.5">
                            {wo.vehicle ? `${wo.vehicle.brand} ${wo.vehicle.model} ${wo.vehicle.year}` : '—'}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-white/50">{wo.mechanic?.name ?? '—'}</td>
                        <td className="px-4 py-3">
                          <Badge color={cfg.color}>{cfg.label}</Badge>
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-gold">
                          ${Number(wo.total).toLocaleString('es-AR')}
                        </td>
                        <td className="px-4 py-3 text-xs text-white/35">
                          {new Date(wo.entryDate).toLocaleDateString('es-AR')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => getPDF(wo.id)}
                              title="Exportar PDF"
                              className="p-1.5 rounded text-white/25 hover:text-primary hover:bg-primary/10 transition-all"
                            >
                              <Download size={13} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>

                      {/* Fila expandida */}
                      <AnimatePresence>
                        {expanded && (
                          <tr key={`${wo.id}-exp`}>
                            <td colSpan={8} className="px-6 pb-4 bg-white/[0.01]">
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="pt-3 grid grid-cols-2 gap-6"
                              >
                                <div>
                                  <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Descripción</p>
                                  <p className="text-sm text-white/70">{wo.description}</p>
                                  {wo.diagnosis && (
                                    <>
                                      <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1 mt-3">Diagnóstico</p>
                                      <p className="text-sm text-white/70">{wo.diagnosis}</p>
                                    </>
                                  )}
                                </div>
                                <div>
                                  {wo.parts && wo.parts.length > 0 && (
                                    <>
                                      <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Repuestos</p>
                                      <div className="space-y-1">
                                        {wo.parts.map((p: any, pi: number) => (
                                          <div key={pi} className="flex justify-between text-xs text-white/50">
                                            <span>{p.name} × {p.quantity}</span>
                                            <span className="text-white/70">${Number(p.subtotal).toLocaleString()}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </>
                                  )}
                                  {/* Cambio de estado */}
                                  <div className="mt-3">
                                    <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Cambiar Estado</p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {Object.entries(STATUS_CFG)
                                        .filter(([k]) => k !== wo.status)
                                        .map(([k, v]) => (
                                          <button
                                            key={k}
                                            onClick={() => changeStatus(wo.id, k)}
                                            className="text-[10px] px-2 py-1 rounded-md border font-semibold transition-all hover:opacity-80"
                                            style={{ color: v.color, borderColor: `${v.color}40`, background: `${v.color}12` }}
                                          >
                                            {v.label}
                                          </button>
                                        ))
                                      }
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </AnimatePresence>
                    </>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  )
}
