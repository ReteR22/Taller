import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { AppLayout }   from '@/components/layout/AppLayout'
import { LoginPage }   from '@/pages/public/LoginPage'
import { Dashboard }   from '@/pages/app/Dashboard'
import { WorkOrders }  from '@/pages/app/WorkOrders'
import { Clients }     from '@/pages/app/Clients'
import { Vehicles }    from '@/pages/app/Vehicles'
import { AIAssistant } from '@/pages/app/AIAssistant'
import { Reports }     from '@/pages/app/Reports'
import { Settings }    from '@/pages/app/Settings'
import { Forum }       from '@/pages/app/Forum'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore(s => s.token)
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore(s => s.token)
  return token ? <Navigate to="/app/dashboard" replace /> : <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
        <Route path="/login" element={
          <PublicRoute><LoginPage /></PublicRoute>
        } />

        {/* Protected App */}
        <Route path="/app" element={
          <ProtectedRoute><AppLayout /></ProtectedRoute>
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard"  element={<Dashboard />} />
          <Route path="orders"     element={<WorkOrders />} />
          <Route path="clients"    element={<Clients />} />
          <Route path="vehicles"   element={<Vehicles />} />
          <Route path="forum"      element={<Forum />} />
          <Route path="ai"         element={<AIAssistant />} />
          <Route path="reports"    element={<Reports />} />
          <Route path="settings"   element={<Settings />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
