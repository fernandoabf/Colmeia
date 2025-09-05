import { Routes, Route, Link, useNavigate, Navigate, useLocation } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import ErrorBoundary from '../components/ErrorBoundary'

const Login = lazy(() => import('./Login'))
const Computers = lazy(() => import('./Computers'))
const Tailscale = lazy(() => import('./Tailscale'))

function RequireAuth({ children }: { children: JSX.Element }) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  if (!token) return <Navigate to="/login" replace />
  return children
}

function PublicOnly({ children }: { children: JSX.Element }) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  if (token) return <Navigate to="/computers" replace />
  return children
}

export default function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

  const logout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <div>
      <header>
        <div className="spaced">
          <strong>Colmeia</strong>
          {token && <Link to="/computers">Computadores</Link>}
          {token && <Link to="/tailscale">Tailscale</Link>}
        </div>
        <div className="spaced">
          {token ? <button className="btn secondary" onClick={logout}>Sair</button> : <Link to="/login" className="btn">Login</Link>}
        </div>
      </header>
      <div className="container">
        <ErrorBoundary fallback={<div className="card" style={{ color: '#ef4444' }}>Falha ao carregar rota</div>}>
          <Suspense fallback={<div style={{ padding: 16 }}>Carregando...</div>}>
            <Routes>
              <Route path="/" element={<Navigate to={token ? '/computers' : '/login'} replace />} />
              <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
              <Route path="/computers" element={<RequireAuth><Computers /></RequireAuth>} />
              <Route path="/tailscale" element={<RequireAuth><Tailscale /></RequireAuth>} />
              <Route path="*" element={<PublicOnly><Login /></PublicOnly>} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  )
}
