import { useState, useEffect, useRef } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Wrench, Users, Car,
  Sparkles, BarChart3, Settings, LogOut,
  Bell, Plus, ChevronLeft, ChevronRight, ShoppingBag, Check,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { getNotifications, markAllRead, markOneRead } from '@/services/forum.service'

const NAV_ITEMS = [
  { to: '/app/dashboard', label: 'Dashboard',    icon: LayoutDashboard },
  { to: '/app/orders',    label: 'Órdenes',       icon: Wrench          },
  { to: '/app/clients',   label: 'Clientes',      icon: Users           },
  { to: '/app/vehicles',  label: 'Vehículos',     icon: Car             },
  { to: '/app/forum',     label: 'Foro Repuestos',icon: ShoppingBag     },
  { to: '/app/ai',        label: 'IA Mecánica',   icon: Sparkles        },
  { to: '/app/reports',   label: 'Reportes',      icon: BarChart3       },
  { to: '/app/settings',  label: 'Configuración', icon: Settings        },
]

interface Notif { id: string; title: string; body: string; link?: string; isRead: boolean; createdAt: string }

export function AppLayout() {
  const [collapsed, setCollapsed]       = useState(false)
  const { user, logout }                = useAuthStore()
  const navigate                        = useNavigate()
  const [notifs, setNotifs]             = useState<Notif[]>([])
  const [unread, setUnread]             = useState(0)
  const [bellOpen, setBellOpen]         = useState(false)
  const bellRef                         = useRef<HTMLDivElement>(null)

  const loadNotifs = async () => {
    try {
      const res = await getNotifications()
      setNotifs(res.notifications)
      setUnread(res.unreadCount)
    } catch {}
  }

  useEffect(() => {
    loadNotifs()
    const t = setInterval(loadNotifs, 30000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const initials = user?.name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() ?? 'U'

  return (
    <div className="flex h-screen bg-base-900 overflow-hidden">
      {/* ── Sidebar ─────────────────────────────────────── */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="relative flex flex-col bg-base-800 border-r border-white/[0.06] flex-shrink-0 z-20"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/[0.06] h-16">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-dark rounded-lg flex items-center justify-center flex-shrink-0">
            <Wrench size={16} className="text-white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="text-lg font-display tracking-wider whitespace-nowrap overflow-hidden"
              >
                MECH<span className="text-primary">PRO</span>
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group relative
                 ${isActive
                   ? 'bg-primary/12 text-primary'
                   : 'text-white/40 hover:text-white/80 hover:bg-white/[0.04]'
                 }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} className="flex-shrink-0" />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="text-sm font-medium whitespace-nowrap overflow-hidden"
                      >
                        {label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {isActive && !collapsed && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"
                    />
                  )}
                  {/* Tooltip when collapsed */}
                  {collapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-surface-overlay border border-white/10 rounded-md text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                      {label}
                    </div>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="p-3 border-t border-white/[0.06]">
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-info to-info-dark flex items-center justify-center text-xs font-bold flex-shrink-0">
              {initials}
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 min-w-0"
                >
                  <p className="text-xs font-semibold truncate">{user?.name}</p>
                  <p className="text-[10px] text-white/40 truncate">{user?.role === 'ADMIN' ? 'Administrador' : 'Mecánico'}</p>
                </motion.div>
              )}
            </AnimatePresence>
            {!collapsed && (
              <button
                onClick={() => { logout(); navigate('/login') }}
                className="p-1.5 rounded-md text-white/30 hover:text-primary hover:bg-primary/10 transition-all"
                title="Cerrar sesión"
              >
                <LogOut size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-[72px] w-6 h-6 rounded-full bg-surface-overlay border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/20 transition-all z-30"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </motion.aside>

      {/* ── Main ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-base-800 border-b border-white/[0.06] flex items-center px-6 gap-4 flex-shrink-0">
          <div className="flex-1 max-w-sm">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                placeholder="Buscar órdenes, clientes, vehículos…"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg py-2 pl-9 pr-4 text-sm text-white/60 placeholder-white/25 outline-none focus:border-white/20 transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notificaciones */}
            <div ref={bellRef} className="relative">
              <button onClick={() => setBellOpen(o => !o)}
                className="relative p-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/50 hover:text-white hover:bg-white/[0.08] transition-all">
                <Bell size={16} />
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-primary rounded-full border-2 border-base-800 flex items-center justify-center text-[9px] font-bold text-white px-0.5">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </button>
              <AnimatePresence>
                {bellOpen && (
                  <motion.div initial={{ opacity: 0, y: 4, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 4, scale: 0.97 }}
                    className="absolute right-0 top-full mt-2 w-80 bg-base-800 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                    <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/[0.06]">
                      <span className="text-xs font-semibold">Notificaciones</span>
                      {unread > 0 && (
                        <button onClick={async () => { await markAllRead(); loadNotifs() }}
                          className="text-[10px] text-primary hover:underline flex items-center gap-1">
                          <Check size={9} />Marcar todo leído
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-white/[0.04]">
                      {notifs.length === 0 ? (
                        <div className="py-8 text-center text-xs text-white/25">Sin notificaciones</div>
                      ) : notifs.map(n => (
                        <div key={n.id} onClick={async () => {
                          if (!n.isRead) { await markOneRead(n.id); loadNotifs() }
                          if (n.link) { navigate(n.link); setBellOpen(false) }
                        }}
                          className={`px-3 py-2.5 cursor-pointer hover:bg-white/[0.04] transition-colors ${
                            !n.isRead ? 'bg-primary/5' : ''
                          }`}>
                          <p className="text-xs font-medium leading-tight">{n.title}</p>
                          <p className="text-[11px] text-white/40 mt-0.5 leading-tight">{n.body}</p>
                          <p className="text-[10px] text-white/20 mt-1">{new Date(n.createdAt).toLocaleDateString('es-AR')}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Nueva Orden */}
            <button onClick={() => navigate('/app/orders')} className="btn-primary flex items-center gap-2 text-sm">
              <Plus size={14} />
              Nueva Orden
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  )
}
