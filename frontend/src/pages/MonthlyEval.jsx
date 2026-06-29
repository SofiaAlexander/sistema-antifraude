import { useState, useEffect } from 'react'
import API from '../services/api'

const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
               'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const criterios = [
  { key: 'velocidad_respuesta', label: 'Velocidad de respuesta', desc: 'Qué tan rápido atiende al cliente' },
  { key: 'capacidad_trabajo', label: 'Capacidad de trabajo', desc: 'Volumen y eficiencia general' },
  { key: 'uso_plantillas', label: 'Uso de plantillas', desc: 'Usa respuestas rápidas correctamente' },
  { key: 'resolucion_primer_contacto', label: 'Resolución en primer contacto', desc: 'Resuelve sin escalar' },
  { key: 'actitud_trato', label: 'Actitud y trato al cliente', desc: 'Amabilidad y empatía' },
  { key: 'conocimiento_producto', label: 'Conocimiento del producto', desc: 'Sabe lo que vende u ofrece' }
]

const nivelColor = (nivel) => {
  const map = {
    'Excelente': 'text-green-600 bg-green-50',
    'Bueno': 'text-blue-600 bg-blue-50',
    'Regular': 'text-yellow-600 bg-yellow-50',
    'Deficiente': 'text-red-600 bg-red-50'
  }
  return map[nivel] || 'text-gray-600 bg-gray-50'
}

