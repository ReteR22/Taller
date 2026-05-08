import { useState, FormEvent } from 'react'
import { motion } from 'framer-motion'
import { Wrench, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useNavigate } from 'react-router-dom'

export function LoginPage() {
  const [email,    setEmail]    = useState('admin@mechpro.com')
  const [password, setPassword] = useState('admin123')
  const [showPass, setShowPass] = useState(false)
  const { login, isLoading, error, clearError } = useAuthStore()
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    clearError()
    try {
      await login(email, password)
      navigate('/app/dashboard')
    } catch { /* error shown via store */ }
  }

  return (
    <div className="min-h-screen bg-base-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-info/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 20 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-2xl mb-4 shadow-glow-red"
          >
            <Wrench size={28} className="text-white" />
          </motion.div>
          <h1 className="text-3xl font-display tracking-wider">
            MECH<span className="text-primary">PRO</span>
          </h1>
          <p className="text-white/40 text-sm mt-1">Plataforma de gestión para talleres</p>
        </div>

        {/* Card */}
        <div className="card-raised p-8 shadow-card">
          <h2 className="text-xl font-bold mb-6">Iniciar Sesión</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-base"
                placeholder="usuario@taller.com"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-base pr-10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-primary bg-primary/10 border border-primary/20 rounded-lg px-4 py-2.5"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2"
            >
              {isLoading ? (
                <><Loader2 size={16} className="animate-spin" /> Ingresando…</>
              ) : (
                'Ingresar al Sistema'
              )}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-info/5 border border-info/20 rounded-lg">
            <p className="text-xs text-info/70 font-medium mb-2">Credenciales de demostración:</p>
            <div className="space-y-1 text-xs text-white/40 font-mono">
              <p>Admin: <span className="text-white/60">admin@mechpro.com / admin123</span></p>
              <p>Mec.:  <span className="text-white/60">mecanico@mechpro.com / mecanico123</span></p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
