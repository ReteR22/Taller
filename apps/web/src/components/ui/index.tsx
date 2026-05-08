import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'

// ─────────────────────────────────────────────
// Button
// ─────────────────────────────────────────────
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?:    'sm' | 'md' | 'lg'
  loading?: boolean
  icon?:    React.ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, icon, children, className, disabled, ...props }, ref) => {
    const variants = {
      primary:   'bg-gradient-to-br from-primary to-primary-dark text-white hover:shadow-glow-red',
      secondary: 'bg-white/[0.04] border border-white/10 text-white/70 hover:bg-white/[0.08] hover:text-white',
      ghost:     'text-white/50 hover:bg-white/[0.04] hover:text-white',
      danger:    'bg-gradient-to-br from-red-600 to-red-700 text-white hover:shadow-glow-red',
    }
    const sizes = {
      sm:  'px-3 py-1.5 text-xs gap-1.5',
      md:  'px-4 py-2.5 text-sm gap-2',
      lg:  'px-6 py-3   text-base gap-2.5',
    }
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : icon}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

// ─────────────────────────────────────────────
// Input
// ─────────────────────────────────────────────
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?:  string
  error?:  string
  helper?: string
  icon?:   React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helper, icon, className, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-medium text-white/40 uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full bg-white/[0.04] border border-white/10 rounded-lg px-4 py-2.5',
            'text-white placeholder-white/25 text-sm outline-none',
            'focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-150',
            error && 'border-red-500/50 focus:border-red-500/70 focus:ring-red-500/20',
            !!icon && 'pl-9',
            className
          )}
          {...props}
        />
      </div>
      {error  && <p className="text-xs text-red-400">{error}</p>}
      {helper && !error && <p className="text-xs text-white/30">{helper}</p>}
    </div>
  )
)
Input.displayName = 'Input'

// ─────────────────────────────────────────────
// Select
// ─────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?:   string
  error?:   string
  options:  { value: string; label: string }[]
}

export function Select({ label, error, options, className, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-medium text-white/40 uppercase tracking-wider">{label}</label>}
      <select
        className={cn(
          'w-full bg-white/[0.04] border border-white/10 rounded-lg px-4 py-2.5',
          'text-white text-sm outline-none appearance-none cursor-pointer',
          'focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all',
          error && 'border-red-500/50',
          className
        )}
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='rgba(255,255,255,0.3)' stroke-width='2'%3E%3Cpath d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px' }}
        {...props}
      >
        {options.map(o => (
          <option key={o.value} value={o.value} style={{ background: '#1C1C1C' }}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

// ─────────────────────────────────────────────
// Card
// ─────────────────────────────────────────────
interface CardProps {
  children:    React.ReactNode
  className?:  string
  raised?:     boolean
  hoverable?:  boolean
  glow?:       'red' | 'blue' | 'gold' | 'none'
  onClick?:    () => void
}

export function Card({ children, className, raised, hoverable, glow = 'none', onClick }: CardProps) {
  const glowStyles = {
    none: '',
    red:  'border-primary/15 shadow-glow-red',
    blue: 'border-info/15 shadow-glow-blue',
    gold: 'border-gold/15 shadow-glow-gold',
  }
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-xl border transition-all duration-200',
        raised ? 'bg-surface-raised border-white/[0.08]' : 'bg-surface border-white/[0.06]',
        hoverable && 'cursor-pointer hover:-translate-y-1 hover:shadow-card-hover hover:border-white/15',
        glowStyles[glow],
        className
      )}
    >
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────
// Badge
// ─────────────────────────────────────────────
interface BadgeProps {
  children: React.ReactNode
  color?:   string   // hex color
  className?: string
}

export function Badge({ children, color, className }: BadgeProps) {
  return (
    <span
      className={cn('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border', className)}
      style={color ? {
        color,
        backgroundColor: `${color}18`,
        borderColor:     `${color}40`,
      } : undefined}
    >
      {children}
    </span>
  )
}

// ─────────────────────────────────────────────
// Modal
// ─────────────────────────────────────────────
interface ModalProps {
  open:       boolean
  onClose:    () => void
  title?:     string
  children:   React.ReactNode
  size?:      'sm' | 'md' | 'lg' | 'xl'
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl' }
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={cn('w-full bg-surface-raised border border-white/[0.08] rounded-2xl shadow-card overflow-hidden', sizes[size])}
            onClick={e => e.stopPropagation()}
          >
            {title && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                <h2 className="font-bold text-base">{title}</h2>
                <button onClick={onClose} className="text-white/30 hover:text-white transition-colors p-1 rounded-md hover:bg-white/[0.06]">
                  <X size={18} />
                </button>
              </div>
            )}
            <div className="p-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─────────────────────────────────────────────
// Spinner
// ─────────────────────────────────────────────
export function Spinner({ size = 20, className }: { size?: number; className?: string }) {
  return <Loader2 size={size} className={cn('animate-spin text-primary', className)} />
}

// ─────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────
export function EmptyState({ title, description, action, icon }: {
  title:       string
  description: string
  icon?:       React.ReactNode
  action?:     React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && (
        <div className="w-16 h-16 bg-white/[0.04] rounded-2xl flex items-center justify-center mb-4 text-white/25">
          {icon}
        </div>
      )}
      <h3 className="font-bold text-white/70 mb-1">{title}</h3>
      <p className="text-sm text-white/35 max-w-xs mb-4">{description}</p>
      {action}
    </div>
  )
}

// ─────────────────────────────────────────────
// Table
// ─────────────────────────────────────────────
export function Table({ headers, children, className }: {
  headers:    string[]
  children:   React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/[0.06]">
            {headers.map(h => (
              <th key={h} className="text-left text-[10px] font-semibold text-white/25 uppercase tracking-widest px-4 py-3">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

// ─────────────────────────────────────────────
// Skeleton loader
// ─────────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('shimmer rounded-lg', className)} />
}

// ─────────────────────────────────────────────
// Page header
// ─────────────────────────────────────────────
export function PageHeader({ title, subtitle, actions }: {
  title:     string
  subtitle?: string
  actions?:  React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle && <p className="text-white/40 text-sm mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  )
}
