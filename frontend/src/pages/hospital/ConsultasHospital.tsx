import { useEffect, useState, useCallback } from 'react'
import {
  Calendar, Filter, ChevronLeft, ChevronRight,
  Loader2, Stethoscope
} from 'lucide-react'
import {
  hospitalService,
  type ConsultaHospital,
  type MedicoHospital
} from '@/services/hospitalService'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  agendada:      { label: 'Agendada',      color: 'text-yellow-700', bg: 'bg-yellow-100' },
  em_andamento:  { label: 'Em andamento',  color: 'text-blue-700',   bg: 'bg-blue-100' },
  concluida:     { label: 'Concluída',     color: 'text-green-700',  bg: 'bg-green-100' },
  cancelada:     { label: 'Cancelada',     color: 'text-red-700',    bg: 'bg-red-100' },
}

export default function ConsultasHospital() {
  const [consultas, setConsultas] = useState<ConsultaHospital[]>([])
  const [medicos, setMedicos] = useState<MedicoHospital[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [medicoFilter, setMedicoFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const LIMIT = 15

  // Load doctors list for filter
  useEffect(() => {
    hospitalService.getMedicos().then(setMedicos).catch(console.error)
  }, [])

  const loadConsultas = useCallback(async () => {
    try {
      setLoading(true)
      const result = await hospitalService.getConsultas({
        status: statusFilter || undefined,
        medico_id: medicoFilter || undefined,
        page,
        limit: LIMIT,
      })
      setConsultas(result.items)
      setTotal(result.total)
    } catch (err) {
      console.error('Erro ao carregar consultas:', err)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, medicoFilter, page])

  useEffect(() => {
    loadConsultas()
  }, [loadConsultas])

  const totalPages = Math.ceil(total / LIMIT)

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('pt-AO', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Consultas</h1>
        <p className="text-gray-600">{total} consulta(s) encontrada(s)</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 text-gray-500">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filtros:</span>
          </div>

          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Todos os status</option>
            <option value="agendada">Agendada</option>
            <option value="em_andamento">Em andamento</option>
            <option value="concluida">Concluída</option>
            <option value="cancelada">Cancelada</option>
          </select>

          <select
            value={medicoFilter}
            onChange={e => { setMedicoFilter(e.target.value); setPage(1) }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Todos os médicos</option>
            {medicos.map(m => (
              <option key={m.id} value={m.id}>{m.nome_completo}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
        </div>
      ) : consultas.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Nenhuma consulta encontrada.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Paciente</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Médico</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Data / Hora</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Status</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {consultas.map(c => {
                  const statusInfo = STATUS_CONFIG[c.status] || { label: c.status, color: 'text-gray-600', bg: 'bg-gray-100' }
                  return (
                    <tr key={c.id} className="hover:bg-gray-50/50 transition">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {c.paciente_nome}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Stethoscope className="w-4 h-4 text-green-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{c.medico_nome}</p>
                            {c.especialidade && (
                              <p className="text-xs text-gray-500">{c.especialidade}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {formatDate(c.data_hora_agendada)}
                          <span className="text-gray-400 ml-1">{formatTime(c.data_hora_agendada)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 capitalize">
                        {c.tipo?.replace('_', ' ') || '—'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                        {Number(c.preco || 0).toLocaleString('pt-AO')} Kz
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                Página {page} de {totalPages} ({total} resultados)
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Próxima
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
