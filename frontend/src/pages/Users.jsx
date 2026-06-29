import { useState, useEffect } from 'react'
import API from '../services/api'

const ROLES = ['admin', 'supervisor', 'auditor', 'direccion']

const rolColor = (rol) => {
  const map = {
    admin: 'bg-purple-50 text-purple-700',
    supervisor: 'bg-blue-50 text-blue-700',
    auditor: 'bg-orange-50 text-orange-700',
    direccion: 'bg-green-50 text-green-700'
  }
  return map[rol] || 'bg-gray-50 text-gray-600'
}

const rolTexto = (rol) => {
  const map = {
    admin: 'Administrador',
    supervisor: 'Supervisor',
    auditor: 'Auditor',
    direccion: 'Dirección'
  }
  return map[rol] || rol
}

export default function Users() {
  const [users, setUsers] = useState([])
  const [form, setForm] = useState({ nombre: '', email: '', password: '', rol: 'supervisor' })
  const [editando, setEditando] = useState(null)
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [confirmarEliminar, setConfirmarEliminar] = useState(null)

  const cargar = async () => {
    const res = await API.get('/users/')
    setUsers(res.data)
  }

  useEffect(() => { cargar() }, [])

  const mostrarMensaje = (msg, esError = false) => {
    if (esError) setError(msg)
    else setMensaje(msg)
    setTimeout(() => { setMensaje(''); setError('') }, 3000)
  }

  const handleCrear = async () => {
    if (!form.nombre || !form.email || !form.password) {
      mostrarMensaje('Nombre, correo y contraseña son obligatorios', true)
      return
    }
    setLoading(true)
    try {
      await API.post('/users/', form)
      mostrarMensaje('Usuario creado correctamente')
      setForm({ nombre: '', email: '', password: '', rol: 'supervisor' })
      cargar()
    } catch (err) {
      mostrarMensaje(err.response?.data?.detail || 'Error al crear usuario', true)
    } finally { setLoading(false) }
  }

  const handleGuardarEdicion = async () => {
    setLoading(true)
    try {
      await API.put(`/users/${editando.id}`, {
        nombre: editando.nombre,
        email: editando.email,
        rol: editando.rol,
        activo: editando.activo,
        password: editando.nuevaPassword || undefined
      })
      mostrarMensaje('Usuario actualizado correctamente')
      setEditando(null)
      cargar()
    } catch (err) {
      mostrarMensaje(err.response?.data?.detail || 'Error al actualizar', true)
    } finally { setLoading(false) }
  }

  const handleEliminar = async (id) => {
    try {
      await API.delete(`/users/${id}`)
      mostrarMensaje('Usuario eliminado correctamente')
      setConfirmarEliminar(null)
      cargar()
    } catch {
      mostrarMensaje('Error al eliminar usuario', true)
    }
  }

  const toggleActivo = async (user) => {
    try {
      await API.put(`/users/${user.id}`, { activo: !user.activo })
      cargar()
    } catch {
      mostrarMensaje('Error al actualizar estado', true)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">Gestión de usuarios</h2>
        <p className="text-sm text-gray-500 mt-0.5">Administra los usuarios y sus roles en el sistema</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Nuevo usuario</h3>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <input placeholder="Nombre completo *" value={form.nombre}
            onChange={e => setForm({...form, nombre: e.target.value})}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          <input placeholder="Correo electrónico *" value={form.email}
            onChange={e => setForm({...form, email: e.target.value})}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          <input type="password" placeholder="Contraseña *" value={form.password}
            onChange={e => setForm({...form, password: e.target.value})}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          <select value={form.rol} onChange={e => setForm({...form, rol: e.target.value})}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            {ROLES.map(r => <option key={r} value={r}>{rolTexto(r)}</option>)}
          </select>
        </div>
        {mensaje && <p className="text-sm text-green-600 mb-2">{mensaje}</p>}
        {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
        <button onClick={handleCrear} disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition disabled:opacity-50">
          {loading ? 'Guardando...' : 'Crear usuario'}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Usuarios registrados</h3>
          <span className="text-xs text-gray-400">{users.length} usuarios</span>
        </div>
        <div className="divide-y divide-gray-50">
          {users.map(user => (
            <div key={user.id}>
              {editando?.id === user.id ? (
                <div className="px-5 py-4 bg-blue-50">
                  <p className="text-xs font-semibold text-blue-700 mb-3">Editando usuario</p>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <input value={editando.nombre}
                      onChange={e => setEditando({...editando, nombre: e.target.value})}
                      placeholder="Nombre"
                      className="border border-blue-300 rounded-lg px-3 py-2 text-sm" />
                    <input value={editando.email}
                      onChange={e => setEditando({...editando, email: e.target.value})}
                      placeholder="Correo"
                      className="border border-blue-300 rounded-lg px-3 py-2 text-sm" />
                    <select value={editando.rol}
                      onChange={e => setEditando({...editando, rol: e.target.value})}
                      className="border border-blue-300 rounded-lg px-3 py-2 text-sm">
                      {ROLES.map(r => <option key={r} value={r}>{rolTexto(r)}</option>)}
                    </select>
                    <input type="password"
                      value={editando.nuevaPassword || ''}
                      onChange={e => setEditando({...editando, nuevaPassword: e.target.value})}
                      placeholder="Nueva contraseña (opcional)"
                      className="border border-blue-300 rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input type="checkbox"
                        checked={editando.activo}
                        onChange={e => setEditando({...editando, activo: e.target.checked})}
                        className="rounded" />
                      Usuario activo
                    </label>
                    <button onClick={handleGuardarEdicion} disabled={loading}
                      className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-blue-700 transition">
                      Guardar cambios
                    </button>
                    <button onClick={() => setEditando(null)}
                      className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-xs hover:bg-gray-200 transition">
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : confirmarEliminar === user.id ? (
                <div className="px-5 py-4 bg-red-50">
                  <p className="text-sm font-medium text-red-700 mb-3">
                    ¿Eliminar a <strong>{user.nombre}</strong>? Esta acción no se puede deshacer.
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => handleEliminar(user.id)}
                      className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-red-700 transition">
                      Sí, eliminar
                    </button>
                    <button onClick={() => setConfirmarEliminar(null)}
                      className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-xs hover:bg-gray-200 transition">
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                      {user.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{user.nombre}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${rolColor(user.rol)}`}>
                      {rolTexto(user.rol)}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${user.activo ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                      {user.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleActivo(user)}
                      className={`text-xs px-3 py-1.5 rounded-lg transition ${user.activo ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>
                      {user.activo ? 'Desactivar' : 'Activar'}
                    </button>
                    <button onClick={() => setEditando({...user, nuevaPassword: ''})}
                      className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition">
                      Editar
                    </button>
                    <button onClick={() => setConfirmarEliminar(user.id)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition">
                      Eliminar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}