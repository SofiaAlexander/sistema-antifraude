import { useState, useEffect } from 'react'
import API from '../services/api'

const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
               'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const MAX_CHATS = 5

const getColor = (p) => {
  if (p >= 80) return 'text-green-600'
  if (p >= 60) return 'text-yellow-600'
  return 'text-red-600'
}

function AlertaFraude({ palabras }) {
  if (!palabras || palabras.length === 0) return null
  return (
    <div className="bg-red-50 border border-red-300 rounded-xl p-4 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-red-600 text-lg">🚨</span>
        <p className="font-bold text-red-700 text-sm">ALERTA DE FRAUDE — Palabras prohibidas detectadas</p>
      </div>
      <p className="text-xs text-red-600 mb-2">Este agente usó palabras o frases que indican posible uso de métodos de pago no autorizados:</p>
      <div className="flex flex-wrap gap-2">
        {palabras.map((p, i) => (
          <span key={i} className="bg-red-100 text-red-800 text-xs px-3 py-1 rounded-full font-semibold border border-red-200">
            ⚠️ {p}
          </span>
        ))}
      </div>
    </div>
  )
}

function ResultadoAnalisis({ r, mostrarAgente = false }) {
  const tieneAlertas = r.palabras_prohibidas_encontradas?.length > 0
  return (
    <div className={`rounded-xl overflow-hidden border ${tieneAlertas ? 'border-red-300' : 'border-gray-100'} shadow-sm`}>
      <div className={`px-5 py-3 border-b flex items-center justify-between ${tieneAlertas ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100'}`}>
        <div>
          {mostrarAgente && <p className="font-bold text-gray-800">{r.agente}</p>}
          {r.cliente && <p className="text-sm font-medium text-gray-700">Cliente: {r.cliente}</p>}
          {r.fecha && <p className="text-xs text-gray-500">Fecha: {r.fecha}</p>}
          {tieneAlertas && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full mt-1">
              🚨 ALERTA — Palabras prohibidas
            </span>
          )}
        </div>
        <div className="text-right">
          <p className={`text-3xl font-bold ${getColor(r.puntuacion)}`}>{r.puntuacion}%</p>
          <p className="text-xs text-gray-400">{r.items_cumplidos}/{r.items_total} criterios</p>
        </div>
      </div>

      <div className="p-4 bg-white">
        {tieneAlertas && <AlertaFraude palabras={r.palabras_prohibidas_encontradas} />}

        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="bg-green-50 rounded-lg p-3">
            <p className="text-xs font-medium text-green-700 mb-1">Obligatorias encontradas</p>
            {r.palabras_obligatorias_encontradas?.length > 0 ? (
              r.palabras_obligatorias_encontradas.map((p, j) => (
                <span key={j} className="inline-block bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full mr-1 mb-1">{p}</span>
              ))
            ) : <p className="text-xs text-green-600">Ninguna</p>}
          </div>
          <div className="bg-red-50 rounded-lg p-3">
            <p className="text-xs font-medium text-red-700 mb-1">Obligatorias faltantes</p>
            {r.palabras_obligatorias_faltantes?.length > 0 ? (
              r.palabras_obligatorias_faltantes.map((p, j) => (
                <span key={j} className="inline-block bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full mr-1 mb-1">{p}</span>
              ))
            ) : <p className="text-xs text-red-600">Ninguna</p>}
          </div>
          <div className={`rounded-lg p-3 ${tieneAlertas ? 'bg-red-100 border border-red-200' : 'bg-orange-50'}`}>
            <p className={`text-xs font-medium mb-1 ${tieneAlertas ? 'text-red-800' : 'text-orange-700'}`}>
              {tieneAlertas ? '🚨 Prohibidas detectadas' : 'Prohibidas encontradas'}
            </p>
            {r.palabras_prohibidas_encontradas?.length > 0 ? (
              r.palabras_prohibidas_encontradas.map((p, j) => (
                <span key={j} className="inline-block bg-red-200 text-red-900 text-xs px-2 py-0.5 rounded-full mr-1 mb-1 font-semibold">{p}</span>
              ))
            ) : <p className="text-xs text-orange-600">Ninguna</p>}
          </div>
        </div>

        {Object.keys(r.frecuencias || {}).length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-medium text-gray-600 mb-1">Frecuencia de palabras clave</p>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(r.frecuencias).map(([palabra, freq], j) => (
                <span key={j} className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                  {palabra} <strong>x{freq}</strong>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-600 mb-1">Detalle por criterio</p>
          {r.detalle?.map((d, j) => (
            <div key={j} className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs ${
              d.categoria === 'prohibida'
                ? d.cumplido ? 'bg-green-50' : 'bg-red-100 border border-red-200'
                : d.cumplido ? 'bg-green-50' : 'bg-red-50'
            }`}>
              <div className="flex items-center gap-2">
                <span className={`font-medium ${
                  d.categoria === 'prohibida'
                    ? d.cumplido ? 'text-green-700' : 'text-red-800'
                    : d.cumplido ? 'text-green-700' : 'text-red-700'
                }`}>{d.criterio}</span>
                <span className="text-gray-400 text-xs">{d.categoria}</span>
                {d.aplica === false && (
                  <span className="text-gray-400 text-xs italic">no aplica</span>
                )}
              </div>
              <span className={`font-medium ${
                d.categoria === 'prohibida'
                  ? d.cumplido ? 'text-green-600' : 'text-red-700'
                  : d.cumplido ? 'text-green-600' : 'text-red-500'
              }`}>
                {d.aplica === false
                  ? '— No aplica'
                  : d.categoria === 'prohibida'
                  ? d.cumplido ? '✅ Sin infracciones' : '🚨 Detectado'
                  : d.cumplido ? 'Cumplido' : 'No cumplido'
                }
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function TabLeadsales() {
  const [mes, setMes] = useState(new Date().getMonth() + 1)
  const [anio, setAnio] = useState(new Date().getFullYear())
  const [cliente, setCliente] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [texto, setTexto] = useState('')
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [error, setError] = useState('')
  const [agentes, setAgentes] = useState([])

  useEffect(() => {
    API.get('/agents/').then(res => setAgentes(res.data.filter(a => a.activo && a.nombre_leadsales)))
  }, [])

  const handleAnalizar = async () => {
    if (!texto.trim()) { setError('Pega el texto del chat'); return }
    if (!cliente.trim()) { setError('Escribe el nombre del cliente'); return }
    setError('')
    setLoading(true)
    setResultado(null)
    try {
      const res = await API.post('/conversations/leadsales', { mes, anio, cliente, fecha, texto })
      setResultado(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al analizar el chat')
    } finally { setLoading(false) }
  }

  const totalAlertas = resultado?.resultados?.reduce((sum, r) => sum + (r.palabras_prohibidas_encontradas?.length || 0), 0) || 0

  return (
    <div>
      {agentes.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
          <p className="text-sm font-medium text-yellow-800">⚠️ No hay agentes con nombre de Leadsales configurado</p>
          <p className="text-xs text-yellow-700 mt-1">Ve a <strong>Agentes</strong> y agrega el nombre exacto como aparece en Leadsales.</p>
        </div>
      )}
      {agentes.length > 0 && (
        <div className="bg-blue-50 rounded-xl p-3 mb-4">
          <p className="text-xs font-medium text-blue-700 mb-2">Agentes configurados:</p>
          <div className="flex flex-wrap gap-2">
            {agentes.map(a => (
              <span key={a.id} className="bg-white border border-blue-200 text-blue-700 text-xs px-3 py-1 rounded-full">
                {a.nombre} <span className="text-blue-400">→ "{a.nombre_leadsales}"</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Cliente</label>
            <input placeholder="Nombre del cliente" value={cliente}
              onChange={e => setCliente(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Fecha</label>
            <input type="date" value={fecha}
              onChange={e => setFecha(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Período</label>
            <div className="flex gap-2">
              <select value={mes} onChange={e => setMes(Number(e.target.value))}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {meses.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
              </select>
              <select value={anio} onChange={e => setAnio(Number(e.target.value))}
                className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {[2024,2025,2026].map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-600 mb-1">Pega el chat completo de Leadsales</label>
          <textarea value={texto} onChange={e => setTexto(e.target.value)}
            placeholder="Copia y pega el chat tal como aparece en Leadsales..."
            rows={10}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none font-mono text-xs" />
          <p className="text-xs text-gray-400 mt-1">{texto.length} caracteres</p>
        </div>
        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        <button onClick={handleAnalizar} disabled={loading || agentes.length === 0}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm hover:bg-blue-700 transition disabled:opacity-50 font-medium">
          {loading ? 'Analizando...' : 'Analizar chat'}
        </button>
      </div>

      {resultado && (
        <div className="space-y-4">
          <div className={`rounded-xl p-4 border ${totalAlertas > 0 ? 'bg-red-50 border-red-300' : 'bg-green-50 border-green-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`font-bold ${totalAlertas > 0 ? 'text-red-700' : 'text-green-700'}`}>
                  {totalAlertas > 0 ? `🚨 ${totalAlertas} alerta(s) de fraude detectadas` : '✅ Sin alertas de fraude'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {resultado.total_agentes} agente(s) · Cliente: {resultado.cliente} · {resultado.fecha}
                </p>
              </div>
            </div>
          </div>
          {resultado.resultados.map((r, i) => (
            <ResultadoAnalisis key={i} r={r} mostrarAgente={true} />
          ))}
        </div>
      )}
    </div>
  )
}

function TabPegar() {
  const [agents, setAgents] = useState([])
  const [agentId, setAgentId] = useState('')
  const [mes, setMes] = useState(new Date().getMonth() + 1)
  const [anio, setAnio] = useState(new Date().getFullYear())
  const [chats, setChats] = useState([{ cliente: '', fecha: new Date().toISOString().split('T')[0], texto: '', resultado: null }])
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

  const eliminarChat = (i) => setChats(chats.filter((_, idx) => idx !== i))

  const actualizarChat = (i, campo, valor) => {
    const nuevos = [...chats]
    nuevos[i][campo] = valor
    setChats(nuevos)
  }

  const analizarTodos = async () => {
    if (!agentId) { setError('Selecciona un agente'); return }
    if (chats.every(c => !c.texto.trim())) { setError('Pega al menos una conversación'); return }
    setError('')
    setLoading(true)
    setAnalizados(0)
    const nuevos = [...chats]
    let count = 0
    for (let i = 0; i < nuevos.length; i++) {
      if (!nuevos[i].texto.trim()) continue
      try {
        const res = await API.post('/conversations/pegar', {
          agent_id: Number(agentId), mes, anio,
          cliente: nuevos[i].cliente || `Cliente ${i + 1}`,
          fecha: nuevos[i].fecha,
          texto: nuevos[i].texto
        })
        nuevos[i].resultado = res.data
        count++
        setAnalizados(count)
        setChats([...nuevos])
      } catch {
        nuevos[i].resultado = { error: 'Error al analizar' }
        setChats([...nuevos])
      }
    }
    setLoading(false)
  }

  return (
    <div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
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

      <div className="space-y-4 mb-4">
        {chats.map((chat, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
              <span className="text-sm font-semibold text-gray-700">Chat {i + 1}</span>
              {chats.length > 1 && (
                <button onClick={() => eliminarChat(i)} className="text-red-400 hover:text-red-600 text-xs">Eliminar</button>
              )}
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Cliente</label>
                  <input placeholder="Nombre del cliente" value={chat.cliente}
                    onChange={e => actualizarChat(i, 'cliente', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Fecha</label>
                  <input type="date" value={chat.fecha}
                    onChange={e => actualizarChat(i, 'fecha', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <textarea placeholder="Pega la conversación aquí..."
                value={chat.texto}
                onChange={e => actualizarChat(i, 'texto', e.target.value)}
                rows={5}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none font-mono text-xs" />
              <p className="text-xs text-gray-400 mt-1">{chat.texto.length} caracteres</p>
              {chat.resultado && !chat.resultado.error && (
                <div className="mt-3">
                  <ResultadoAnalisis r={chat.resultado} />
                </div>
              )}
              {chat.resultado?.error && <p className="mt-2 text-sm text-red-600">{chat.resultado.error}</p>}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        {chats.length < MAX_CHATS && (
          <button onClick={agregarChat}
            className="border border-blue-300 text-blue-600 px-4 py-2 rounded-lg text-sm hover:bg-blue-50 transition">
            + Agregar chat ({chats.length}/{MAX_CHATS})
          </button>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {loading && <p className="text-sm text-blue-600">Analizando... {analizados} procesadas</p>}
      </div>
      <button onClick={analizarTodos} disabled={loading}
        className="mt-4 bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm hover:bg-blue-700 transition disabled:opacity-50 font-medium">
        {loading ? 'Analizando...' : `Analizar ${chats.filter(c => c.texto.trim()).length} conversación(es)`}
      </button>
    </div>
  )
}

function TabArchivo() {
  const [agents, setAgents] = useState([])
  const [agentId, setAgentId] = useState('')
  const [mes, setMes] = useState(new Date().getMonth() + 1)
  const [anio, setAnio] = useState(new Date().getFullYear())
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [resultados, setResultados] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    API.get('/agents/').then(res => setAgents(res.data.filter(a => a.activo)))
  }, [])

  const handleSubmit = async () => {
    if (!agentId || !file) { setError('Selecciona un agente y un archivo'); return }
    setLoading(true)
    setError('')
    setResultados(null)
    try {
      const formData = new FormData()
      formData.append('agent_id', agentId)
      formData.append('mes', mes)
      formData.append('anio', anio)
      formData.append('file', file)
      const res = await API.post('/conversations/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setResultados(res.data)
      setFile(null)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al procesar el archivo')
    } finally { setLoading(false) }
  }

  return (
    <div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Agente</label>
            <select value={agentId} onChange={e => setAgentId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="">Seleccionar agente...</option>
              {agents.map(a => <option key={a.id} value={a.id}>{a.nombre} ({a.codigo})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Período</label>
            <div className="flex gap-2">
              <select value={mes} onChange={e => setMes(Number(e.target.value))}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {meses.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
              </select>
              <select value={anio} onChange={e => setAnio(Number(e.target.value))}
                className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {[2024,2025,2026].map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-600 mb-1">Archivo (.txt, .csv, .xlsx)</label>
          <input type="file" accept=".txt,.csv,.xlsx"
            onChange={e => setFile(e.target.files[0])}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div className="bg-blue-50 rounded-lg p-3 mb-3 text-xs text-blue-700">
          <p className="font-medium mb-1">Formato esperado:</p>
          <p>.txt — bloques separados por === con cabecera AGENTE / FECHA / CLIENTE / ---</p>
          <p>.csv / .xlsx — columnas: agente, fecha, cliente, conversacion</p>
        </div>
        {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
        <button onClick={handleSubmit} disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition disabled:opacity-50">
          {loading ? 'Analizando...' : 'Cargar y analizar'}
        </button>
      </div>

      {resultados && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="font-semibold text-gray-800">{resultados.total} conversación(es) analizadas</p>
          </div>
          {resultados.resultados.map((r, i) => (
            <ResultadoAnalisis key={i} r={r} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function Upload() {
  const [tab, setTab] = useState('leadsales')

  const tabs = [
    { id: 'leadsales', label: 'Chat Leadsales', desc: 'Detección automática de agentes' },
    { id: 'pegar', label: 'Pegar conversación', desc: 'Hasta 5 chats por agente' },
    { id: 'archivo', label: 'Cargar archivo', desc: '.txt, .csv, .xlsx' },
  ]

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">Cargar conversaciones</h2>
        <p className="text-sm text-gray-500 mt-0.5">Elige el método de carga según tu fuente de datos</p>
      </div>

      <div className="flex gap-2 mb-6">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 px-4 py-3 rounded-xl text-sm text-left transition border ${
              tab === t.id
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}>
            <p className="font-medium">{t.label}</p>
            <p className={`text-xs mt-0.5 ${tab === t.id ? 'text-blue-100' : 'text-gray-400'}`}>{t.desc}</p>
          </button>
        ))}
      </div>

      {tab === 'leadsales' && <TabLeadsales />}
      {tab === 'pegar' && <TabPegar />}
      {tab === 'archivo' && <TabArchivo />}
    </div>
  )
}