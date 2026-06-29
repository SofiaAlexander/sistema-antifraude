import { useState, useEffect } from 'react'
import API from '../services/api'

const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
               'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const MAX_CHATS = 5

export default function PegarConversacion() {
  const [agents, setAgents] = useState([])
  const [agentId, setAgentId] = useState('')
  const [mes, setMes] = useState(new Date().getMonth() + 1)
  const [anio, setAnio] = useState(new Date().getFullYear())
  const [chats, setChats] = useState([
    { cliente: '', fecha: new Date().toISOString().split('T')[0], texto: '', resultado: null }
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [analizados, setAnalizados] = useState(0)

  useEffect(() => {
    API.get('/agents/').then(res => setAgents(res.data.filter(a => a.activo)))
  }, [])

  const agregarChat = () => {
    if (chats.length >= MAX_CHATS) return
    setChats([...chats, { cliente: '', fecha: new Date().toISOString().split('T')[0], texto: '', resultado: null }])
  }

  const eliminarChat = (i) => {
    setChats(chats.filter((_, idx) => idx !== i))
  }

  const actualizarChat = (i, campo, valor) => {
    const nuevos = [...chats]
    nuevos[i][campo] = valor
    setChats(nuevos)
  }

  const analizarTodos = async () => {
    if (!agentId) { setError('Selecciona un agente'); return }
    const vacios = chats.filter(c => !c.texto.trim())
    if (vacios.length === chats.length) { setError('Pega al menos una conversación'); return }
    setError('')
    setLoading(true)
    setAnalizados(0)

    const nuevos = [...chats]
    let count = 0

    for (let i = 0; i < nuevos.length; i++) {
      if (!nuevos[i].texto.trim()) continue
      try {
        const res = await API.post('/conversations/pegar', {
          agent_id: Number(agentId),
          mes,
          anio,
          cliente: nuevos[i].cliente || `Cliente ${i + 1}`,
          fecha: nuevos[i].fecha,
          texto: nuevos[i].texto
        })
        nuevos[i].resultado = res.data
        count++
        setAnalizados(count)
        setChats([...nuevos])
      } catch (err) {
        nuevos[i].resultado = { error: 'Error al analizar esta conversación' }
        setChats([...nuevos])
      }
    }
    setLoading(false)
  }

  const getColor = (p) => {
    if (p >= 80) return 'text-green-600'
    if (p >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">Pegar conversaciones</h2>
        <p className="text-sm text-gray-500 mt-0.5">Copia y pega hasta {MAX_CHATS} conversaciones directamente desde Leadsales</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Agente</label>
            <select value={agentId} onChange={e => setAgentId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="">Seleccionar agente...</option>
              {agents.map(a => <option key={a.id} value={a.id}>{a.nombre} ({a.codigo})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Mes</label>
            <select value={mes} onChange={e => setMes(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              {meses.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Año</label>
            <select value={anio} onChange={e => setAnio(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              {[2024,2025,2026].map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        {chats.map((chat, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
              <span className="text-sm font-semibold text-gray-700">Chat {i + 1}</span>
              {chats.length > 1 && (
                <button onClick={() => eliminarChat(i)}
                  className="text-red-400 hover:text-red-600 text-xs">Eliminar</button>
              )}
            </div>

            <div className="p-4">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nombre del cliente</label>
                  <input placeholder="Ej. Juan Pérez"
                    value={chat.cliente}
                    onChange={e => actualizarChat(i, 'cliente', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Fecha</label>
                  <input type="date"
                    value={chat.fecha}
                    onChange={e => actualizarChat(i, 'fecha', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Pega aquí la conversación copiada de Leadsales
                </label>
                <textarea
                  placeholder="Copia y pega el texto completo de la conversación tal como aparece en Leadsales..."
                  value={chat.texto}
                  onChange={e => actualizarChat(i, 'texto', e.target.value)}
                  rows={6}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none font-mono text-xs" />
                <p className="text-xs text-gray-400 mt-1">{chat.texto.length} caracteres</p>
              </div>

              {chat.resultado && !chat.resultado.error && (
                <div className="mt-4 border border-gray-100 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-gray-700">Resultado del análisis</p>
                    <p className={`text-2xl font-bold ${getColor(chat.resultado.puntuacion)}`}>
                      {chat.resultado.puntuacion}%
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="bg-green-50 rounded-lg p-2">
                      <p className="text-xs font-medium text-green-700 mb-1">Obligatorias encontradas</p>
                      {chat.resultado.palabras_obligatorias_encontradas.length > 0 ? (
                        chat.resultado.palabras_obligatorias_encontradas.map((p, j) => (
                          <span key={j} className="inline-block bg-green-100 text-green-800 text-xs px-1.5 py-0.5 rounded-full mr-1 mb-1">{p}</span>
                        ))
                      ) : <p className="text-xs text-green-600">Ninguna</p>}
                    </div>
                    <div className="bg-red-50 rounded-lg p-2">
                      <p className="text-xs font-medium text-red-700 mb-1">Obligatorias faltantes</p>
                      {chat.resultado.palabras_obligatorias_faltantes.length > 0 ? (
                        chat.resultado.palabras_obligatorias_faltantes.map((p, j) => (
                          <span key={j} className="inline-block bg-red-100 text-red-800 text-xs px-1.5 py-0.5 rounded-full mr-1 mb-1">{p}</span>
                        ))
                      ) : <p className="text-xs text-red-600">Ninguna</p>}
                    </div>
                    <div className="bg-orange-50 rounded-lg p-2">
                      <p className="text-xs font-medium text-orange-700 mb-1">Prohibidas encontradas</p>
                      {chat.resultado.palabras_prohibidas_encontradas.length > 0 ? (
                        chat.resultado.palabras_prohibidas_encontradas.map((p, j) => (
                          <span key={j} className="inline-block bg-orange-100 text-orange-800 text-xs px-1.5 py-0.5 rounded-full mr-1 mb-1">{p}</span>
                        ))
                      ) : <p className="text-xs text-orange-600">Ninguna</p>}
                    </div>
                  </div>

                  {Object.keys(chat.resultado.frecuencias).length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-gray-600 mb-1">Frecuencia de palabras clave</p>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(chat.resultado.frecuencias).map(([palabra, freq], j) => (
                          <span key={j} className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                            {palabra} <strong>x{freq}</strong>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    {chat.resultado.detalle.map((d, j) => (
                      <div key={j} className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs ${d.cumplido ? 'bg-green-50' : 'bg-red-50'}`}>
                        <span className={`font-medium ${d.cumplido ? 'text-green-700' : 'text-red-700'}`}>{d.criterio}</span>
                        <span className={d.cumplido ? 'text-green-600' : 'text-red-500'}>
                          {d.cumplido ? 'Cumplido' : 'No cumplido'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {chat.resultado?.error && (
                <p className="mt-2 text-sm text-red-600">{chat.resultado.error}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 mb-6">
        {chats.length < MAX_CHATS && (
          <button onClick={agregarChat}
            className="border border-blue-300 text-blue-600 px-4 py-2 rounded-lg text-sm hover:bg-blue-50 transition">
            + Agregar otro chat ({chats.length}/{MAX_CHATS})
          </button>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {loading && <p className="text-sm text-blue-600">Analizando... {analizados} conversación(es) procesadas</p>}
      </div>

      <button onClick={analizarTodos} disabled={loading}
        className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm hover:bg-blue-700 transition disabled:opacity-50 font-medium">
        {loading ? 'Analizando...' : `Analizar ${chats.filter(c => c.texto.trim()).length} conversación(es)`}
      </button>
    </div>
  )
}