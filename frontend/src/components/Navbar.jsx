export default function Navbar({ nombre, rol, onLogout }) {
  const rolTexto = {
    admin: 'Administrador',
    supervisor: 'Supervisor',
    direccion: 'Dirección'
  }

  return (
    <nav className="bg-blue-700 text-white px-6 py-3 flex items-center justify-between shadow">
      <div className="flex items-center gap-3">
        <span className="font-bold text-lg">Sistema de Supervisión</span>
        <span className="bg-blue-600 text-blue-100 text-xs px-2 py-0.5 rounded-full">
          {rolTexto[rol] || rol}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-blue-100">{nombre}</span>
        <button
          onClick={onLogout}
          className="bg-blue-800 hover:bg-blue-900 text-white text-sm px-3 py-1 rounded-lg transition">
          Cerrar sesión
        </button>
      </div>
    </nav>
  )
}