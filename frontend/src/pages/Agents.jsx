import { useState, useEffect } from 'react'
import API from '../services/api'

export default function Agents() {
  const [agents, setAgents] = useState([])
  const [form, setForm] = useState({ nombre: '', codigo: '', email: '', area: '', nombre_leadsales: '', autorizado_cobros: false })
  const [editando, setEditando] = useState(null)
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState('')

  const cargar = async () => {
    const res = await API.get('/agents/')
    setAgents(res.data)
  }

  useEffect(() => { cargar() }, [])

  const mostrarMensaje = (msg) => {
    setMensaje(msg)
    setTimeout(() => setMensaje(''), 3000)
  }

  const handleSubmit = async () => {
    if (!form.nombre || !form.codigo) {
      mostrarMensaje('El nombre y el código son obligatorios')
      return
    }
    setLoading(true)
    try {
      await API.post('/agents/', form)
      mostrarMensaje('Agente creado correctamente')
      setForm({ nombre: '', codigo: '', email: '', area: '', nombre_leadsales: '', autorizado_cobros: false })
      cargar()
    } catch (err) {
      mostrarMensaje('Error al crear el agente. Verifica que el código no exista.')
    } finally { setLoading(false) }
  }

  const handleGuardarEdicion = async () => {
    setLoading(true)
    try {
      await API.put(`/agents/${editando.id}`, {
        nombre: editando.nombre,
        email: editando.email,
        area: editando.area,
        activo: editando.activo,
        nombre_leadsales: editando.nombre_leadsales,
        autorizado_cobros: editando.autorizado_cobros
      })
      mostrarMensaje('Agente actualizado correctamente')
      setEditando(null)
      cargar()
    } catch {
      mostrarMensaje('Error al actualizar')
    } finally { setLoading(false) }
  }

  const toggleActivo = async (agent) => {
    await API.put(`/agents/${agent.id}`, { activo: !agent.activo })
    cargar()
  }

  const toggleCobros = async (agent) => {
    await API.put(`/agents/${agent.id}`, { autorizado_cobros: !agent.autorizado_cobros })
    cargar()
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">Gestión de agentes</h2>
        <p className="text-sm text-gray-500 mt-0.5">Administra los agentes y sus permisos de cobro</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Nuevo agente</h3>
        <div className="grid grid-cols-2 gap-3">
          <input placeholder="Nombre completo *" value={form.nombre}
            onChange={e => setForm({...form, nombre: e.target.value})}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          <input placeholder="Código (ej. AG002) *" value={form.codigo}
            onChange={e => setForm({...form, codigo: e.target.value})}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          <input placeholder="Correo electrónico" value={form.email}
            onChange={e => setForm({...form, email: e.target.value})}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          <input placeholder="Área" value={form.area}
            onChange={e => setForm({...form, area: e.target.value})}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          <input placeholder="Nombre en Leadsales (ej. valeria perez)" value={form.nombre_leadsales}
            onChange={e => setForm({...form, nombre_leadsales: e.target.value})}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          <div className="flex items-center gap-3 border border-gray-300 rounded-lg px-3 py-2">
            <input type="checkbox" id="autorizado_nuevo"
              checked={form.autorizado_cobros}
              onChange={e => setForm({...form, autorizado_cobros: e.target.checked})}
              className="w-4 h-4 accent-blue-600" />
            <label htmlFor="autorizado_nuevo" className="text-sm text-gray-700">
              Autorizado para cobros
            </label>
          </div>
        </div>
        {mensaje && <p className="text-sm mt-2 text-blue-600">{mensaje}</p>}
        <button onClick={handleSubmit} disabled={loading}
          className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition disabled:opacity-50">
          {loading ? 'Guardando...' : 'Agregar agente'}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Lista de agentes</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {agents.map(a => (
            <div key={a.id}>
              {editando?.id === a.id ? (
                <div className="px-5 py-4 bg-blue-50">
                  <p className="text-xs font-semibold text-blue-700 mb-3">Editando agente</p>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <input value={editando.nombre}
                      onChange={e => setEditando({...editando, nombre: e.target.value})}
                      placeholder="Nombre"
                      className="border border-blue-300 rounded-lg px-3 py-2 text-sm" />
                    <input value={editando.email || ''}
                      onChange={e => setEditando({...editando, email: e.target.value})}
                      placeholder="Correo"
                      className="border border-blue-300 rounded-lg px-3 py-2 text-sm" />
                    <input value={editando.area || ''}
                      onChange={e => setEditando({...editando, area: e.target.value})}
                      placeholder="Área"
                      className="border border-blue-300 rounded-lg px-3 py-2 text-sm" />
                    <input value={editando.nombre_leadsales || ''}
                      onChange={e => setEditando({...editando, nombre_leadsales: e.target.value})}
                      placeholder="Nombre en Leadsales"
                      className="border border-blue-300 rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div className="flex items-center gap-4 mb-3">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input type="checkbox"
                        checked={editando.activo}
                        onChange={e => setEditando({...editando, activo: e.target.checked})}
                        className="w-4 h-4 accent-blue-600" />
                      Activo
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input type="checkbox"
                        checked={editando.autorizado_cobros}
                        onChange={e => setEditando({...editando, autorizado_cobros: e.target.checked})}
                        className="w-4 h-4 accent-green-600" />
                      Autorizado para cobros
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleGuardarEdicion} disabled={loading}
                      className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-blue-700">
                      Guardar
                    </button>
                    <button onClick={() => setEditando(null)}
                      className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-xs">
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                      {a.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{a.nombre}</p>
                      <p className="text-xs text-gray-500">{a.email || 'Sin correo'} · {a.area || 'Sin área'}</p>
                      {a.nombre_leadsales && (
                        <p className="text-xs text-blue-500 mt-0.5">
                          Leadsales: <span className="font-medium">{a.nombre_leadsales}</span>
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.activo ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                        {a.activo ? 'Activo' : 'Inactivo'}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.autorizado_cobros ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                        {a.autorizado_cobros ? '💳 Autorizado cobros' : 'Sin autorización de cobros'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleCobros(a)}
                      className={`text-xs px-3 py-1.5 rounded-lg transition ${a.autorizado_cobros ? 'bg-orange-50 text-orange-700 hover:bg-orange-100' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}>
                      {a.autorizado_cobros ? 'Quitar cobros' : 'Autorizar cobros'}
                    </button>
                    <button onClick={() => toggleActivo(a)}
                      className={`text-xs px-3 py-1.5 rounded-lg transition ${a.activo ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>
                      {a.activo ? 'Desactivar' : 'Activar'}
                    </button>
                    <button onClick={() => setEditando({...a})}
                      className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition">
                      Editar
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