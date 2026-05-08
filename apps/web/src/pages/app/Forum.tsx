import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, Plus, X, Search, ChevronDown, Tag, Truck, Clock, CheckCircle, AlertCircle, Package, MessageSquare } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import * as forumSvc from '@/services/forum.service'

type Status = 'OPEN' | 'QUOTED' | 'CLOSED'
interface Quote { id: string; price: number; currency: string; deliveryDays?: number; notes?: string; availability: boolean; supplier: { id: string; name: string; email: string }; createdAt: string }
interface PartRequest { id: string; title: string; description: string; partCode?: string; brand?: string; quantity: number; status: Status; createdAt: string; createdBy: { id: string; name: string }; vehicle?: { brand: string; model: string; year: number; plate: string }; quotes: Quote[] }

const STATUS_BADGE: Record<Status, { label: string; class: string }> = {
  OPEN:   { label: 'Abierta',   class: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  QUOTED: { label: 'Cotizada',  class: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  CLOSED: { label: 'Cerrada',   class: 'bg-white/10 text-white/40 border-white/10' },
}

export function Forum() {
  const { user } = useAuthStore()
  const isSupplier = user?.role === 'SUPPLIER'
  const isAdmin    = user?.role === 'ADMIN'

  const [requests, setRequests]         = useState<PartRequest[]>([])
  const [total, setTotal]               = useState(0)
  const [page, setPage]                 = useState(1)
  const [search, setSearch]             = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [loading, setLoading]           = useState(true)
  const [selected, setSelected]         = useState<PartRequest | null>(null)
  const [showNew, setShowNew]           = useState(false)
  const [showQuote, setShowQuote]       = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await forumSvc.getPartRequests({ page, search: search || undefined, status: filterStatus || undefined })
      setRequests(res.data)
      setTotal(res.total)
    } finally { setLoading(false) }
  }, [page, search, filterStatus])

  useEffect(() => { load() }, [load])

  const refreshSelected = async (id: string) => {
    const r = await forumSvc.getPartRequest(id)
    setSelected(r)
    setRequests(prev => prev.map(x => x.id === id ? { ...x, quotes: r.quotes, status: r.status } : x))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <ShoppingBag size={22} className="text-primary" /> Foro de Repuestos
          </h1>
          <p className="text-sm text-white/40 mt-0.5">
            {isSupplier ? 'Publicá tus cotizaciones en las solicitudes activas' : 'Publicá solicitudes y recibí cotizaciones de proveedores'}
          </p>
        </div>
        {!isSupplier && (
          <button onClick={() => setShowNew(true)} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={14} /> Nueva Solicitud
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Buscar repuesto, marca, código…"
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg py-2 pl-9 pr-4 text-sm text-white/80 placeholder-white/25 outline-none focus:border-white/20 transition-colors" />
        </div>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1) }}
          className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/60 outline-none focus:border-white/20">
          <option value="">Todos los estados</option>
          <option value="OPEN">Abiertas</option>
          <option value="QUOTED">Cotizadas</option>
          <option value="CLOSED">Cerradas</option>
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-44 rounded-xl bg-white/[0.03] animate-pulse" />)}
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-white/25">
          <Package size={48} className="mb-3" />
          <p className="text-sm">No hay solicitudes</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {requests.map(r => (
            <motion.div key={r.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              onClick={() => { setSelected(r); refreshSelected(r.id) }}
              className="cursor-pointer bg-white/[0.03] border border-white/[0.07] rounded-xl p-4 hover:border-primary/30 hover:bg-white/[0.05] transition-all group">
              <div className="flex items-start justify-between mb-2">
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${STATUS_BADGE[r.status].class}`}>
                  {STATUS_BADGE[r.status].label}
                </span>
                <span className="text-[10px] text-white/25">{new Date(r.createdAt).toLocaleDateString('es-AR')}</span>
              </div>
              <h3 className="font-semibold text-sm leading-tight mb-1 group-hover:text-primary transition-colors line-clamp-2">{r.title}</h3>
              <p className="text-xs text-white/40 line-clamp-2 mb-3">{r.description}</p>
              <div className="flex items-center gap-3 text-xs text-white/30">
                {r.partCode && <span className="flex items-center gap-1"><Tag size={10} />{r.partCode}</span>}
                {r.brand    && <span>{r.brand}</span>}
                <span className="ml-auto flex items-center gap-1">
                  <MessageSquare size={10} />
                  {r.quotes.length} {r.quotes.length === 1 ? 'cotización' : 'cotizaciones'}
                </span>
              </div>
              {r.vehicle && (
                <div className="mt-2 pt-2 border-t border-white/[0.05] text-[10px] text-white/30">
                  {r.vehicle.brand} {r.vehicle.model} {r.vehicle.year} · {r.vehicle.plate}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="flex justify-center gap-2 pt-2">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
            className="px-3 py-1.5 rounded-lg text-xs bg-white/[0.04] border border-white/[0.08] disabled:opacity-30">Anterior</button>
          <span className="px-3 py-1.5 text-xs text-white/40">Pág. {page}</span>
          <button disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}
            className="px-3 py-1.5 rounded-lg text-xs bg-white/[0.04] border border-white/[0.08] disabled:opacity-30">Siguiente</button>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showNew  && <NewRequestModal onClose={() => setShowNew(false)}  onCreated={load} />}
        {selected && <DetailModal request={selected} isAdmin={isAdmin} isSupplier={isSupplier}
          userId={user?.id ?? ''} onClose={() => setSelected(null)}
          onQuote={() => setShowQuote(true)} onClose2={() => setShowQuote(false)}
          showQuoteModal={showQuote} onQuoted={() => { refreshSelected(selected.id); setShowQuote(false) }}
          onClosed={() => { refreshSelected(selected.id) }} />}
      </AnimatePresence>
    </div>
  )
}

// ── New Request Modal ─────────────────────────────────────────
function NewRequestModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ title: '', description: '', partCode: '', brand: '', quantity: 1, vehicleId: '' })
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const submit = async () => {
    if (!form.title || !form.description) { setErr('Título y descripción son requeridos'); return }
    setLoading(true); setErr('')
    try {
      await forumSvc.createPartRequest({ ...form, quantity: Number(form.quantity), partCode: form.partCode || undefined, brand: form.brand || undefined, vehicleId: form.vehicleId || undefined })
      onCreated(); onClose()
    } catch (e: any) { setErr(e.message) } finally { setLoading(false) }
  }

  return (
    <Overlay onClose={onClose}>
      <h2 className="text-lg font-bold mb-5">Nueva Solicitud de Repuesto</h2>
      <div className="space-y-3">
        <Field label="Título *"><input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ej: Pastillas de freno delantera" className={input} /></Field>
        <Field label="Descripción *"><textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Detallá el repuesto que necesitás…" className={`${input} resize-none`} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Código de repuesto"><input value={form.partCode} onChange={e => setForm(f => ({ ...f, partCode: e.target.value }))} placeholder="Ej: BP-4238" className={input} /></Field>
          <Field label="Marca"><input value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} placeholder="Ej: Brembo" className={input} /></Field>
        </div>
        <Field label="Cantidad"><input type="number" min={1} value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: Number(e.target.value) }))} className={input} /></Field>
      </div>
      {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
      <div className="flex justify-end gap-2 mt-5">
        <button onClick={onClose} className="btn-ghost text-sm">Cancelar</button>
        <button onClick={submit} disabled={loading} className="btn-primary text-sm">
          {loading ? 'Publicando…' : 'Publicar Solicitud'}
        </button>
      </div>
    </Overlay>
  )
}

// ── Detail Modal ──────────────────────────────────────────────
function DetailModal({ request, isAdmin, isSupplier, userId, onClose, onQuote, onClose2, showQuoteModal, onQuoted, onClosed }: {
  request: PartRequest; isAdmin: boolean; isSupplier: boolean; userId: string
  onClose: () => void; onQuote: () => void; onClose2: () => void; showQuoteModal: boolean
  onQuoted: () => void; onClosed: () => void
}) {
  const myQuote     = request.quotes.find(q => q.supplier.id === userId)
  const canQuote    = isSupplier && !myQuote && request.status !== 'CLOSED'
  const sortedQ     = [...request.quotes].sort((a, b) => a.price - b.price)

  return (
    <Overlay onClose={onClose} wide>
      <div className="flex items-start justify-between mb-4">
        <div>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${STATUS_BADGE[request.status].class} mb-2 inline-block`}>{STATUS_BADGE[request.status].label}</span>
          <h2 className="text-lg font-bold">{request.title}</h2>
          <p className="text-xs text-white/40 mt-0.5">Por {request.createdBy.name} · {new Date(request.createdAt).toLocaleDateString('es-AR')}</p>
        </div>
        <div className="flex gap-2">
          {canQuote && <button onClick={onQuote} className="btn-primary text-xs flex items-center gap-1.5"><Plus size={12} />Cotizar</button>}
          {isAdmin && request.status !== 'CLOSED' && (
            <button onClick={async () => { await forumSvc.closePartRequest(request.id); onClosed() }}
              className="btn-ghost text-xs text-white/40 hover:text-red-400">Cerrar</button>
          )}
        </div>
      </div>

      <p className="text-sm text-white/60 mb-4 leading-relaxed">{request.description}</p>

      <div className="flex flex-wrap gap-3 mb-5 text-xs">
        {request.partCode && <Chip icon={<Tag size={10} />} label={request.partCode} />}
        {request.brand    && <Chip icon={<Package size={10} />} label={request.brand} />}
        <Chip icon={<ChevronDown size={10} />} label={`Cant: ${request.quantity}`} />
        {request.vehicle  && <Chip icon={<Truck size={10} />} label={`${request.vehicle.brand} ${request.vehicle.model} ${request.vehicle.year}`} />}
      </div>

      <div className="border-t border-white/[0.06] pt-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <MessageSquare size={14} className="text-primary" />
          Cotizaciones ({sortedQ.length})
        </h3>
        {sortedQ.length === 0 ? (
          <div className="text-center py-8 text-white/25 text-sm">No hay cotizaciones aún</div>
        ) : (
          <div className="space-y-2">
            {sortedQ.map((q, i) => (
              <div key={q.id} className={`flex items-center gap-4 p-3 rounded-lg border ${i === 0 ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/[0.06] bg-white/[0.02]'}`}>
                {i === 0 && <CheckCircle size={14} className="text-emerald-400 flex-shrink-0" />}
                <div className="flex-1">
                  <p className="text-sm font-semibold">{q.supplier.name}</p>
                  {q.notes && <p className="text-xs text-white/40 mt-0.5">{q.notes}</p>}
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-primary">{q.currency} {Number(q.price).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
                  {q.deliveryDays && <p className="text-[10px] text-white/30 flex items-center justify-end gap-1 mt-0.5"><Clock size={9} />{q.deliveryDays}d</p>}
                </div>
                {!q.availability && <span className="text-[10px] text-red-400 flex items-center gap-1"><AlertCircle size={9} />Sin stock</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {showQuoteModal && <QuoteModal requestId={request.id} onClose={onClose2} onQuoted={onQuoted} />}
    </Overlay>
  )
}

// ── Quote Modal ───────────────────────────────────────────────
function QuoteModal({ requestId, onClose, onQuoted }: { requestId: string; onClose: () => void; onQuoted: () => void }) {
  const [form, setForm] = useState({ price: '', currency: 'ARS', deliveryDays: '', notes: '', availability: true })
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const submit = async () => {
    if (!form.price) { setErr('El precio es requerido'); return }
    setLoading(true); setErr('')
    try {
      await forumSvc.createQuote(requestId, {
        price: Number(form.price), currency: form.currency,
        deliveryDays: form.deliveryDays ? Number(form.deliveryDays) : undefined,
        notes: form.notes || undefined, availability: form.availability,
      })
      onQuoted()
    } catch (e: any) { setErr(e.message) } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="relative bg-base-800 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl z-10">
        <h3 className="text-base font-bold mb-4">Publicar Cotización</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Precio *"><input type="number" min={0} step={0.01} value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0.00" className={input} /></Field>
            <Field label="Moneda"><select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} className={input}><option value="ARS">ARS</option><option value="USD">USD</option></select></Field>
          </div>
          <Field label="Días de entrega"><input type="number" min={1} value={form.deliveryDays} onChange={e => setForm(f => ({ ...f, deliveryDays: e.target.value }))} placeholder="Ej: 3" className={input} /></Field>
          <Field label="Notas"><textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Condiciones, garantía, etc." className={`${input} resize-none`} /></Field>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.availability} onChange={e => setForm(f => ({ ...f, availability: e.target.checked }))} className="accent-primary" />
            <span className="text-sm text-white/60">Disponibilidad inmediata</span>
          </label>
        </div>
        {err && <p className="text-xs text-red-400 mt-2">{err}</p>}
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="btn-ghost text-sm">Cancelar</button>
          <button onClick={submit} disabled={loading} className="btn-primary text-sm">{loading ? 'Enviando…' : 'Enviar Cotización'}</button>
        </div>
      </motion.div>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────
function Overlay({ children, onClose, wide }: { children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 8 }}
        className={`relative bg-base-800 border border-white/10 rounded-2xl p-6 w-full shadow-2xl z-10 max-h-[90vh] overflow-y-auto ${wide ? 'max-w-2xl' : 'max-w-lg'}`}>
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/[0.06] transition-all">
          <X size={14} />
        </button>
        {children}
      </motion.div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-xs text-white/40 mb-1">{label}</label>{children}</div>
}

function Chip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/[0.08] text-white/50">
      {icon}{label}
    </span>
  )
}

const input = 'w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/80 outline-none focus:border-white/20 transition-colors placeholder-white/25'
