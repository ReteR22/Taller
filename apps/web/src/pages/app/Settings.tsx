import { useState } from 'react'
import { motion } from 'framer-motion'
import { LogOut, User, Shield, Database, Bell, Key, Save } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Button, Input, PageHeader } from '@/components/ui'

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface-raised border border-white/[0.08] rounded-xl overflow-hidden"
    >
      <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.06]">
        <span className="text-white/40">{icon}</span>
        <h2 className="font-semibold text-sm">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </motion.div>
  )
}

export function Settings() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [saved, setSaved] = useState(false)

  const initials = user?.name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() ?? 'U'

  function handleLogout() {
    logout()
    navigate('/login')
  }

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="Configuración" subtitle="Ajustes de cuenta y sistema" />

      {/* Perfil */}
      <Section title="Mi Cuenta" icon={<User size={16} />}>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-info to-info-dark flex items-center justify-center text-xl font-bold flex-shrink-0">
            {initials}
          </div>
          <div>
            <p className="font-bold text-lg">{user?.name}</p>
            <p className="text-sm text-white/40">{user?.email}</p>
            <span className="inline-flex items-center gap-1.5 mt-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25">
              <Shield size={10} />
              {user?.role === 'ADMIN' ? 'Administrador' : 'Mecánico'}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nombre" defaultValue={user?.name?.split(' ')[0] ?? ''} />
            <Input label="Apellido" defaultValue={user?.name?.split(' ')[1] ?? ''} />
          </div>
          <Input label="Email" type="email" defaultValue={user?.email ?? ''} />
        </div>

        <div className="mt-4 flex justify-end">
          <Button onClick={handleSave} icon={<Save size={14} />} size="sm">
            {saved ? '✓ Guardado' : 'Guardar cambios'}
          </Button>
        </div>
      </Section>

      {/* Seguridad */}
      <Section title="Seguridad" icon={<Key size={16} />}>
        <div className="space-y-4">
          <Input label="Contraseña actual" type="password" placeholder="••••••••" />
          <Input label="Nueva contraseña"  type="password" placeholder="••••••••" />
          <Input label="Confirmar nueva"   type="password" placeholder="••••••••" />
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="secondary" size="sm">Cambiar contraseña</Button>
        </div>
      </Section>

      {/* Notificaciones */}
      <Section title="Notificaciones" icon={<Bell size={16} />}>
        <div className="space-y-3">
          {[
            { label: 'Nuevas órdenes de trabajo',      desc: 'Recibir alerta cuando se crea una orden' },
            { label: 'Cambio de estado de órdenes',    desc: 'Notificar cuando cambia el estado' },
            { label: 'Repuestos con stock bajo',       desc: 'Alerta cuando un repuesto baja del mínimo' },
          ].map(n => (
            <div key={n.label} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">{n.label}</p>
                <p className="text-xs text-white/35 mt-0.5">{n.desc}</p>
              </div>
              <button className="w-10 h-6 rounded-full bg-primary/80 relative transition-colors">
                <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
              </button>
            </div>
          ))}
        </div>
      </Section>

      {/* Sistema */}
      <Section title="Sistema" icon={<Database size={16} />}>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-white/[0.04]">
            <span className="text-white/50">Versión</span>
            <span className="font-mono text-white/70">MechPro v1.0.0</span>
          </div>
          <div className="flex justify-between py-2 border-b border-white/[0.04]">
            <span className="text-white/50">Modelo IA</span>
            <span className="font-mono text-white/70">claude-sonnet-4-20250514</span>
          </div>
          <div className="flex justify-between py-2 border-b border-white/[0.04]">
            <span className="text-white/50">Base de datos</span>
            <span className="font-mono text-emerald-400">● Conectada</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-white/50">Entorno</span>
            <span className="font-mono text-white/70">{import.meta.env.MODE}</span>
          </div>
        </div>
      </Section>

      {/* Cerrar sesión */}
      <div className="bg-surface-raised border border-red-500/15 rounded-xl p-6">
        <h3 className="font-semibold text-sm mb-1">Zona de peligro</h3>
        <p className="text-xs text-white/35 mb-4">Las siguientes acciones son irreversibles</p>
        <Button
          variant="danger"
          size="sm"
          onClick={handleLogout}
          icon={<LogOut size={14} />}
        >
          Cerrar sesión
        </Button>
      </div>
    </div>
  )
}