export default function MonthlyEval() {
  const [agents, setAgents] = useState([])
  const [agentId, setAgentId] = useState('')
  const [mes, setMes] = useState(new Date().getMonth() + 1)
  const [anio, setAnio] = useState(new Date().getFullYear())
  const [preview, setPreview] = useState(null)
  const [historial, setHistorial] = useState([])
  const [scores, setScores] = useState({
    velocidad_respuesta: 0,
    capacidad_trabajo: 0,
    uso_plantillas: 0,
    resolucion_primer_contacto: 0,
    actitud_trato: 0,
    conocimiento_producto: 0
  })
  const [observaciones, setObservaciones] = useState('')
  const [resultado, setResultado] = useState(null)
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    API.get('/agents/').then(res => setAgents(res.data.filter(a => a.activo)))
  }, [])

  useEffect(() => {
    if (agentId) {
      cargarPreview()
      cargarHistorial()
    }
  }, [agentId, mes, anio])

  const cargarPreview = async () => {
    try {
      const res = await API.get(`/monthly/preview/${agentId}?mes=${mes}&anio=${anio}`)
      setPreview(res.data)
    } catch { setPreview(null) }
  }

  const cargarHistorial = async () => {
    try {
      const res = await API.get(`/monthly/historial/${agentId}`)
      setHistorial(res.data)
    } catch { setHistorial([]) }
  }

  const handleScore = (key, value) => {
    const num = Math.min(10, Math.max(0, Math.round(Number(value))))
    setScores(prev => ({...prev, [key]: num}))
  }

  const calcularPreviewManual = () => {
    const pesos = {
      velocidad_respuesta: 2.0,
      capacidad_trabajo: 2.0,
      uso_plantillas: 1.5,
      resolucion_primer_contacto: 2.0,
      actitud_trato: 2.0,
      conocimiento_producto: 0.5
    }
    const totalPeso = Object.values(pesos).reduce((a, b) => a + b, 0)
    let suma = 0
    for (const [key, peso] of Object.entries(pesos)) {
      suma += scores[key] * peso
    }
    return Math.round((suma / (totalPeso * 10)) * 50)
  }

  const handleSubmit = async () => {
    if (!agentId) { setMensaje('Selecciona un agente'); return }
    setLoading(true)
    try {
      const res = await API.post('/monthly/evaluar', {
        agent_id: Number(agentId),
        mes, anio,
        ...scores,
        observaciones
      })
      setResultado(res.data)
      setMensaje('Evaluación guardada correctamente')
      cargarHistorial()
    } catch { setMensaje('Error al guardar la evaluación') }
    finally { setLoading(false) }
  }

  const exportarExcel = async (id) => {
    try {
      const res = await API.get(`/monthly/export/excel/${id}?mes=${mes}&anio=${anio}`, {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `evaluacion_${id}_mes${mes}_${anio}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch { console.error('Error al exportar') }
  }

  const ptsManualPreview = calcularPreviewManual()
  const ptsAutoPreview = preview?.parte_automatica?.puntuacion_automatica || 0
  const totalPreview = Math.min(100, ptsAutoPreview + ptsManualPreview)

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">Evaluación mensual de desempeño</h2>
        <p className="text-sm text-gray-500 mt-0.5">Calificación combinada: parte automática + parte manual</p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
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

      {preview && (
        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500">Conversaciones revisadas</p>
            <p className={`text-2xl font-bold mt-1 ${preview.parte_automatica.total_conversaciones >= 5 ? 'text-green-600' : 'text-yellow-600'}`}>
              {preview.parte_automatica.total_conversaciones}
              {preview.parte_automatica.total_conversaciones < 5 && <span className="text-xs ml-1 text-yellow-500">(mín. 5)</span>}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500">Puntos automáticos</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{ptsAutoPreview}<span className="text-sm text-gray-400">/50</span></p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500">Puntos manuales</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">{ptsManualPreview}<span className="text-sm text-gray-400">/50</span></p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500">Calificación estimada</p>
            <p className={`text-2xl font-bold mt-1 ${totalPreview >= 75 ? 'text-green-600' : totalPreview >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
              {totalPreview}
            </p>
          </div>
        </div>
      )}

      {agentId && (
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-800 mb-1">Parte automática</h3>
            <p className="text-xs text-gray-500 mb-4">Calculada por el sistema a partir de las conversaciones</p>
            {preview ? (
              <div className="space-y-2">
                <div className="flex justify-between text-sm py-2 border-b border-gray-50">
                  <span className="text-gray-600">Cumplimiento del checklist</span>
                  <span className="font-medium text-blue-600">{preview.parte_automatica.pts_cumplimiento} / 20</span>
                </div>
                <div className="flex justify-between text-sm py-2 border-b border-gray-50">
                  <span className="text-gray-600">Uso de palabras obligatorias</span>
                  <span className="font-medium text-blue-600">{preview.parte_automatica.pts_obligatorias} / 15</span>
                </div>
                <div className="flex justify-between text-sm py-2 border-b border-gray-50">
                  <span className="text-gray-600">Ausencia de palabras prohibidas</span>
                  <span className="font-medium text-blue-600">{preview.parte_automatica.pts_prohibidas} / 15</span>
                </div>
                <div className="flex justify-between text-sm py-2 font-semibold">
                  <span className="text-gray-700">Total automático</span>
                  <span className="text-blue-700">{preview.parte_automatica.puntuacion_automatica} / 50</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400">Selecciona un agente para ver la parte automática</p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-800 mb-1">Parte manual</h3>
            <p className="text-xs text-gray-500 mb-4">Califica cada criterio del 0 al 10</p>
            <div className="space-y-3">
              {criterios.map(c => (
                <div key={c.key}>
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <span className="text-sm font-medium text-gray-700">{c.label}</span>
                      <p className="text-xs text-gray-400">{c.desc}</p>
                    </div>
                    <span className="text-lg font-bold text-purple-600 w-8 text-right">{scores[c.key]}</span>
                  </div>
                  <input type="range" min="0" max="10" step="1"
                    value={scores[c.key]}
                    onChange={e => handleScore(c.key, e.target.value)}
                    className="w-full accent-purple-600" />
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>0</span><span>5</span><span>10</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {agentId && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
          <h3 className="font-semibold text-gray-800 mb-3">Observaciones del supervisor</h3>
          <textarea value={observaciones}
            onChange={e => setObservaciones(e.target.value)}
            placeholder="Escribe observaciones, comentarios o áreas de mejora para el agente..."
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none" />
          {mensaje && <p className="text-sm text-blue-600 mt-2">{mensaje}</p>}
          <button onClick={handleSubmit} disabled={loading}
            className="mt-3 bg-blue-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700 transition disabled:opacity-50 font-medium">
            {loading ? 'Guardando...' : 'Guardar evaluación mensual'}
          </button>
        </div>
      )}

      {resultado && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">Resultado final</h3>
          <div className="flex items-center gap-6">
            <div>
              <p className="text-sm text-gray-500">Calificación final</p>
              <p className={`text-5xl font-bold ${resultado.calificacion_final >= 75 ? 'text-green-600' : resultado.calificacion_final >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                {resultado.calificacion_final}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Nivel</p>
              <span className={`px-4 py-2 rounded-full font-semibold text-sm ${nivelColor(resultado.nivel)}`}>
                {resultado.nivel}
              </span>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-3">
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs text-blue-600">Parte automática</p>
                <p className="text-xl font-bold text-blue-700">{resultado.puntuacion_automatica}<span className="text-sm">/50</span></p>
              </div>
              <div className="bg-purple-50 rounded-lg p-3">
                <p className="text-xs text-purple-600">Parte manual</p>
                <p className="text-xl font-bold text-purple-700">{resultado.puntuacion_manual}<span className="text-sm">/50</span></p>
              </div>
            </div>
          </div>
          <button onClick={() => exportarExcel(Number(agentId))}
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition">
            Exportar evaluación a Excel
          </button>
        </div>
      )}

      {historial.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Historial de evaluaciones</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-5 py-3 text-gray-600 font-medium">Período</th>
                <th className="text-left px-5 py-3 text-gray-600 font-medium">Calificación</th>
                <th className="text-left px-5 py-3 text-gray-600 font-medium">Nivel</th>
                <th className="text-left px-5 py-3 text-gray-600 font-medium">Automático</th>
                <th className="text-left px-5 py-3 text-gray-600 font-medium">Manual</th>
                <th className="text-left px-5 py-3 text-gray-600 font-medium">Chats</th>
                <th className="text-left px-5 py-3 text-gray-600 font-medium">Excel</th>
              </tr>
            </thead>
            <tbody>
              {historial.map((h, i) => (
                <tr key={i} className="border-t border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-3 text-gray-700">{h.periodo}</td>
                  <td className="px-5 py-3">
                    <span className={`font-bold text-lg ${h.calificacion_final >= 75 ? 'text-green-600' : h.calificacion_final >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {h.calificacion_final}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${nivelColor(h.nivel)}`}>{h.nivel}</span>
                  </td>
                  <td className="px-5 py-3 text-blue-600">{h.puntuacion_automatica}/50</td>
                  <td className="px-5 py-3 text-purple-600">{h.puntuacion_manual}/50</td>
                  <td className="px-5 py-3 text-gray-600">{h.total_conversaciones}</td>
                  <td className="px-5 py-3">
                    <button onClick={() => exportarExcel(Number(agentId))}
                      className="bg-green-600 text-white text-xs px-3 py-1 rounded-lg hover:bg-green-700 transition">
                      Excel
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}