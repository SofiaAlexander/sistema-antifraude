import { useState, useEffect } from 'react'
import API from '../services/api'

const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
               'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export default function Reports() {
  const [data, setData] = useState(null)
  const [mes, setMes] = useState(new Date().getMonth() + 1)
  const [anio, setAnio] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(false)

  const cargar = async () => {
    setLoading(true)
    try {
      const res = await API.get(`/reports/supervisor?mes=${mes}&anio=${anio}`)
      setData(res.data)
    } catch (err) {
      console.error(err)
    } finally { setLoading(false) }
  }

  useEffect(() => { cargar() }, [mes, anio])

  const getCalificacionColor = (cal) => {
    const map = {
      'Excelente': 'bg-green-50 text-green-700',
      'Bueno': 'bg-blue-50 text-blue-700',
      'Regular': 'bg-yellow-50 text-yellow-700',
      'Deficiente': 'bg-red-50 text-red-700'
    }
    return map[cal] || 'bg-gray-50 text-gray-700'
  }

  const getPuntuacionColor = (p) => {
    if (p >= 80) return 'text-green-600'
    if (p >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const exportarExcel = async () => {
    try {
      const res = await API.get(`/reports/supervisor/export/excel?mes=${mes}&anio=${anio}`, {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `reporte_supervisor_mes${mes}_${anio}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) { console.error(err) }
  }

  const exportarExcelAgente = async (agentId) => {
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
    } catch (err) { console.error(err) }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Reporte del supervisor</h2>
          <p className="text-sm text-gray-500 mt-0.5">Análisis general de desempeño por período</p>
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
          <button onClick={exportarExcel}
            className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-green-700 transition">
            Exportar Excel
          </button>
        </div>
      </div>

      {loading && <p className="text-gray-500 text-sm">Cargando...</p>}

      {data && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500">Agentes evaluados</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{data.total_agentes}</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500">Palabras prohibidas detectadas</p>
              <p className="text-3xl font-bold text-red-500 mt-1">{data.prohibidas_detectadas.length}</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500">Período</p>
              <p className="text-3xl font-bold text-gray-700 mt-1">{meses[mes-1]} {anio}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Desempeño por agente</h3>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 text-gray-600 font-medium">Agente</th>
                  <th className="text-left px-5 py-3 text-gray-600 font-medium">Código</th>
                  <th className="text-left px-5 py-3 text-gray-600 font-medium">Área</th>
                  <th className="text-left px-5 py-3 text-gray-600 font-medium">Conversaciones</th>
                  <th className="text-left px-5 py-3 text-gray-600 font-medium">Promedio</th>
                  <th className="text-left px-5 py-3 text-gray-600 font-medium">Máx.</th>
                  <th className="text-left px-5 py-3 text-gray-600 font-medium">Mín.</th>
                  <th className="text-left px-5 py-3 text-gray-600 font-medium">Calificación</th>
                  <th className="text-left px-5 py-3 text-gray-600 font-medium">Excel</th>
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
                      <span className={`font-bold ${getPuntuacionColor(a.puntuacion_promedio)}`}>{a.puntuacion_promedio}%</span>
                    </td>
                    <td className="px-5 py-3 text-green-600">{a.puntuacion_maxima}%</td>
                    <td className="px-5 py-3 text-red-500">{a.puntuacion_minima}%</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCalificacionColor(a.calificacion)}`}>
                        {a.calificacion}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <button onClick={() => exportarExcelAgente(a.agent_id)}
                        className="bg-green-600 text-white text-xs px-3 py-1 rounded-lg hover:bg-green-700 transition">
                        Excel
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-800 mb-3">Palabras más usadas</h3>
              {data.palabras_mas_usadas.length === 0 ? (
                <p className="text-sm text-gray-400">Sin datos</p>
              ) : (
                <div className="space-y-2">
                  {data.palabras_mas_usadas.map((p, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{p.palabra}</span>
                      <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">x{p.frecuencia}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-800 mb-3">Obligatorias más omitidas</h3>
              {data.obligatorias_mas_omitidas.length === 0 ? (
                <p className="text-sm text-green-600">Sin omisiones</p>
              ) : (
                <div className="space-y-2">
                  {data.obligatorias_mas_omitidas.map((p, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{p.palabra}</span>
                      <span className="bg-red-50 text-red-700 text-xs px-2 py-0.5 rounded-full font-medium">{p.veces}x omitida</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-800 mb-3">Palabras prohibidas</h3>
              {data.prohibidas_detectadas.length === 0 ? (
                <p className="text-sm text-green-600">Ninguna detectada</p>
              ) : (
                <div className="space-y-2">
                  {data.prohibidas_detectadas.map((p, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm text-red-700 font-medium">{p.palabra}</span>
                      <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-medium">{p.veces}x detectada</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {data && data.total_agentes === 0 && (
        <div className="bg-white rounded-xl p-8 text-center text-gray-400 shadow-sm">
          No hay evaluaciones para este período
        </div>
      )}
    </div>
  )
}