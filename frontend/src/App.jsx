import { useState } from 'react'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Agents from './pages/Agents'
import Checklist from './pages/Checklist'
import Upload from './pages/Upload'
import Reports from './pages/Reports'
import MonthlyEval from './pages/MonthlyEval'
import Users from './pages/Users'
import Navbar from './components/Navbar'

const menuPorRol = {
  admin: [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'reports', label: 'Reportes' },
    { id: 'monthly', label: 'Evaluación mensual' },
    { id: 'agents', label: 'Agentes' },
    { id: 'checklist', label: 'Checklist' },
    { id: 'upload', label: 'Cargar conversaciones' },
  ],
  supervisor: [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'reports', label: 'Reportes' },
    { id: 'monthly', label: 'Evaluación mensual' },
    { id: 'agents', label: 'Agentes' },
    { id: 'checklist', label: 'Checklist' },
    { id: 'upload', label: 'Cargar conversaciones' },
  ],
  auditor: [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'reports', label: 'Reportes' },
    { id: 'monthly', label: 'Evaluación mensual' },
    { id: 'agents', label: 'Agentes' },
    { id: 'checklist', label: 'Checklist' },
    { id: 'upload', label: 'Cargar conversaciones' },
    { id: 'users', label: 'Gestión de usuarios' },
  ],
  direccion: [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'reports', label: 'Reportes' },
  ]
}

export default function App() {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token')
    const rol = localStorage.getItem('rol')
    const nombre = localStorage.getItem('nombre')
    return token ? { token, rol, nombre } : null
  })
  const [page, setPage] = useState('dashboard')

  const handleLogin = (data) => { setUser(data); setPage('dashboard') }
  const handleLogout = () => { localStorage.clear(); setUser(null); setPage('dashboard') }

  if (!user) return <Login onLogin={handleLogin} />

  const menu = menuPorRol[user.rol] || menuPorRol.supervisor
  const paginaPermitida = menu.some(item => item.id === page)
  const paginaActual = paginaPermitida ? page : 'dashboard'

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar nombre={user.nombre} rol={user.rol} onLogout={handleLogout} />
      <div className="flex">
        <aside className="w-56 min-h-screen bg-white shadow-sm pt-6 border-r border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 mb-2">Menú</p>
          {menu.map(item => (
            <button key={item.id} onClick={() => setPage(item.id)}
              className={`w-full text-left px-5 py-3 text-sm transition ${
                paginaActual === item.id
                  ? 'bg-blue-50 text-blue-700 font-medium border-r-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}>
              {item.label}
            </button>
          ))}
        </aside>
        <main className="flex-1 p-6">
          {paginaActual === 'dashboard' && <Dashboard />}
          {paginaActual === 'reports' && <Reports />}
          {paginaActual === 'monthly' && <MonthlyEval />}
          {paginaActual === 'agents' && <Agents />}
          {paginaActual === 'checklist' && <Checklist />}
          {paginaActual === 'upload' && <Upload />}
          {paginaActual === 'users' && <Users />}
        </main>
      </div>
    </div>
  )
}