import { useState, useEffect } from 'react'
import API from '../services/api'

const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
               'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export default function PegarLeadsales() {
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
    API.get('/agents/').then(res => {
      setAgentes(res.data.filter(a => a.activo && a.nombre_leadsales))
    })
  }, [])

  const getColor = (p) => {
    if (p >= 80) return 'text-green-600'
    if (p >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const handleAnalizar = async () => {
    if (!texto.trim()) { setError('Pega el texto del chat'); return }
    if (!cliente.trim()) { setError('Escribe el nombre del cliente'); return }
    setError('')
    setLoading(true)
    setResultado(null)
    try {
      const res = await API.post('/conversations/leadsales', {
        mes, anio, cliente, fecha, texto
      })
      setResultado(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al analizar el chat')
    } finally { setLoading(false) }
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">Pegar chat de Leadsales</h2>
        <p className="text-sm text-gray-500 mt-0.5">El sistema detecta automáticamente qué agentes participaron y los evalúa por separado</p>
      </div>

      {agentes.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
          <p className="text-sm font-medium text-yellow-800">⚠️ No hay agentes con nombre de Leadsales configurado</p>
          <p className="text-xs text-yellow-700 mt-1">Ve a <strong>Agentes</strong> y agrega el nombre exacto como aparece en Leadsales para cada agente.</p>
        </div>
      )}

      {agentes.length > 0 && (
        <div className="bg-blue-50 rounded-xl p-4 mb-6">
          <p className="text-xs font-medium text-blue-700 mb-2">Agentes configurados para detección automática:</p>
          <div className="flex flex-wrap gap-2">
            {agentes.map(a => (
              <span key={a.id} className="bg-white border border-blue-200 text-blue-700 text-xs px-3 py-1 rounded-full">
                {a.nombre} <span className="text-blue-400">→ "{a.nombre_leadsales}"</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nombre del cliente</label>
            <input placeholder="Ej. Juan Pérez" value={cliente}
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
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Pega aquí el chat completo de Leadsales
          </label>
          <textarea value={texto}
            onChange={e => setTexto(e.target.value)}
            placeholder="Copia y pega el chat completo tal como aparece en Leadsales. El sistema detectará automáticamente qué escribió cada agente..."
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-800 mb-1">{resultado.mensaje}</h3>
            <p className="text-xs text-gray-500">Cliente: {resultado.cliente} · Fecha: {resultado.fecha}</p>
          </div>

          {resultado.resultados.map((r, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-800">{r.agente}</p>
                  <p className="text-xs text-gray-500">Agente detectado automáticamente</p>
                </div>
                <p className={`text-3xl font-bold ${getColor(r.puntuacion)}`}>{r.puntuacion}%</p>
              </div>

              <div className="p-4">
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-green-700 mb-1">Obligatorias encontradas</p>
                    {r.palabras_obligatorias_encontradas.length > 0 ? (
                      r.palabras_obligatorias_encontradas.map((p, j) => (
                        <span key={j} className="inline-block bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full mr-1 mb-1">{p}</span>
                      ))
                    ) : <p className="text-xs text-green-600">Ninguna</p>}
                  </div>
                  <div className="bg-red-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-red-700 mb-1">Obligatorias faltantes</p>
                    {r.palabras_obligatorias_faltantes.length > 0 ? (
                      r.palabras_obligatorias_faltantes.map((p, j) => (
                        <span key={j} className="inline-block bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full mr-1 mb-1">{p}</span>
                      ))
                    ) : <p className="text-xs text-red-600">Ninguna</p>}
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-orange-700 mb-1">Prohibidas encontradas</p>
                    {r.palabras_prohibidas_encontradas.length > 0 ? (
                      r.palabras_prohibidas_encontradas.map((p, j) => (
                        <span key={j} className="inline-block bg-orange-100 text-orange-800 text-xs px-2 py-0.5 rounded-full mr-1 mb-1">{p}</span>
                      ))
                    ) : <p className="text-xs text-orange-600">Ninguna</p>}
                  </div>
                </div>

                {Object.keys(r.frecuencias).length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-600 mb-2">Frecuencia de palabras clave</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(r.frecuencias).map(([palabra, freq], j) => (
                        <span key={j} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full">
                          {palabra} <strong>x{freq}</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-600 mb-1">Detalle por criterio</p>
                  {r.detalle.map((d, j) => (
                    <div key={j} className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs ${d.cumplido ? 'bg-green-50' : 'bg-red-50'}`}>
                      <span className={`font-medium ${d.cumplido ? 'text-green-700' : 'text-red-700'}`}>{d.criterio}</span>
                      <span className={d.cumplido ? 'text-green-600' : 'text-red-500'}>
                        {d.cumplido ? 'Cumplido' : 'No cumplido'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}