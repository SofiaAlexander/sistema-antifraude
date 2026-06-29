import { useState, useEffect } from 'react'
import API from '../services/api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
               'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [mes, setMes] = useState(new Date().getMonth() + 1)
  const [anio, setAnio] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(false)

  const cargar = async () => {
    setLoading(true)
    try {
      const res = await API.get(`/reports/dashboard?mes=${mes}&anio=${anio}`)
      setData(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [mes, anio])

  const getColor = (p) => {
    if (p >= 80) return 'text-green-600 bg-green-50'
    if (p >= 60) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const getBarColor = (p) => {
    if (p >= 80) return '#16a34a'
    if (p >= 60) return '#ca8a04'
    return '#dc2626'
  }

  const exportarExcel = async (agentId) => {
    try {
      const res = await API.get(`/reports/agent/${agentId}/export/excel?mes=${mes}&anio=${anio}`, {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `reporte_agente_${agentId}_mes${mes}_${anio}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      console.error(err)
    }
  }

  const chartData = data?.agentes?.map(a => ({
    nombre: a.agente.split(' ')[0],
    puntuacion: Math.round(a.puntuacion_promedio),
    color: getBarColor(a.puntuacion_promedio)
  })) || []

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Dashboard general</h2>
          <p className="text-sm text-gray-500 mt-0.5">Resumen de desempeño por período</p>
        </div>
        <div className="flex gap-2">
          <select value={mes} onChange={e => setMes(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
            {meses.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
          <select value={anio} onChange={e => setAnio(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
            {[2024,2025,2026].map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      {loading && <p className="text-gray-500 text-sm">Cargando...</p>}

      {data && (
        <div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500">Agentes evaluados</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{data.total_agentes}</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500">Período</p>
              <p className="text-3xl font-bold text-gray-700 mt-1">{meses[mes-1]} {anio}</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500">Promedio general</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">
                {data.agentes.length > 0
                  ? Math.round(data.agentes.reduce((sum, a) => sum + a.puntuacion_promedio, 0) / data.agentes.length)
                  : 0}%
              </p>
            </div>
          </div>

          {data.agentes.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
              <h3 className="font-semibold text-gray-800 mb-4">Desempeño por agente</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="nombre" tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={v => `${v}%`} />
                  <Tooltip formatter={(value) => [`${value}%`, 'Puntuación']} />
                  <Bar dataKey="puntuacion" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {data.agentes.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center text-gray-400 shadow-sm">
              No hay evaluaciones para este período
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800">Detalle por agente</h3>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-5 py-3 text-gray-600 font-medium">Agente</th>
                    <th className="text-left px-5 py-3 text-gray-600 font-medium">Código</th>
                    <th className="text-left px-5 py-3 text-gray-600 font-medium">Área</th>
                    <th className="text-left px-5 py-3 text-gray-600 font-medium">Conversaciones</th>
                    <th className="text-left px-5 py-3 text-gray-600 font-medium">Puntuación</th>
                    <th className="text-left px-5 py-3 text-gray-600 font-medium">Exportar</th>
                  </tr>
                </thead>
                <tbody>
                  {data.agentes.map((a, i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition">
                      <td className="px-5 py-3 font-medium text-gray-800">{a.agente}</td>
                      <td className="px-5 py-3 text-gray-600">{a.codigo}</td>
                      <td className="px-5 py-3 text-gray-600">{a.area}</td>
                      <td className="px-5 py-3 text-gray-600">{a.total_conversaciones}</td>
                      <td className="px-5 py-3">
                        <span className={`px-3 py-1 rounded-full font-semibold text-xs ${getColor(a.puntuacion_promedio)}`}>
                          {Math.round(a.puntuacion_promedio)}%
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <button onClick={() => exportarExcel(a.agent_id)}
                          className="bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-green-700 transition">
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
      )}
    </div>
  )
}