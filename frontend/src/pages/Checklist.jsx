import { useState, useEffect } from 'react'
import API from '../services/api'

const CATEGORIAS = ['general','saludo','seguimiento','cierre','prohibida','obligatoria']

const colorCategoria = (cat) => {
  const map = {
    saludo: 'bg-blue-50 text-blue-700',
    seguimiento: 'bg-purple-50 text-purple-700',
    cierre: 'bg-green-50 text-green-700',
    prohibida: 'bg-red-50 text-red-700',
    obligatoria: 'bg-orange-50 text-orange-700',
    general: 'bg-gray-100 text-gray-600'
  }
  return map[cat] || map.general
}

export default function Checklist() {
  const [items, setItems] = useState([])
  const [filtro, setFiltro] = useState('todos')
  const [form, setForm] = useState({ criterio: '', descripcion: '', categoria: 'general' })
  const [kwForm, setKwForm] = useState({ palabra: '', tipo: 'palabra', categoria: 'general', activa: true })
  const [editingItem, setEditingItem] = useState(null)
  const [editingKw, setEditingKw] = useState(null)
  const [activeItem, setActiveItem] = useState(null)
  const [mensaje, setMensaje] = useState('')
  const [loading, setLoading] = useState(false)

  const cargar = async () => {
    const res = await API.get('/checklist/')
    setItems(res.data)
  }

  useEffect(() => { cargar() }, [])

  const mostrarMensaje = (msg) => {
    setMensaje(msg)
    setTimeout(() => setMensaje(''), 3000)
  }

  const crearItem = async () => {
    if (!form.criterio) { mostrarMensaje('El criterio es obligatorio'); return }
    setLoading(true)
    try {
      await API.post('/checklist/', { ...form, keywords: [] })
      setForm({ criterio: '', descripcion: '', categoria: 'general' })
      mostrarMensaje('Criterio creado correctamente')
      cargar()
    } catch { mostrarMensaje('Error al crear el criterio') }
    finally { setLoading(false) }
  }

  const guardarEdicionItem = async () => {
    try {
      await API.put(`/checklist/${editingItem.id}`, {
        criterio: editingItem.criterio,
        descripcion: editingItem.descripcion,
        categoria: editingItem.categoria
      })
      setEditingItem(null)
      mostrarMensaje('Criterio actualizado')
      cargar()
    } catch { mostrarMensaje('Error al actualizar') }
  }

  const eliminarItem = async (id) => {
    if (!confirm('¿Eliminar este criterio y todas sus palabras clave?')) return
    await API.delete(`/checklist/${id}`)
    if (activeItem === id) setActiveItem(null)
    mostrarMensaje('Criterio eliminado')
    cargar()
  }

  const agregarKeyword = async (itemId) => {
    if (!kwForm.palabra) { mostrarMensaje('Escribe una palabra o frase'); return }
    try {
      await API.post(`/checklist/${itemId}/keywords`, kwForm)
      setKwForm({ palabra: '', tipo: 'palabra', categoria: 'general', activa: true })
      mostrarMensaje('Palabra clave agregada')
      cargar()
    } catch { mostrarMensaje('Error al agregar') }
  }

  const guardarEdicionKw = async () => {
    try {
      await API.put(`/checklist/keywords/${editingKw.id}`, {
        palabra: editingKw.palabra,
        tipo: editingKw.tipo,
        categoria: editingKw.categoria,
        activa: editingKw.activa
      })
      setEditingKw(null)
      mostrarMensaje('Palabra clave actualizada')
      cargar()
    } catch { mostrarMensaje('Error al actualizar') }
  }

  const eliminarKeyword = async (kwId) => {
    if (!confirm('¿Eliminar esta palabra clave?')) return
    await API.delete(`/checklist/keywords/${kwId}`)
    mostrarMensaje('Palabra clave eliminada')
    cargar()
  }

  const toggleKeyword = async (kw) => {
    try {
      await API.put(`/checklist/keywords/${kw.id}`, { activa: !kw.activa })
      mostrarMensaje(kw.activa ? 'Cuenta desactivada' : 'Cuenta activada')
      cargar()
    } catch { mostrarMensaje('Error al actualizar') }
  }

  const itemsFiltrados = filtro === 'todos' ? items : items.filter(i => i.categoria === filtro)

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">Gestión de checklist</h2>
        <p className="text-sm text-gray-500 mt-0.5">Administra los criterios y palabras clave de evaluación</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Nuevo criterio</h3>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <input placeholder="Criterio *" value={form.criterio}
            onChange={e => setForm({...form, criterio: e.target.value})}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm col-span-2" />
          <select value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <input placeholder="Descripción (opcional)" value={form.descripcion}
          onChange={e => setForm({...form, descripcion: e.target.value})}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3" />
        {mensaje && <p className="text-sm text-blue-600 mb-2">{mensaje}</p>}
        <button onClick={crearItem} disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition disabled:opacity-50">
          {loading ? 'Guardando...' : 'Agregar criterio'}
        </button>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {['todos', ...CATEGORIAS].map(c => (
          <button key={c} onClick={() => setFiltro(c)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition ${filtro === c ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {c}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {itemsFiltrados.map(item => (
          <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-4">
              {editingItem?.id === item.id ? (
                <div className="space-y-2">
                  <input value={editingItem.criterio}
                    onChange={e => setEditingItem({...editingItem, criterio: e.target.value})}
                    className="w-full border border-blue-300 rounded-lg px-3 py-1.5 text-sm" />
                  <input value={editingItem.descripcion || ''}
                    onChange={e => setEditingItem({...editingItem, descripcion: e.target.value})}
                    placeholder="Descripción"
                    className="w-full border border-blue-300 rounded-lg px-3 py-1.5 text-sm" />
                  <select value={editingItem.categoria}
                    onChange={e => setEditingItem({...editingItem, categoria: e.target.value})}
                    className="border border-blue-300 rounded-lg px-3 py-1.5 text-sm">
                    {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <div className="flex gap-2">
                    <button onClick={guardarEdicionItem} className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs hover:bg-blue-700">Guardar</button>
                    <button onClick={() => setEditingItem(null)} className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg text-xs hover:bg-gray-200">Cancelar</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-800">{item.criterio}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${colorCategoria(item.categoria)}`}>{item.categoria}</span>
                    </div>
                    {item.descripcion && <p className="text-xs text-gray-500 mb-2">{item.descripcion}</p>}
                    <div className="flex flex-wrap gap-1.5">
                      {item.keywords.map(k => (
                        <span key={k.id} className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          !k.activa
                            ? 'bg-gray-100 text-gray-400'
                            : k.categoria === 'prohibida'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-blue-50 text-blue-700'
                        }`}>
                          {!k.activa && <span className="line-through">{k.palabra}</span>}
                          {k.activa && <span>{k.tipo === 'frase' ? '""' : ''}{k.palabra}</span>}
                          {k.categoria === 'obligatoria' && (
                            <button onClick={() => toggleKeyword(k)}
                              title={k.activa ? 'Desactivar cuenta' : 'Activar cuenta'}
                              className={`ml-1 text-xs font-bold ${k.activa ? 'text-green-600 hover:text-red-500' : 'text-gray-400 hover:text-green-500'}`}>
                              {k.activa ? '●' : '○'}
                            </button>
                          )}
                          <button onClick={() => setEditingKw({...k})} className="hover:opacity-70 ml-1">✏</button>
                          <button onClick={() => eliminarKeyword(k.id)} className="hover:opacity-70">×</button>
                        </span>
                      ))}
                    </div>
                    {item.categoria === 'obligatoria' && item.keywords.length > 0 && (
                      <p className="text-xs text-gray-400 mt-2">● activa &nbsp;○ inactiva — clic en el círculo para activar/desactivar</p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-3">
                    <button onClick={() => setActiveItem(activeItem === item.id ? null : item.id)}
                      className="text-blue-500 hover:text-blue-700 text-xs">+ Palabra</button>
                    <button onClick={() => setEditingItem({...item})}
                      className="text-gray-400 hover:text-gray-600 text-xs">Editar</button>
                    <button onClick={() => eliminarItem(item.id)}
                      className="text-red-400 hover:text-red-600 text-xs">Eliminar</button>
                  </div>
                </div>
              )}
            </div>

            {activeItem === item.id && (
              <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 rounded-b-xl">
                <p className="text-xs font-medium text-gray-600 mb-2">Agregar palabra o frase clave</p>
                <div className="flex gap-2 flex-wrap">
                  <input placeholder="Palabra o frase" value={kwForm.palabra}
                    onChange={e => setKwForm({...kwForm, palabra: e.target.value})}
                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm flex-1 min-w-32" />
                  <select value={kwForm.tipo} onChange={e => setKwForm({...kwForm, tipo: e.target.value})}
                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
                    <option value="palabra">Palabra</option>
                    <option value="frase">Frase</option>
                  </select>
                  <select value={kwForm.categoria} onChange={e => setKwForm({...kwForm, categoria: e.target.value})}
                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
                    {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <button onClick={() => agregarKeyword(item.id)}
                    className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700">
                    Agregar
                  </button>
                </div>
              </div>
            )}

            {editingKw && editingKw.item_id === item.id && (
              <div className="border-t border-gray-100 px-4 py-3 bg-yellow-50 rounded-b-xl">
                <p className="text-xs font-medium text-gray-600 mb-2">Editar palabra clave</p>
                <div className="flex gap-2 flex-wrap items-center">
                  <input value={editingKw.palabra}
                    onChange={e => setEditingKw({...editingKw, palabra: e.target.value})}
                    className="border border-yellow-300 rounded-lg px-3 py-1.5 text-sm flex-1 min-w-32" />
                  <select value={editingKw.tipo} onChange={e => setEditingKw({...editingKw, tipo: e.target.value})}
                    className="border border-yellow-300 rounded-lg px-3 py-1.5 text-sm">
                    <option value="palabra">Palabra</option>
                    <option value="frase">Frase</option>
                  </select>
                  <select value={editingKw.categoria} onChange={e => setEditingKw({...editingKw, categoria: e.target.value})}
                    className="border border-yellow-300 rounded-lg px-3 py-1.5 text-sm">
                    {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <label className="flex items-center gap-1.5 text-xs text-gray-700">
                    <input type="checkbox"
                      checked={editingKw.activa}
                      onChange={e => setEditingKw({...editingKw, activa: e.target.checked})}
                      className="accent-blue-600" />
                    Activa
                  </label>
                  <button onClick={guardarEdicionKw} className="bg-yellow-500 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-yellow-600">Guardar</button>
                  <button onClick={() => setEditingKw(null)} className="bg-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-sm">Cancelar</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}